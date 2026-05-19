import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, claimWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (!process.env.IMPORT_SECRET || auth !== `Bearer ${process.env.IMPORT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, tool_name } = await req.json()
  if (!email || !tool_name) {
    return NextResponse.json({ error: 'email and tool_name required' }, { status: 422 })
  }

  await sendEmail({
    to: email,
    subject: `You've claimed "${tool_name}" on ListmyAI`,
    html: claimWelcomeEmail(tool_name, process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'),
  })

  return NextResponse.json({ ok: true })
}
