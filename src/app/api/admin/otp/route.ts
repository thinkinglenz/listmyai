import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// In-memory OTP store — single admin so one slot is enough
// Resets on each Vercel cold start (acceptable for admin 2FA)
let stored: { code: string; expiresAt: number } | null = null

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? 'listmyai@gmail.com'

// POST /api/admin/otp — generate and send OTP
export async function POST() {
  const code = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit
  stored = { code, expiresAt: Date.now() + 10 * 60 * 1000 } // 10 min expiry

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🔐 ListmyAI Admin OTP: ${code}`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:400px;margin:0 auto">
        <h2 style="color:#fff;margin:0 0 8px">Admin Login Code</h2>
        <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Use this code to access the ListmyAI admin panel. Expires in 10 minutes.</p>
        <div style="background:#161b27;border:1px solid #1e2a3a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#e94560">${code}</span>
        </div>
        <p style="color:#475569;font-size:12px;margin:0">If you didn't request this, someone may be trying to access your admin panel.</p>
      </div>
    `,
  })

  return NextResponse.json({ sent: true })
}

// PUT /api/admin/otp — verify OTP
export async function PUT(req: NextRequest) {
  const { code } = await req.json()

  if (!stored || Date.now() > stored.expiresAt) {
    stored = null
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }

  if (code !== stored.code) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 401 })
  }

  stored = null // one-time use
  return NextResponse.json({ verified: true })
}
