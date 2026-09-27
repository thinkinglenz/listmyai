// Verdict, pros/cons and FAQs for a comparison page.
//
// Reading and generating are deliberately separate. The page reads only, so it
// stays statically rendered and its AI content ships inside the HTML where
// Google can index it. Generation costs a Claude call, so it happens on a
// capped cron instead: Googlebot crawling thousands of comparison URLs must
// never be able to spend money, and it could when this ran on first view.
import { createClient } from '@supabase/supabase-js'

export interface ComparisonEnrichment {
  verdict: string
  tool_a_pros: string[]
  tool_a_cons: string[]
  tool_b_pros: string[]
  tool_b_cons: string[]
  faqs: { q: string; a: string }[]
}

export const ENRICHMENT_MODEL = 'claude-haiku-4-5-20251001'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** "tool-a-vs-tool-b" → ["tool-a", "tool-b"], or null if it is not a pair. */
export function parseComparisonSlug(slug: string): [string, string] | null {
  const match = slug.match(/^(.+)-vs-(.+)$/)
  return match ? [match[1], match[2]] : null
}

/**
 * Cached enrichment for a comparison, or null if none has been generated.
 *
 * Never generates. Safe to call from a static page render.
 */
export async function readEnrichment(slug: string): Promise<ComparisonEnrichment | null> {
  try {
    const { data } = await db()
      .from('comparison_enrichment')
      .select('verdict, tool_a_pros, tool_a_cons, tool_b_pros, tool_b_cons, faqs')
      .eq('comparison_slug', slug)
      .maybeSingle()
    if (!data?.verdict) return null
    return {
      verdict: data.verdict,
      tool_a_pros: data.tool_a_pros ?? [],
      tool_a_cons: data.tool_a_cons ?? [],
      tool_b_pros: data.tool_b_pros ?? [],
      tool_b_cons: data.tool_b_cons ?? [],
      faqs: data.faqs ?? [],
    }
  } catch {
    return null
  }
}

async function callClaude(
  toolAName: string, toolADesc: string,
  toolBName: string, toolBDesc: string
): Promise<ComparisonEnrichment | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompt = `You are a product comparison analyst. Compare these two AI tools concisely.

${toolAName}: ${toolADesc}
${toolBName}: ${toolBDesc}

Return ONLY valid JSON (no prose outside JSON):
{
  "verdict": "1-2 sentence recommendation (who should pick which)",
  "tool_a_pros": ["pro1", "pro2", "pro3"],
  "tool_a_cons": ["con1", "con2"],
  "tool_b_pros": ["pro1", "pro2", "pro3"],
  "tool_b_cons": ["con1", "con2"],
  "faqs": [
    {"q": "When should I pick ${toolAName}?", "a": "2-3 sentence answer"},
    {"q": "How do pricing tiers compare?", "a": "answer"},
    {"q": "Which is better for X?", "a": "answer"}
  ]
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ENRICHMENT_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      console.error(`[enrichment] Claude ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return null
    }
    const result = await res.json()
    const text: string = result.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[enrichment] no JSON in response')
      return null
    }
    return JSON.parse(jsonMatch[0]) as ComparisonEnrichment
  } catch (err) {
    console.error('[enrichment] generation failed', err)
    return null
  }
}

/**
 * Generate and cache enrichment for one comparison.
 *
 * Costs one Claude call, so every caller must be rate-limited or capped.
 * Returns the cached row if one already exists, without spending anything.
 */
export async function generateAndCache(slug: string): Promise<ComparisonEnrichment | null> {
  const existing = await readEnrichment(slug)
  if (existing) return existing

  const pair = parseComparisonSlug(slug)
  if (!pair) return null
  const supabase = db()

  const { data: tools } = await supabase
    .from('ai_tools')
    .select('id, slug, name, description')
    .in('slug', pair)

  const toolA = tools?.find(t => t.slug === pair[0])
  const toolB = tools?.find(t => t.slug === pair[1])
  if (!toolA || !toolB) return null

  const enrichment = await callClaude(
    toolA.name, toolA.description || toolA.name,
    toolB.name, toolB.description || toolB.name
  )
  if (!enrichment) return null

  const { error } = await supabase.from('comparison_enrichment').insert({
    comparison_slug: slug,
    tool_a_id: toolA.id,
    tool_b_id: toolB.id,
    verdict: enrichment.verdict,
    tool_a_pros: enrichment.tool_a_pros,
    tool_a_cons: enrichment.tool_a_cons,
    tool_b_pros: enrichment.tool_b_pros,
    tool_b_cons: enrichment.tool_b_cons,
    faqs: enrichment.faqs,
    model_used: ENRICHMENT_MODEL,
  })
  if (error) console.error('[enrichment] could not cache:', error.message)

  return enrichment
}
