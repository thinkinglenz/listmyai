import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, adminNewUserEmail, welcomeEmail } from '@/lib/email'
import { recordConsent } from '@/lib/marketing/contacts'

const ADMIN_EMAIL = 'listmyai@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { name, email, marketingConsent, consentText } = await req.json()
    if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 })

    // Registration and marketing are separate decisions. Only an explicit tick
    // is recorded; anything else leaves the address off the marketing list
    // entirely, so it can never be picked up by a later campaign.
    if (marketingConsent === true) {
      await recordConsent({
        email,
        name,
        consentText: consentText ?? 'Marketing consent given during registration',
        source: 'signup',
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listmyai.com'

    await Promise.all([
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `New user: ${name || email}`,
        html: adminNewUserEmail(name || '', email, appUrl),
      }),
      sendEmail({
        to: email,
        subject: 'Welcome to ListmyAI!',
        html: welcomeEmail(name || '', appUrl),
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notify-registration]', err)
    return NextResponse.json({ success: true })
  }
}
