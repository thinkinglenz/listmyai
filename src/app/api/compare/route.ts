import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ─── In-memory rate limiter (still useful to prevent DB abuse) ───────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 20      // generous since it's free now
const RATE_LIMIT_WINDOW = 3600

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 1000) }
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 600_000)

// ─── Supabase ────────────────────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'lmai-salt').digest('hex').slice(0, 16)
}

function logComparison(params: {
  tool_a_slug: string; tool_b_slug: string
  tool_a_name: string; tool_b_name: string
  ip_hash: string; use_case: string | null
  cache_hit: boolean; tokens_input: number; tokens_output: number
  rate_limited: boolean; model: string
}) {
  const supabase = getSupabase()
  supabase.from('comparison_logs').insert(params).then(() => {}, () => {})
}

// ─── Data-driven comparison engine (ZERO API cost) ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildComparison(a: any, b: any) {
  // ── Score dimensions from real data ─────────────────────────────────────

  // Community Score: based on upvotes + ratings
  const aComm = Math.min(10, Math.round(((a.upvotes || 0) / Math.max(a.upvotes || 1, b.upvotes || 1)) * 7 + ((a.rating_avg || 0) / 5) * 3))
  const bComm = Math.min(10, Math.round(((b.upvotes || 0) / Math.max(a.upvotes || 1, b.upvotes || 1)) * 7 + ((b.rating_avg || 0) / 5) * 3))

  // Value score: free trial, pricing model
  const valueScore = (t: typeof a) => {
    let s = 5
    if (t.has_free_trial) s += 2
    if (t.pricing_model === 'Free') s += 3
    else if (t.pricing_model === 'Freemium') s += 2
    else if (t.pricing_model === 'Free Trial') s += 1
    if (t.starting_price) {
      const price = parseFloat(t.starting_price.replace(/[^0-9.]/g, ''))
      if (price > 0 && price <= 10) s += 1
      else if (price > 50) s -= 1
    }
    return Math.min(10, Math.max(1, s))
  }

  // Features score: API, no-code, GDPR
  const featureScore = (t: typeof a) => {
    let s = 5
    if (t.has_api) s += 2
    if (t.no_code) s += 1
    if (t.gdpr_compliant) s += 1
    if (t.description && t.description.length > 200) s += 1
    return Math.min(10, Math.max(1, s))
  }

  // Popularity: views + clicks + upvotes
  const popScore = (t: typeof a, other: typeof a) => {
    const tTotal = (t.view_count || 0) + (t.click_count || 0) * 2 + (t.upvotes || 0) * 5
    const oTotal = (other.view_count || 0) + (other.click_count || 0) * 2 + (other.upvotes || 0) * 5
    const maxTotal = Math.max(tTotal, oTotal, 1)
    return Math.min(10, Math.max(1, Math.round((tTotal / maxTotal) * 10)))
  }

  // Trust: rating count, verified, featured
  const trustScore = (t: typeof a) => {
    let s = 4
    if ((t.rating_count || 0) > 0) s += 1
    if ((t.rating_count || 0) >= 5) s += 1
    if ((t.rating_count || 0) >= 20) s += 1
    if (t.is_verified) s += 1
    if (t.is_featured) s += 1
    if ((t.rating_avg || 0) >= 4) s += 1
    return Math.min(10, Math.max(1, s))
  }

  const scores = {
    community:      { a: aComm, b: bComm, label: 'Community Score' },
    value_for_money:{ a: valueScore(a), b: valueScore(b), label: 'Value for Money' },
    features:       { a: featureScore(a), b: featureScore(b), label: 'Features & Flexibility' },
    popularity:     { a: popScore(a, b), b: popScore(b, a), label: 'Popularity' },
    trust:          { a: trustScore(a), b: trustScore(b), label: 'Trust & Reviews' },
  }

  // ── Overall winner ──────────────────────────────────────────────────────
  const totalA = Object.values(scores).reduce((sum, d) => sum + d.a, 0)
  const totalB = Object.values(scores).reduce((sum, d) => sum + d.b, 0)
  const winner = totalA > totalB ? a.slug : totalB > totalA ? b.slug : 'tie'

  // ── Build pros/cons from data ───────────────────────────────────────────
  function buildPros(t: typeof a) {
    const pros: string[] = []
    if (t.pricing_model === 'Free') pros.push('Completely free to use')
    else if (t.has_free_trial) pros.push('Offers a free trial to get started')
    else if (t.pricing_model === 'Freemium') pros.push('Freemium plan available')
    if (t.has_api) pros.push('API access for integrations and automation')
    if (t.no_code) pros.push('No-code friendly — no technical skills needed')
    if (t.gdpr_compliant) pros.push('GDPR compliant for data privacy')
    if ((t.rating_avg || 0) >= 4) pros.push(`Strong user rating (${(t.rating_avg || 0).toFixed(1)}/5 from ${t.rating_count || 0} reviews)`)
    if ((t.upvotes || 0) > 10) pros.push(`Popular in the community (${t.upvotes} upvotes)`)
    if ((t.view_count || 0) > 100) pros.push('High visibility and interest from users')
    if (pros.length === 0) pros.push('Listed in the directory for easy discovery')
    return pros.slice(0, 4)
  }

  function buildCons(t: typeof a) {
    const cons: string[] = []
    if (!t.has_free_trial && t.pricing_model !== 'Free' && t.pricing_model !== 'Freemium') cons.push('No free trial available')
    if (!t.has_api) cons.push('No API access for custom integrations')
    if ((t.rating_count || 0) === 0) cons.push('No user ratings yet — limited community feedback')
    else if ((t.rating_avg || 0) < 3.5 && (t.rating_count || 0) > 0) cons.push(`Below-average user rating (${(t.rating_avg || 0).toFixed(1)}/5)`)
    if (!t.gdpr_compliant) cons.push('GDPR compliance not confirmed')
    if (!t.description || t.description.length < 50) cons.push('Limited product description available')
    if (cons.length === 0) cons.push('No major drawbacks identified')
    return cons.slice(0, 3)
  }

  // ── Best for ────────────────────────────────────────────────────────────
  function bestFor(t: typeof a) {
    const parts: string[] = []
    if (t.pricing_model === 'Free') parts.push('budget-conscious')
    else if (t.pricing_model === 'Enterprise') parts.push('enterprise')
    else parts.push('individual and team')
    parts.push('users')
    if (t.has_api) parts.push('who need API integrations')
    else if (t.no_code) parts.push('who prefer no-code solutions')
    else parts.push(`looking for ${t.category_name || 'AI'} tools`)
    return parts.join(' ')
  }

  // ── Summary and verdict ─────────────────────────────────────────────────
  const winnerName = winner === 'tie' ? null : (winner === a.slug ? a.name : b.name)
  const loserName = winner === 'tie' ? null : (winner === a.slug ? b.name : a.name)

  const summary = winner === 'tie'
    ? `${a.name} and ${b.name} are evenly matched across all dimensions. Your choice should depend on specific needs like pricing preference and integration requirements.`
    : `${winnerName} edges out ${loserName} based on community data, scoring ${Math.max(totalA, totalB)} vs ${Math.min(totalA, totalB)} across five dimensions.`

  const verdictParts: string[] = []
  if (winner !== 'tie') {
    verdictParts.push(`Based on available data, ${winnerName} has a stronger overall profile.`)
  } else {
    verdictParts.push(`Both tools are competitive choices in their category.`)
  }
  // Pricing comparison
  if (a.pricing_model && b.pricing_model) {
    if (a.pricing_model === b.pricing_model) {
      verdictParts.push(`Both use a ${a.pricing_model.toLowerCase()} pricing model.`)
    } else {
      verdictParts.push(`${a.name} uses ${a.pricing_model.toLowerCase()} pricing while ${b.name} is ${b.pricing_model.toLowerCase()}.`)
    }
  }
  verdictParts.push(`We recommend trying both to see which fits your workflow best.`)

  return {
    winner,
    summary,
    scores,
    pros_a: buildPros(a),
    cons_a: buildCons(a),
    pros_b: buildPros(b),
    cons_b: buildCons(b),
    best_for_a: bestFor(a),
    best_for_b: bestFor(b),
    verdict: verdictParts.join(' '),
  }
}

