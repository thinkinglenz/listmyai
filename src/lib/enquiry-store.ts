/**
 * Persist every intake conversation, finished or not.
 *
 * Before this the route only emailed a completed enquiry and stored nothing,
 * which meant "nobody visited", "fifteen people started and gave up at
 * question three" and "leads were sent but never arrived" all looked
 * identical from the outside: an empty inbox. There was no way to tell a
 * traffic problem from a conversion problem from a delivery problem.
 *
 * Writes are best-effort by design. A database hiccup must never cost the
 * visitor their conversation or block the reply — the email is still the
 * thing that reaches a human, and this is the record of what happened.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { extractContact } from './enquiry-contact'

export interface StoredTurn { role: 'user' | 'model'; content: string }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** An IP is personal data and nothing here needs the original. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

/**
 * Upsert the conversation on every turn, keyed by the id the browser made
 * when the form mounted. One row per conversation rather than one per
 * message, so an abandoned enquiry is a row with status 'open' and three
 * turns — which is precisely the thing that could not be seen before.
 */
export async function recordEnquiry(input: {
  conversationId: string
  agentSlug: string
  messages: StoredTurn[]
  complete: boolean
  summary?: string | null
  ip?: string | null
  userAgent?: string | null
  pagePath?: string | null
}): Promise<void> {
  const { email, name } = extractContact(input.messages)

  const { error } = await supabase
    .from('agent_enquiries')
    .upsert({
      conversation_id: input.conversationId,
      agent_slug: input.agentSlug,
      status: input.complete ? 'complete' : 'open',
      turns: input.messages.filter(m => m.role === 'user').length,
      transcript: input.messages,
      ...(input.summary ? { summary: input.summary } : {}),
      contact_name: name,
      contact_email: email,
      page_path: input.pagePath ?? null,
      ip_hash: input.ip ? hashIp(input.ip) : null,
      user_agent: input.userAgent ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'conversation_id' })

  // Logged, not thrown. Losing the record is bad; losing the visitor's reply
  // because the record failed to save would be worse.
  if (error) console.error('[enquiry-store] could not save', input.conversationId, error.message)
}

/**
 * Note whether the notification email actually left.
 *
 * Without this a delivery failure is invisible: the row says 'complete' and
 * the inbox stays empty, and there is nothing to tell the two apart.
 */
export async function recordDelivery(conversationId: string, ok: boolean, errorText?: string): Promise<void> {
  const { error } = await supabase
    .from('agent_enquiries')
    .update({
      delivered: ok,
      delivery_error: ok ? null : (errorText ?? 'unknown').slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)

  if (error) console.error('[enquiry-store] could not record delivery', conversationId, error.message)
}
