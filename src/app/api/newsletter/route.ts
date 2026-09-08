// Newsletter opt-in.
//
// Consent has to be freely given, specific and demonstrable, so the form sends
// the exact wording shown beside the checkbox and it is stored verbatim. A
// request without that checkbox ticked is rejected rather than quietly stored.

import { NextRequest, NextResponse } from 'next/server'
import { recordConsent } from '@/lib/marketing/contacts'
import { sendEmail } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  let body: { email?: string; name?: string; phone?: string; consent?: boolean; consentText?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Please enter your name' }, { status: 400 })
  }
  // Silence is not consent: an unticked box means no.
  if (body.consent !== true) {
    return NextResponse.json(
      { error: 'Please tick the box to confirm you are happy to receive emails' },
      { status: 400 }
    )
  }

  const result = await recordConsent({
    email,
    name: body.name,
    phone: body.phone,          // optional
    consentText: body.consentText ?? 'Marketing consent given via newsletter form',
    source: 'newsletter',
    // Part of the audit trail for demonstrating consent.
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Confirming the subscription is itself transactional, so it is sent
  // directly rather than through the marketing path.
  try {
    await sendEmail({
      to: email,
      subject: 'You are on the ListmyAI list',
      html: `
        <div style="font-family:Inter,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:520px;margin:0 auto">
          <h2 style="color:#fff;margin:0 0 14px">Thanks for subscribing${body.name ? `, ${body.name.split(' ')[0]}` : ''}</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px">
            You'll get new AI tools, deals and the occasional deep-dive from ListmyAI —
            no more than a couple of emails a week.
          </p>
          <a href="https://listmyai.com/directory"
             style="display:inline-block;background:#e94560;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Browse the directory
          </a>
          <p style="color:#475569;font-size:12px;margin:26px 0 0">
            Changed your mind? <a href="https://listmyai.com/unsubscribe?token=${result.token}" style="color:#64748b">Unsubscribe</a> any time.
          </p>
        </div>`,
      headers: {
        'List-Unsubscribe': `<https://listmyai.com/unsubscribe?token=${result.token}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })
  } catch (err) {
    // The consent is recorded; a failed confirmation email must not undo it.
    console.warn('[newsletter] confirmation email failed:', err)
  }

  return NextResponse.json({ ok: true })
}
