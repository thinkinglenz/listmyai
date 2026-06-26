import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, adminNewUserEmail, welcomeEmail } from '@/lib/email'

const ADMIN_EMAIL = 'listmyai@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json()
    if (!email) return NextResponse.json({ error: 'missing email' }, { status: 400 })

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
