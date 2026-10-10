// Admin password reset, by email.
//
// Two actions, both unauthenticated by necessity — the caller is someone who
// cannot log in. Safety comes from elsewhere: the link only ever goes to the
// fixed admin address, the token is single use and short-lived, and the reply
// is identical whether or not anything happened, so this cannot be used to
// probe the site's state.
//
// The new password travels in the POST body, never in the URL. The token is
// in the link because it has to be, which is why it expires and burns on use.
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, passwordResetEmail } from '@/lib/email'
import { consumeResetToken, createResetToken, MIN_PASSWORD_LENGTH } from '@/lib/admin-password'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'listmyai@gmail.com'

/** Said for every request-reset call, whatever actually happened. */
const GENERIC = 'If the admin address is reachable, a reset link is on its way.'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const action = body?.action

  if (action === 'request') {
    const token = await createResetToken()
    // null means the cooldown is still running. The caller is told the same
    // thing either way, so repeated clicks cannot be used to time the window.
    if (token) {
      const url = `${APP_URL}/admin-reset?token=${token}`
      try {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: '🔑 Reset your ListmyAI admin password',
          html: passwordResetEmail(url),
        })
      } catch (e) {
        console.warn('[admin-password] reset email failed', e)
      }
    }
    return NextResponse.json({ ok: true, message: GENERIC })
  }

  if (action === 'set') {
    const result = await consumeResetToken(body?.token, body?.password)
    if (result === 'ok') return NextResponse.json({ ok: true })

    const message =
      result === 'weak' ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
      : result === 'expired' ? 'That link has expired. Request a new one.'
      : result === 'failed' ? 'Could not save the new password.'
      : 'That link is not valid. It may already have been used.'
    return NextResponse.json({ error: message }, { status: result === 'failed' ? 500 : 400 })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
