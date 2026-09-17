// A short, punchy headline for a tool's social creative ("Turn one video into
// ten Reels with Short.now"). Generated once, stored on the listing, and read
// by the image route — which never calls the model itself, since it is public
// and cached, and anyone could otherwise run up the bill by requesting slugs.

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const SYSTEM = `You write the headline for an Instagram post announcing an AI tool.

Rules:
- One line, at most 9 words. No hashtags, no emoji, no quotation marks.
- Lead with the outcome the user gets, in plain words ("Create studio-quality videos from a sentence").
- Mention the tool by name when it reads naturally ("…with Short.now").
- Energetic and confident is good. Inventing capabilities is not: every claim must be supported by the name, tagline or description you are given. If the description is thin, stay general rather than guess.
- Reply with the headline only.`

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function generate(tool: { name: string; tagline: string | null; description: string | null; category?: string | null }): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const client = new Anthropic()
  try {
    const response = await client.beta.messages.create(
      {
        model: 'claude-opus-5',
        max_tokens: 2000,
        // A one-line rewrite needs little reasoning.
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM,
        messages: [{
          role: 'user',
          content: [
            `Tool: ${tool.name}`,
            tool.category ? `Category: ${tool.category}` : '',
            `Tagline: ${tool.tagline ?? ''}`,
            `Description: ${(tool.description ?? '').slice(0, 1200)}`,
          ].filter(Boolean).join('\n'),
        }],
      },
      // Called while an admin waits on an approval.
      { timeout: 20_000, maxRetries: 1 },
    )
    if (response.stop_reason === 'refusal') return null
    const text = response.content
      .map(b => (b.type === 'text' ? b.text : ''))
      .join(' ')
      .replace(/["“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return text && text.length <= 90 ? text : null
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn('[hook] rate limited')
    else if (err instanceof Anthropic.APIError) console.warn(`[hook] API error ${err.status}: ${err.message}`)
    else console.warn('[hook] failed', err)
    return null
  }
}

/** Returns the stored headline, generating and saving it on first use. */
export async function getSocialHook(toolId: string, opts: { regenerate?: boolean } = {}): Promise<string | null> {
  const supabase = db()
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('name, tagline, description, social_hook, categories(name)')
    .eq('id', toolId)
    .maybeSingle()
  if (!tool) return null
  if (tool.social_hook && !opts.regenerate) return tool.social_hook

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cat = (tool as any).categories
  const hook = await generate({
    name: tool.name,
    tagline: tool.tagline,
    description: tool.description,
    category: Array.isArray(cat) ? cat[0]?.name : cat?.name,
  })
  if (hook) await supabase.from('ai_tools').update({ social_hook: hook }).eq('id', toolId)
  return hook ?? tool.social_hook ?? null
}
