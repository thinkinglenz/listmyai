// Consent-aware email sending.
//
// Every marketing send goes through here so the suppression check can never be
// forgotten at a call site. Transactional mail (password resets, claim
// outcomes, admin-edit notices) does not belong here: those are lawful without
// marketing consent and must still reach someone who has unsubscribed.

import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE = 'https://listmyai.com'

export interface ConsentRecord {
  email: string
  name?: string | null
  phone?: string | null
  consentText: string
  source: 'newsletter' | 'signup' | 'admin'
  ip?: string | null
}

/**
 * Records an opt-in. GDPR Art.7(1) requires being able to demonstrate consent,
 * so the exact wording, time, source and IP are all stored — a boolean alone
 * would not be defensible.
 */
export async function recordConsent(record: ConsentRecord) {
  const email = record.email.trim().toLowerCase()

  const { data, error } = await supabase
    .from('marketing_contacts')
    .upsert(
      {
        email,
        name: record.name?.trim() || null,
        phone: record.phone?.trim() || null,
        consent_marketing: true,
        consent_text: record.consentText,
        consent_at: new Date().toISOString(),
        consent_ip: record.ip ?? null,
        consent_source: record.source,
        // Re-subscribing clears a previous opt-out.
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select('unsubscribe_token')
    .single()

  if (error) return { ok: false as const, error: error.message }

  // Opting back in must lift any earlier suppression, or they would never
  // receive the mail they just asked for.
  await supabase.from('email_suppressions').delete().eq('email', email)

  return { ok: true as const, token: data?.unsubscribe_token as string }
}

/** True when this address must not be sent marketing. */
export async function isSuppressed(email: string): Promise<boolean> {
  const addr = email.trim().toLowerCase()

  const { data: suppressed } = await supabase
    .from('email_suppressions')
    .select('email')
    .eq('email', addr)
    .maybeSingle()
  if (suppressed) return true

  const { data: contact } = await supabase
    .from('marketing_contacts')
    .select('consent_marketing, unsubscribed_at')
    .eq('email', addr)
    .maybeSingle()

  // No record at all means no consent was ever given.
  if (!contact) return true
  return !contact.consent_marketing || Boolean(contact.unsubscribed_at)
}

export async function suppress(email: string, reason = 'unsubscribed') {
  const addr = email.trim().toLowerCase()
  await supabase.from('email_suppressions').upsert({ email: addr, reason }, { onConflict: 'email' })
  await supabase
    .from('marketing_contacts')
    .update({ consent_marketing: false, unsubscribed_at: new Date().toISOString() })
    .eq('email', addr)
}

/**
 * Sends one marketing email, refusing if the recipient has not consented, and
 * appending the unsubscribe footer that law requires on every marketing send.
 */
export async function sendMarketingEmail(opts: {
  to: string
  subject: string
  bodyHtml: string
}): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  const email = opts.to.trim().toLowerCase()

  if (await isSuppressed(email)) {
    return { ok: false, skipped: 'No marketing consent on file, or unsubscribed' }
  }

  const { data: contact } = await supabase
    .from('marketing_contacts')
    .select('unsubscribe_token')
    .eq('email', email)
    .maybeSingle()

  const unsubUrl = `${SITE}/unsubscribe?token=${contact?.unsubscribe_token ?? ''}`

  const html = `${opts.bodyHtml}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1e2a3a;color:#64748b;font-size:12px;font-family:Inter,sans-serif;line-height:1.6">
      <p style="margin:0 0 6px">You are receiving this because you asked ListmyAI for updates.</p>
      <p style="margin:0">
        <a href="${unsubUrl}" style="color:#94a3b8">Unsubscribe</a> ·
        <a href="${SITE}/privacy-policy" style="color:#94a3b8">Privacy policy</a>
      </p>
    </div>`

  try {
    await sendEmail({
      to: email,
      subject: opts.subject,
      html,
      // One-click unsubscribe, which Gmail and Yahoo require from bulk senders.
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
