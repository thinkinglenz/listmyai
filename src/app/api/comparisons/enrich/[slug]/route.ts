// On-demand enrichment for comparison pages.
// Generates verdict + pros/cons + FAQs via Claude (cached), then returns cached copy forever.
// Runs on first page view (from server component); subsequent views hit the cache.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ComparisonEnrichment {
  verdict: string
  tool_a_pros: string[]
  tool_a_cons: string[]
  tool_b_pros: string[]
  tool_b_cons: string[]
  faqs: { q: string; a: string }[]
}

async function generateEnrichment(
  toolAName: string,
  toolADesc: string,
  toolBName: string,
  toolBDesc: string
): Promise<ComparisonEnrichment | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      console.error(`Claude API error ${res.status}: ${await res.text()}`)
      return null
    }

    const result = await res.json()
    const text: string = result.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON in response:', text)
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as ComparisonEnrichment
    return parsed
  } catch (err) {
    console.error('Enrichment generation failed:', err)
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Parse the slug: should be "tool-a-vs-tool-b"
  const match = slug.match(/^(.+)-vs-(.+)$/)
  if (!match) {
    return NextResponse.json({ error: 'Invalid comparison slug format' }, { status: 400 })
  }

  const [slugA, slugB] = [match[1], match[2]]

  // Check if enrichment already exists
  const { data: existing } = await supabase
    .from('comparison_enrichment')
    .select('*')
    .eq('comparison_slug', slug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing, {
      headers: {
        'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 1 week
      },
    })
  }

  // Fetch both tools
  const { data: toolA } = await supabase
    .from('ai_tools')
    .select('id, name, description')
    .eq('slug', slugA)
    .maybeSingle()

  const { data: toolB } = await supabase
    .from('ai_tools')
    .select('id, name, description')
    .eq('slug', slugB)
    .maybeSingle()

  if (!toolA || !toolB) {
    return NextResponse.json({ error: 'One or both tools not found' }, { status: 404 })
  }

  // Generate enrichment
  const enrichment = await generateEnrichment(
    toolA.name,
    toolA.description || toolA.name,
    toolB.name,
    toolB.description || toolB.name
  )

  if (!enrichment) {
    return NextResponse.json(
      { error: 'Failed to generate enrichment' },
      { status: 500 }
    )
  }

  // Save to cache
  const { data: cached, error: insertErr } = await supabase
    .from('comparison_enrichment')
    .insert({
      comparison_slug: slug,
      tool_a_id: toolA.id,
      tool_b_id: toolB.id,
      verdict: enrichment.verdict,
      tool_a_pros: enrichment.tool_a_pros,
      tool_a_cons: enrichment.tool_a_cons,
      tool_b_pros: enrichment.tool_b_pros,
      tool_b_cons: enrichment.tool_b_cons,
      faqs: enrichment.faqs,
      model_used: 'claude-haiku-4-5-20251001',
    })
    .select()
    .maybeSingle()

  if (insertErr) {
    console.error('Failed to cache enrichment:', insertErr.message)
    // Still return the generated content (just not cached)
    return NextResponse.json(enrichment, { status: 200 })
  }

  return NextResponse.json(cached || enrichment, {
    headers: {
      'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 1 week
    },
  })
}
