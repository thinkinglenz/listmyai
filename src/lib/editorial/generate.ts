// Writing one editorial draft.
//
// Drafts only. Nothing in this file publishes anything: it writes a row with
// status 'draft' and stops. A human reads it in /admin/editorials and decides.
// That is deliberate — an editorial carries the site's name and makes claims
// about somebody else's product, and the cost of a wrong one is borne by them.
import { createClient } from '@supabase/supabase-js'
import { researchTool } from './research'
import type { EditorialSource } from '@/lib/editorials'

// The model the rest of this codebase already uses successfully against this
// account's key. Prose quality would be better from a larger model; that is a
// deliberate trade against a small prepaid balance and one run a day.
const MODEL = 'claude-haiku-4-5'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface Candidate {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  website: string | null
  pricing_model: string | null
}

/**
 * The next listing to write about: claimed, active, and not already covered.
 *
 * Claimed first because a claimed listing has a real owner who will read it,
 * which is the whole point of the programme — and because an owner who
 * disputes something has somewhere to say so.
 */
export async function pickCandidate(): Promise<Candidate | null> {
  const sb = db()

  const { data: done, error: doneErr } = await sb.from('editorials').select('tool_id')
  if (doneErr) throw new Error(`editorial: could not read existing editorials — ${doneErr.message}`)
  const covered = new Set((done ?? []).map(d => d.tool_id).filter(Boolean) as string[])

  const { data, error } = await sb
    .from('ai_tools')
    .select('id, slug, name, tagline, description, website, pricing_model')
    .eq('status', 'active')
    .eq('claimed', true)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw new Error(`editorial: could not read listings — ${error.message}`)

  return (data ?? []).find(t => !covered.has(t.id)) as Candidate | undefined ?? null
}

const RULES = `You write for ListmyAI, a directory of AI tools. House rules, in order of importance:

1. Never invent a source, a quote, a statistic, a user or a date. You may cite ONLY the discussions supplied below, quoting their exact words.
2. A discussion marked "uncertain: may be a different product with the same name" must NOT be used unless its text is unmistakably about this tool. Say nothing rather than guess.
3. If there is little or no independent discussion, say so plainly in the piece. That is a normal, useful finding, not a failure.
4. Never give a score, rating or star. This is an article, not a review.
5. Anything the company says about itself is attributed to the company ("the site says", "according to its pricing page"), never stated as fact.
6. Write "we", never "I". You are the ListmyAI team.
7. No marketing voice. No "unleash", "game-changing", "in today's fast-paced world". Short sentences. Plain words.
8. Include criticism where the sources contain it, with its date.`

export interface Draft {
  title: string
  standfirst: string
  body_md: string
  coverage_note: string | null
  sources: EditorialSource[]
}

export async function writeDraft(tool: Candidate): Promise<Draft> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('editorial: ANTHROPIC_API_KEY is not set')

  const { sources, excerpts } = await researchTool(tool.name, tool.website)

  const discussion = excerpts.length
    ? excerpts.map(e =>
        `- ${e.url} (${e.when ?? 'undated'})${e.certain ? '' : ' [uncertain: may be a different product with the same name]'}\n  "${e.text}"`
      ).join('\n')
    : '(None found. Hacker News has no discussion of this tool. Say so in the piece.)'

  const prompt = `${RULES}

Write an editorial about this listing.

Name: ${tool.name}
Website: ${tool.website ?? 'unknown'}
Tagline: ${tool.tagline ?? 'none'}
Pricing model (as recorded in our directory): ${tool.pricing_model ?? 'unknown'}
What the company says about itself: ${(tool.description ?? 'nothing recorded').slice(0, 1500)}

Independent discussion found:
${discussion}

Return ONLY a JSON object, no prose around it:
{
  "title": "a specific headline, not the tool name alone, under 90 characters",
  "standfirst": "one or two sentences under 220 characters",
  "body_md": "600-900 words of markdown using ### subheadings. Link any discussion you cite inline with its real URL.",
  "coverage_note": "one or two sentences naming what you could NOT verify and how much independent coverage exists, or null"
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`editorial: model call failed (${res.status}) ${detail.slice(0, 300)}`)
  }

  const payload = await res.json() as { content?: { text?: string }[] }
  const raw = payload.content?.[0]?.text ?? ''
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)

  let parsed: Partial<Draft>
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('editorial: model did not return usable JSON')
  }
  if (!parsed.title || !parsed.body_md) throw new Error('editorial: model returned an empty draft')

  return {
    title: parsed.title,
    standfirst: parsed.standfirst ?? '',
    body_md: parsed.body_md,
    coverage_note: parsed.coverage_note ?? null,
    // The sources are ours, from the real search — never whatever the model
    // echoed back. This is the one field it must not be trusted with.
    sources,
  }
}

/** Writes the draft. Returns the slug. Never publishes. */
export async function saveDraft(tool: Candidate, draft: Draft): Promise<string> {
  const { error } = await db().from('editorials').insert({
    tool_id: tool.id,
    slug: tool.slug,
    title: draft.title,
    standfirst: draft.standfirst,
    body_md: draft.body_md,
    sources: draft.sources,
    coverage_note: draft.coverage_note,
    status: 'draft',
    published_at: null,
  })
  if (error) throw new Error(`editorial: could not save draft — ${error.message}`)
  return tool.slug
}
