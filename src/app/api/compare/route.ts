import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { tool_a, tool_b, use_case } = await req.json()
    if (!tool_a || !tool_b) return NextResponse.json({ error: 'tool_a and tool_b required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    // Fetch both tools from DB
    const { data: tools } = await supabase
      .from('ai_tools')
      .select('name, slug, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api')
      .in('slug', [tool_a, tool_b])

    const toolData = tools ?? []
    const a = toolData.find(t => t.slug === tool_a)
    const b = toolData.find(t => t.slug === tool_b)

    const toolAInfo = a ? `${a.name}: ${a.tagline || ''} | ${a.description?.slice(0, 200) || ''} | pricing: ${a.pricing_model} ${a.starting_price || ''} | free_trial: ${a.has_free_trial} | api: ${a.has_api}` : tool_a
    const toolBInfo = b ? `${b.name}: ${b.tagline || ''} | ${b.description?.slice(0, 200) || ''} | pricing: ${b.pricing_model} ${b.starting_price || ''} | free_trial: ${b.has_free_trial} | api: ${b.has_api}` : tool_b

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
        model: 'claude-haiku-4-5',
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

    const comparison = JSON.parse(jsonMatch[0])
    return NextResponse.json({ comparison, tool_a: a, tool_b: b })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
