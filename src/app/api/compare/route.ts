import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ─── In-memory rate limiter ──────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 3600

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 1000) }
}

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 600_000)

// ─── Simple comparison cache ─────────────────────────────────────────────────
const compareCache = new Map<string, { result: object; cachedAt: number }>()
const CACHE_TTL = 86400_000 // 24h

function getCacheKey(slugA: string, slugB: string, useCase?: string): string {
  const sorted = [slugA, slugB].sort()
  return `${sorted[0]}:${sorted[1]}:${useCase || ''}`
}

// ─── Supabase ────────────────────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Hash IP for privacy (we don't store raw IPs)
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'lmai-salt').digest('hex').slice(0, 16)
}

// Log comparison to Supabase (fire-and-forget, never blocks the response)
function logComparison(params: {
  tool_a_slug: string
  tool_b_slug: string
  tool_a_name: string
  tool_b_name: string
  ip_hash: string
  use_case: string | null
  cache_hit: boolean
  tokens_input: number
  tokens_output: number
  rate_limited: boolean
  model: string
}) {
  const supabase = getSupabase()
  supabase.from('comparison_logs').insert(params).then(() => {}, () => {})
}

export async function POST(req: NextRequest) {
  try {
    const { tool_a, tool_b, use_case } = await req.json()
    if (!tool_a || !tool_b) return NextResponse.json({ error: 'tool_a and tool_b required' }, { status: 400 })
    if (tool_a === tool_b) return NextResponse.json({ error: 'Please select two different tools' }, { status: 400 })

    // ── IP + rate limit ───────────────────────────────────────────────────
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const ipHash = hashIP(rawIp)

    const { allowed, remaining, resetIn } = checkRateLimit(rawIp)

    if (!allowed) {
      // Log the rate-limited attempt
      logComparison({
        tool_a_slug: tool_a, tool_b_slug: tool_b,
        tool_a_name: tool_a, tool_b_name: tool_b,
        ip_hash: ipHash, use_case: use_case || null,
        cache_hit: false, tokens_input: 0, tokens_output: 0,
        rate_limited: true, model: '',
      })

      return NextResponse.json(
        { error: `Rate limit exceeded. You can make ${RATE_LIMIT_MAX} comparisons per hour. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(resetIn),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // ── Check cache ───────────────────────────────────────────────────────
    const cacheKey = getCacheKey(tool_a, tool_b, use_case)
    const cached = compareCache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      // Log cache hit
      logComparison({
        tool_a_slug: tool_a, tool_b_slug: tool_b,
        tool_a_name: tool_a, tool_b_name: tool_b,
        ip_hash: ipHash, use_case: use_case || null,
        cache_hit: true, tokens_input: 0, tokens_output: 0,
        rate_limited: false, model: 'cache',
      })

      return NextResponse.json(cached.result, {
        headers: { 'X-RateLimit-Remaining': String(remaining), 'X-Cache': 'HIT' },
      })
    }

    // ── Validate API key ──────────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    // ── Fetch tools from DB ───────────────────────────────────────────────
    const supabase = getSupabase()
    const { data: tools } = await supabase
      .from('ai_tools')
      .select('name, slug, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api')
      .in('slug', [tool_a, tool_b])

    const toolData = tools ?? []
    const a = toolData.find(t => t.slug === tool_a)
    const b = toolData.find(t => t.slug === tool_b)

    const toolAInfo = a ? `${a.name}: ${a.tagline || ''} | ${a.description?.slice(0, 200) || ''} | pricing: ${a.pricing_model} ${a.starting_price || ''} | free_trial: ${a.has_free_trial} | api: ${a.has_api}` : tool_a
    const toolBInfo = b ? `${b.name}: ${b.tagline || ''} | ${b.description?.slice(0, 200) || ''} | pricing: ${b.pricing_model} ${b.starting_price || ''} | free_trial: ${b.has_free_trial} | api: ${b.has_api}` : tool_b

    const modelId = 'claude-haiku-4-5'

    const prompt = `Compare these two AI tools for a user${use_case ? ` who wants to: ${use_case}` : ''}.

TOOL A: ${toolAInfo}
TOOL B: ${toolBInfo}

Return ONLY a JSON object with this exact structure:
{
  "winner": "slug-of-better-tool-or-tie",
  "summary": "2-sentence overall verdict",
  "scores": {
    "ease_of_use":    { "a": 8, "b": 7, "label": "Ease of Use" },
    "features":       { "a": 9, "b": 8, "label": "Features" },
    "value_for_money":{ "a": 7, "b": 9, "label": "Value for Money" },
    "integrations":   { "a": 8, "b": 6, "label": "Integrations" },
    "support":        { "a": 7, "b": 8, "label": "Support" }
  },
  "pros_a": ["pro1", "pro2", "pro3"],
  "cons_a": ["con1", "con2"],
  "pros_b": ["pro1", "pro2", "pro3"],
  "cons_b": ["con1", "con2"],
  "best_for_a": "Ideal user type for Tool A in one sentence",
  "best_for_b": "Ideal user type for Tool B in one sentence",
  "verdict": "Final recommendation paragraph (3-4 sentences)"
}

Scores are out of 10. Be honest and specific.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse Claude response' }, { status: 500 })

    // Extract token usage from API response
    const tokensInput = data.usage?.input_tokens ?? 0
    const tokensOutput = data.usage?.output_tokens ?? 0

    const comparison = JSON.parse(jsonMatch[0])
    const result = { comparison, tool_a: a, tool_b: b }

    // ── Log to Supabase ───────────────────────────────────────────────────
    logComparison({
      tool_a_slug: tool_a,
      tool_b_slug: tool_b,
      tool_a_name: a?.name || tool_a,
      tool_b_name: b?.name || tool_b,
      ip_hash: ipHash,
      use_case: use_case || null,
      cache_hit: false,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      rate_limited: false,
      model: modelId,
    })

    // ── Cache ─────────────────────────────────────────────────────────────
    compareCache.set(cacheKey, { result, cachedAt: Date.now() })

    return NextResponse.json(result, {
      headers: { 'X-RateLimit-Remaining': String(remaining), 'X-Cache': 'MISS' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
