import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json()
    if (!answers) return NextResponse.json({ error: 'answers required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

    // Fetch tools from DB for Claude to reason over
    const { data: tools } = await supabase
      .from('ai_tools')
      .select('id, name, slug, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api')
      .eq('status', 'active')
      .limit(150)

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
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse Claude response' }, { status: 500 })

    const recommendations = JSON.parse(jsonMatch[0])

    // Save to quiz_results table (non-blocking, ignore errors if table missing)
    void supabase.from('quiz_results').insert({
      answers,
      recommendations,
    })

    return NextResponse.json({ recommendations })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
