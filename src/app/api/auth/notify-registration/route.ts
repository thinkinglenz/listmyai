import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, adminNewUserEmail, welcomeEmail } from '@/lib/email'
import { recordConsent } from '@/lib/marketing/contacts'

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'listmyai@gmail.com'

// Only a sign-up that just happened may trigger these emails. Without this,
// anyone could POST any address and make ListmyAI send it a welcome email —
// and record marketing consent that person never gave.
const FRESH_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { userId, name, marketingConsent, consentText } = await req.json()
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: found } = await admin.auth.admin.getUserById(userId)
    const user = found?.user
    if (!user?.email || Date.now() - new Date(user.created_at).getTime() > FRESH_MS) {
      return NextResponse.json({ error: 'not a new registration' }, { status: 400 })
    }
    // The address comes from the auth record, never from the request body.
    const email = user.email

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