// ─── API Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { tool_a, tool_b, use_case } = await req.json()
    if (!tool_a || !tool_b) return NextResponse.json({ error: 'tool_a and tool_b required' }, { status: 400 })
    if (tool_a === tool_b) return NextResponse.json({ error: 'Please select two different tools' }, { status: 400 })

    // ── Rate limit (generous since no API cost) ───────────────────────────
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const ipHash = hashIP(rawIp)

    const { allowed, remaining, resetIn } = checkRateLimit(rawIp)
    if (!allowed) {
      logComparison({
        tool_a_slug: tool_a, tool_b_slug: tool_b,
        tool_a_name: tool_a, tool_b_name: tool_b,
        ip_hash: ipHash, use_case: use_case || null,
        cache_hit: false, tokens_input: 0, tokens_output: 0,
        rate_limited: true, model: 'data-driven',
      })
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': String(resetIn) } }
      )
    }

    // ── Fetch tools from DB ───────────────────────────────────────────────
    const supabase = getSupabase()

    // Try full select first; fall back to minimal if columns don't exist
    let { data: tools, error: fetchErr } = await supabase
      .from('ai_tools')
      .select(`
        name, slug, tagline, description, website,
        pricing_model, starting_price, has_free_trial, has_api,
        no_code, gdpr_compliant, is_featured, is_verified,
        upvotes, rating_avg, rating_count, view_count, click_count,
        categories(name)
      `)
      .in('slug', [tool_a, tool_b])

    // Fallback: if some columns don't exist, use simpler select
    if (fetchErr) {
      const fallback = await supabase
        .from('ai_tools')
        .select('name, slug, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api, is_featured, upvotes, rating_avg, rating_count, view_count, click_count')
        .in('slug', [tool_a, tool_b])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools = fallback.data as any
    }

    const toolData = tools ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = toolData.find((t: any) => t.slug === tool_a)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = toolData.find((t: any) => t.slug === tool_b)

    if (!a || !b) {
      return NextResponse.json({ error: 'One or both tools not found', debug: { slugs: [tool_a, tool_b], found: toolData.length, fetchErr: fetchErr?.message } }, { status: 404 })
    }

    // Add category name from join
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aWithCat = { ...a, category_name: (a as any).categories?.name }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bWithCat = { ...b, category_name: (b as any).categories?.name }

    // ── Build comparison from real data ───────────────────────────────────
    const comparison = buildComparison(aWithCat, bWithCat)
    const result = { comparison, tool_a: a, tool_b: b }

    // ── Log (zero tokens, zero cost) ──────────────────────────────────────
    logComparison({
      tool_a_slug: tool_a, tool_b_slug: tool_b,
      tool_a_name: a.name, tool_b_name: b.name,
      ip_hash: ipHash, use_case: use_case || null,
      cache_hit: false, tokens_input: 0, tokens_output: 0,
      rate_limited: false, model: 'data-driven',
    })

    return NextResponse.json(result, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
