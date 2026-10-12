// The quiz recommender.
//
// This is the only public endpoint that spends money: every call is a Claude
// request with ~150 listings in the prompt, around a cent each. It shipped
// with no auth, no rate limit and no cache, so anyone could loop it until the
// prepaid balance was gone and every cron that shares the key stopped working.
//
// Three guards now, all leaning on quiz_results, which this route already
// wrote to:
//   · identical answers are served from cache and cost nothing
//   · one IP gets a fixed number of fresh generations per hour
//   · the candidate list is narrowed by the user's own answers first
//
// Upstream errors are logged, never returned: the raw Anthropic reply was
// being shown to visitors, Plans-and-Billing wording included.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Fresh generations allowed per IP per hour. A real person needs one or two. */
const PER_IP_PER_HOUR = 8
/** How long an identical set of answers is served from cache. */
const CACHE_DAYS = 14
/** Listings sent to the model. Fewer, better-matched beats more. */
const CANDIDATES = 60

/** IPs are hashed, never stored: this is abuse control, not analytics. */
function ipHashOf(req: NextRequest): string {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  return createHash('sha256').update(ip + (process.env.CRON_SECRET ?? '')).digest('hex').slice(0, 32)
}

const stableHash = (v: unknown) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 32)

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json()
    if (!answers) return NextResponse.json({ error: 'answers required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('[find] ANTHROPIC_API_KEY not configured')
      return NextResponse.json({ error: 'Recommendations are unavailable right now.' }, { status: 503 })
    }

    const answersHash = stableHash(answers)
    const ipHash = ipHashOf(req)

    // 1. Same quiz, same answer. Costs nothing and returns faster.
    const since = new Date(Date.now() - CACHE_DAYS * 86_400_000).toISOString()
    const { data: cached } = await supabase
      .from('quiz_results')
      .select('recommendations')
      .eq('answers_hash', answersHash)
      .gte('created_at', since)
      .limit(1)
      .maybeSingle()
    if (cached?.recommendations) {
      return NextResponse.json({ recommendations: cached.recommendations, cached: true })
    }

    // 2. Per-IP ceiling on fresh generations.
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count } = await supabase
      .from('quiz_results')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', hourAgo)
    if ((count ?? 0) >= PER_IP_PER_HOUR) {
      return NextResponse.json(
        { error: 'You have run this a lot in the last hour. Try again shortly.' },
        { status: 429 }
      )
    }

    // Sending every listing wasted most of the prompt on tools the answers
    // already ruled out. Filter first, then send a shorter, better list.
    const wanted = JSON.stringify(answers).toLowerCase()
    let query = supabase
      .from('ai_tools')
      .select('id, name, slug, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api')
      .eq('status', 'active')
    if (wanted.includes('free')) query = query.in('pricing_model', ['free', 'freemium'])
    const { data: tools } = await query
      .order('upvotes', { ascending: false })
      .limit(CANDIDATES)

    const toolList = (tools ?? []).map(t =>
      `- ${t.name} (${t.slug}): ${t.tagline || t.description?.slice(0, 80) || ''} | pricing: ${t.pricing_model} ${t.starting_price ? `/ ${t.starting_price}` : ''} | free_trial: ${t.has_free_trial}`
    ).join('\n')

    const prompt = `You are an AI tools advisor. A user answered a 5-question quiz. Based on their answers, recommend the top 5 most suitable AI tools from the list below.

USER ANSWERS:
${JSON.stringify(answers, null, 2)}

AVAILABLE TOOLS:
${toolList || 'No tools in database yet — return generic recommendations.'}

Return ONLY a JSON array of exactly 5 objects with this structure:
[
  {
    "slug": "tool-slug",
    "name": "Tool Name",
    "reason": "One sentence why this fits their needs",
    "fit_percent": 95,
    "highlight": "Key feature for this user"
  }
]

Rules:
- fit_percent should be realistic (60-98)
- reason must directly reference their quiz answers
- Only use slugs from the tools list above
- If database is empty, use real AI tools you know (chatgpt, claude, midjourney, etc.) with placeholder slugs`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.warn('[find] Claude', response.status, (await response.text()).slice(0, 200))
      return NextResponse.json({ error: 'Recommendations are unavailable right now.' }, { status: 503 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('[find] no JSON array in the model reply')
      return NextResponse.json({ error: 'Recommendations are unavailable right now.' }, { status: 503 })
    }

    const recommendations = JSON.parse(jsonMatch[0])

    // Awaited, not fire-and-forget: this row is the cache entry and the rate
    // limiter's record. Losing it means the next identical quiz pays again.
    await supabase.from('quiz_results').insert({
      answers,
      recommendations,
      answers_hash: answersHash,
      ip_hash: ipHash,
    })

    return NextResponse.json({ recommendations })
  } catch (err) {
    console.warn('[find] failed', err)
    return NextResponse.json({ error: 'Recommendations are unavailable right now.' }, { status: 503 })
  }
}
