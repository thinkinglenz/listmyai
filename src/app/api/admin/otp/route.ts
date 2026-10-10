// Admin login: password, then an emailed one-time code.
//
// Both factors are checked here on the server. The password used to be
// compared in the browser against a literal shipped in the JS bundle, which
// made it public; now it lives only in the ADMIN_PASSWORD env var.
//
// The pending code is not kept in memory (a Vercel cold start or a second
// instance would lose it). Instead its hash is signed into a short-lived
// httpOnly cookie, so any instance can verify it.

import { createHmac, randomInt } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import {
  ADMIN_COOKIE, adminCookieOptions, createAdminToken, REMEMBERED_MS, SESSION_MS, safeEqual,
} from '@/lib/admin-auth'
import { adminPasswordConfigured, verifyAdminPassword } from '@/lib/admin-password'

export const dynamic = 'force-dynamic'

const OTP_COOKIE = 'lmai_admin_otp'
const OTP_MS = 10 * 60 * 1000

function otpKey(): string {
  const key = process.env.CRON_SECRET
  if (!key) throw new Error('CRON_SECRET not set')
  return key
}

function signOtp(code: string, expiresAt: string): string {
  return createHmac('sha256', otpKey()).update(`otp:${code}:${expiresAt}`).digest('hex')
}

// POST /api/admin/otp — check the password, then email a code
export async function POST(req: NextRequest) {
  // The stored hash wins; ADMIN_PASSWORD is the fallback until one is set.
  if (!(await adminPasswordConfigured())) {
    return NextResponse.json({ error: 'No admin password is configured on the server.' }, { status: 500 })
  }
  const { password } = await req.json().catch(() => ({}))
  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const code = String(randomInt(100000, 1000000))
  const expiresAt = String(Date.now() + OTP_MS)
  const to = process.env.ADMIN_NOTIFY_EMAIL || 'listmyai@gmail.com'

  try {
    await sendEmail({
      to,
      subject: `🔐 ListmyAI Admin OTP: ${code}`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:400px;margin:0 auto">
          <h2 style="color:#fff;margin:0 0 8px">Admin Login Code</h2>
          <p style="color:#94a3b8;margin:0 0 24px;font-size:14px">Use this code to access the ListmyAI admin panel. Expires in 10 minutes.</p>
          <div style="background:#161b27;border:1px solid #1e2a3a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#e94560">${code}</span>
          </div>
          <p style="color:#475569;font-size:12px;margin:0">If you didn't request this, someone has your admin password — change ADMIN_PASSWORD in Vercel.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[OTP] Failed to send email:', err)
    return NextResponse.json({ error: 'Could not send the code email.' }, { status: 500 })
  }

  const res = NextResponse.json({ sent: true })
  res.cookies.set(OTP_COOKIE, `${expiresAt}.${signOtp(code, expiresAt)}`, adminCookieOptions(OTP_MS))
  return res
}

// PUT /api/admin/otp — verify password + code, then issue the admin session
export async function PUT(req: NextRequest) {
  const { code, remember, password } = await req.json().catch(() => ({}))

  // The password is re-checked so a stolen pending-OTP cookie alone is useless.
  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: 'Session expired. Start again.' }, { status: 401 })
  }

  const [expiresAt, mac] = (req.cookies.get(OTP_COOKIE)?.value ?? '').split('.')
  if (!expiresAt || !mac || !/^\d+$/.test(expiresAt) || Date.now() > Number(expiresAt)) {
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }
  if (typeof code !== 'string' || !/^\d{6}$/.test(code) || !safeEqual(signOtp(code, expiresAt), mac)) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 401 })
  }

  const lifetime = remember ? REMEMBERED_MS : SESSION_MS
  const res = NextResponse.json({ verified: true })
  res.cookies.set(ADMIN_COOKIE, createAdminToken(lifetime), adminCookieOptions(lifetime))
  res.cookies.set(OTP_COOKIE, '', { path: '/', maxAge: 0 }) // one-time use
  return res
}
