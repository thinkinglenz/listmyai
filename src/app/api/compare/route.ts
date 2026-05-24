import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ─── Rate limiter ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 30
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
  rate_limited: boolean
}) {
  const supabase = getSupabase()
  supabase.from('comparison_logs').insert({
    ...params,
    cache_hit: false, tokens_input: 0, tokens_output: 0, model: 'feature-table',
  }).then(() => {}, () => {})
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parsePrice(s?: string | null): number | null {
  if (!s) return null
  const m = String(s).match(/[\d]+(\.\d+)?/)
  if (!m) return null
  const n = parseFloat(m[0])
  return isNaN(n) ? null : n
}

function prettyPricing(model?: string | null): string {
  if (!model) return 'Unknown'
  const map: Record<string, string> = {
    free: 'Free',
    freemium: 'Freemium',
    free_trial: 'Free trial',
    subscription: 'Subscription',
    pay_per_use: 'Pay-per-use',
    one_time: 'One-time purchase',
    enterprise: 'Enterprise',
  }
  return map[model.toLowerCase()] ?? model
}

// ─── Honest comparison builder ───────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function buildComparison(a: any, b: any) {
  // Feature matrix — rows are facts, not made-up scores.
  type Row = { label: string; a: string; b: string; highlight?: 'a' | 'b' | 'tie' | 'none' }
  const rows: Row[] = []

  // Pricing model
  rows.push({
    label: 'Pricing model',
    a: prettyPricing(a.pricing_model),
    b: prettyPricing(b.pricing_model),
    highlight: a.pricing_model === b.pricing_model ? 'tie' : 'none',
  })

  // Starting price
  const aPrice = parsePrice(a.starting_price)
  const bPrice = parsePrice(b.starting_price)
  let priceHi: Row['highlight'] = 'none'
  if (aPrice != null && bPrice != null) {
    if (aPrice < bPrice) priceHi = 'a'
    else if (bPrice < aPrice) priceHi = 'b'
    else priceHi = 'tie'
  } else if (aPrice == null && bPrice != null) {
    priceHi = 'a' // probably free
  } else if (bPrice == null && aPrice != null) {
    priceHi = 'b'
  }
  rows.push({
    label: 'Starting price',
    a: a.starting_price || (a.pricing_model === 'free' ? '$0' : '—'),
    b: b.starting_price || (b.pricing_model === 'free' ? '$0' : '—'),
    highlight: priceHi,
  })

  // Free trial
  rows.push({
    label: 'Free trial',
    a: a.has_free_trial ? (a.trial_duration ? `Yes · ${a.trial_duration}` : 'Yes') : 'No',
    b: b.has_free_trial ? (b.trial_duration ? `Yes · ${b.trial_duration}` : 'Yes') : 'No',
    highlight: a.has_free_trial === b.has_free_trial ? 'tie' : (a.has_free_trial ? 'a' : 'b'),
  })

  // API
  rows.push({
    label: 'Public API',
    a: a.has_api ? 'Yes' : 'No',
    b: b.has_api ? 'Yes' : 'No',
    highlight: a.has_api === b.has_api ? 'tie' : (a.has_api ? 'a' : 'b'),
  })

  // Category
  if (a.category_name || b.category_name) {
    rows.push({
      label: 'Category',
      a: a.category_name || '—',
      b: b.category_name || '—',
      highlight: a.category_name && a.category_name === b.category_name ? 'tie' : 'none',
    })
  }

  // Promo code
  const aPromo = !!(a.promo_code && String(a.promo_code).trim())
  const bPromo = !!(b.promo_code && String(b.promo_code).trim())
  if (aPromo || bPromo) {
    rows.push({
      label: 'Promo / discount',
      a: aPromo ? (a.promo_code as string) : '—',
      b: bPromo ? (b.promo_code as string) : '—',
      highlight: aPromo === bPromo ? 'tie' : (aPromo ? 'a' : 'b'),
    })
  }

  // Community ratings — only show if at least one has data
  const aRating = Number(a.rating_avg) || 0
  const bRating = Number(b.rating_avg) || 0
  const aRC = Number(a.rating_count) || 0
  const bRC = Number(b.rating_count) || 0
  if (aRC + bRC > 0) {
    rows.push({
      label: 'User rating',
      a: aRC > 0 ? `${aRating.toFixed(1)}/5 (${aRC})` : 'No reviews yet',
      b: bRC > 0 ? `${bRating.toFixed(1)}/5 (${bRC})` : 'No reviews yet',
      highlight: aRating === bRating ? 'tie' : (aRating > bRating ? 'a' : 'b'),
    })
  }

  // Upvotes — only show if at least one has data
  const aUp = Number(a.upvotes) || 0
  const bUp = Number(b.upvotes) || 0
  if (aUp + bUp > 0) {
    rows.push({
      label: 'Community upvotes',
      a: String(aUp),
      b: String(bUp),
      highlight: aUp === bUp ? 'tie' : (aUp > bUp ? 'a' : 'b'),
    })
  }

  // ── Honest pros: only from real attributes ──────────────────────────────
  function buildPros(t: any): string[] {
    const pros: string[] = []
    if (t.pricing_model === 'free') pros.push('Completely free — no paid tiers required')
    else if (t.pricing_model === 'freemium') pros.push('Has a free tier you can use indefinitely')
    if (t.has_free_trial) pros.push(`Free trial available${t.trial_duration ? ` (${t.trial_duration})` : ''}`)
    if (t.has_api) pros.push('Public API for integrations and automation')
    if (t.promo_code && String(t.promo_code).trim()) {
      pros.push(`Discount available with code ${t.promo_code}`)
    }
    if (t.starting_price && parsePrice(t.starting_price) != null && parsePrice(t.starting_price)! <= 10) {
      pros.push(`Low entry price (from ${t.starting_price})`)
    }
    if ((Number(t.rating_avg) || 0) >= 4 && (Number(t.rating_count) || 0) >= 3) {
      pros.push(`Highly rated (${Number(t.rating_avg).toFixed(1)}/5 from ${t.rating_count} reviews)`)
    }
    if ((Number(t.upvotes) || 0) >= 20) pros.push(`Popular in the community (${t.upvotes} upvotes)`)
    if (t.gdpr_compliant) pros.push('GDPR compliant')
    return pros
  }

  // ── Honest cons: only flag real gaps ────────────────────────────────────
  function buildCons(t: any): string[] {
    const cons: string[] = []
    if (!t.has_free_trial && t.pricing_model !== 'free' && t.pricing_model !== 'freemium') {
      cons.push('No free trial — paid plan required to evaluate')
    }
    if (!t.has_api && t.pricing_model !== 'free') {
      cons.push('No public API — limits programmatic use')
    }
    if (t.pricing_model === 'enterprise') {
      cons.push('Enterprise-tier pricing only — not ideal for solo users')
    }
    if (!t.description || String(t.description).length < 80) {
      cons.push('Limited public documentation available')
    }
    return cons
  }

  // ── "Best for" — based on real attributes ───────────────────────────────
  function bestFor(t: any): string {
    const audience: string[] = []
    if (t.pricing_model === 'free' || t.pricing_model === 'freemium') {
      audience.push('Solo users on a budget')
    } else if (t.pricing_model === 'enterprise') {
      audience.push('Teams and enterprises with custom needs')
    } else if (t.has_free_trial) {
      audience.push('Teams that want to test before committing')
    } else {
      audience.push('Users ready to commit to a paid plan')
    }
    if (t.has_api) audience.push('developers needing integrations')
    if (t.category_name) audience.push(`anyone needing a ${String(t.category_name).toLowerCase()} solution`)
    return audience.join(' · ')
  }

  // ── Honest "Quick take" — no fake winner ────────────────────────────────
  const takeParts: string[] = []
  if (a.pricing_model === b.pricing_model) {
    takeParts.push(`Both use a ${prettyPricing(a.pricing_model).toLowerCase()} pricing model.`)
  } else {
    takeParts.push(`${a.name} is ${prettyPricing(a.pricing_model).toLowerCase()}, while ${b.name} is ${prettyPricing(b.pricing_model).toLowerCase()}.`)
  }
  if (a.has_api && !b.has_api) takeParts.push(`${a.name} offers an API; ${b.name} does not.`)
  else if (b.has_api && !a.has_api) takeParts.push(`${b.name} offers an API; ${a.name} does not.`)
  if (a.has_free_trial && !b.has_free_trial) takeParts.push(`Only ${a.name} offers a free trial.`)
  else if (b.has_free_trial && !a.has_free_trial) takeParts.push(`Only ${b.name} offers a free trial.`)
  if (aPrice != null && bPrice != null && aPrice !== bPrice) {
    const cheaper = aPrice < bPrice ? a : b
    takeParts.push(`${cheaper.name} has the lower starting price.`)
  }

  // ── Suggested winner per dimension (only when there is real signal) ─────
  const winners: { dimension: string; winner: 'a' | 'b' | 'tie'; reason: string }[] = []
  // Cheapest entry
  if (aPrice != null || bPrice != null || a.pricing_model === 'free' || b.pricing_model === 'free') {
    const aEff = a.pricing_model === 'free' ? 0 : (aPrice ?? Infinity)
    const bEff = b.pricing_model === 'free' ? 0 : (bPrice ?? Infinity)
    const w = aEff === bEff ? 'tie' : (aEff < bEff ? 'a' : 'b')
    winners.push({
      dimension: 'Lowest cost to start',
      winner: w,
      reason: w === 'tie' ? 'Both start at the same price.' : `${(w === 'a' ? a : b).name} has a lower or free entry point.`,
    })
  }
  // Developer-friendliness
  if (a.has_api || b.has_api) {
    const w = a.has_api === b.has_api ? 'tie' : (a.has_api ? 'a' : 'b')
    winners.push({
      dimension: 'Developer-friendliness',
      winner: w,
      reason: w === 'tie' ? 'Both offer (or both lack) an API.' : `${(w === 'a' ? a : b).name} exposes a public API.`,
    })
  }
  // Try-before-you-buy
  if (a.has_free_trial || b.has_free_trial || a.pricing_model === 'freemium' || b.pricing_model === 'freemium') {
    const aTry = a.has_free_trial || a.pricing_model === 'freemium' || a.pricing_model === 'free'
    const bTry = b.has_free_trial || b.pricing_model === 'freemium' || b.pricing_model === 'free'
    const w = aTry === bTry ? 'tie' : (aTry ? 'a' : 'b')
    winners.push({
      dimension: 'Try before you buy',
      winner: w,
      reason: w === 'tie' ? 'Both let you try without paying upfront.' : `${(w === 'a' ? a : b).name} lets you try without paying upfront.`,
    })
  }
  // Community trust (only if real data exists)
  if (aRC >= 3 || bRC >= 3) {
    const w = aRating === bRating ? 'tie' : (aRating > bRating ? 'a' : 'b')
    winners.push({
      dimension: 'Community trust',
      winner: w,
      reason: w === 'tie'
        ? 'Both have similar user ratings.'
        : `${(w === 'a' ? a : b).name} has the higher user rating.`,
    })
  }

  return {
    summary: takeParts.join(' '),
    matrix: rows,
    winners,
    pros_a: buildPros(a),
    cons_a: buildCons(a),
    pros_b: buildPros(b),
    cons_b: buildCons(b),
    best_for_a: bestFor(a),
    best_for_b: bestFor(b),
    tagline_a: a.tagline || '',
    tagline_b: b.tagline || '',
    description_a: a.description || '',
    description_b: b.description || '',
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { tool_a, tool_b, use_case } = await req.json()
    if (!tool_a || !tool_b) return NextResponse.json({ error: 'tool_a and tool_b required' }, { status: 400 })
    if (tool_a === tool_b) return NextResponse.json({ error: 'Please select two different tools' }, { status: 400 })

    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const ipHash = hashIP(rawIp)

    const { allowed, remaining, resetIn } = checkRateLimit(rawIp)
    if (!allowed) {
      logComparison({
        tool_a_slug: tool_a, tool_b_slug: tool_b,
        tool_a_name: tool_a, tool_b_name: tool_b,
        ip_hash: ipHash, use_case: use_case || null, rate_limited: true,
      })
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 60)} minutes.` },
        { status: 429, headers: { 'Retry-After': String(resetIn) } }
      )
    }

    const supabase = getSupabase()
    // eslint-disable-next-line prefer-const
    let { data: tools, error: fetchErr } = await supabase
      .from('ai_tools')
      .select(`
        name, slug, tagline, description, website, logo_url,
        pricing_model, starting_price, has_free_trial, trial_duration, has_api,
        no_code, gdpr_compliant, is_featured,
        upvotes, rating_avg, rating_count, view_count, click_count,
        promo_code, promo_desc,
        categories(name)
      `)
      .in('slug', [tool_a, tool_b])

    if (fetchErr) {
      const fallback = await supabase
        .from('ai_tools')
        .select('name, slug, tagline, description, website, logo_url, pricing_model, starting_price, has_free_trial, trial_duration, has_api, upvotes, rating_avg, rating_count, promo_code, promo_desc')
        .in('slug', [tool_a, tool_b])
      tools = fallback.data as any
    }

    const toolData = tools ?? []
    const a = (toolData as any[]).find(t => t.slug === tool_a)
    const b = (toolData as any[]).find(t => t.slug === tool_b)
    if (!a || !b) return NextResponse.json({ error: 'One or both tools not found' }, { status: 404 })

    const aWithCat = { ...a, category_name: (a as any).categories?.name }
    const bWithCat = { ...b, category_name: (b as any).categories?.name }

    const comparison = buildComparison(aWithCat, bWithCat)

    logComparison({
      tool_a_slug: tool_a, tool_b_slug: tool_b,
      tool_a_name: a.name, tool_b_name: b.name,
      ip_hash: ipHash, use_case: use_case || null, rate_limited: false,
    })

    return NextResponse.json(
      { comparison, tool_a: a, tool_b: b },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
