// Server-side admin sessions.
//
// The admin panel gates itself in the browser (password compare + emailed
// OTP), which stops a casual visitor from seeing the UI but does nothing for
// the /api/admin/* routes — those were reachable by anyone who knew the URL.
// After the OTP is verified we now also set a signed, httpOnly cookie, and
// write endpoints check it server-side.
//
// The token is signed with CRON_SECRET, an existing server-only value, so no
// new environment variable has to be provisioned for this to work.

import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export const ADMIN_COOKIE = 'lmai_admin'

export const SESSION_MS = 12 * 60 * 60 * 1000 // 12 hours
export const REMEMBERED_MS = 30 * 24 * 60 * 60 * 1000 // "trust this browser"

function signingKey(): string {
  const key = process.env.CRON_SECRET
  if (!key) throw new Error('CRON_SECRET not set — admin sessions cannot be signed')
  return key
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('hex')
}

/** Token of the form "<expiresAt>.<hmac>". */
export function createAdminToken(lifetimeMs: number = SESSION_MS): string {
  const expiresAt = String(Date.now() + lifetimeMs)
  return `${expiresAt}.${sign(expiresAt)}`
}

export function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false
  const [expiresAt, mac] = token.split('.')
  if (!expiresAt || !mac) return false
  if (!/^\d+$/.test(expiresAt) || Date.now() > Number(expiresAt)) return false

  const expected = sign(expiresAt)
  // Both are hex of the same length, so the comparison cannot throw on length.
  if (expected.length !== mac.length) return false
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(mac, 'hex'))
}

export function isAdminRequest(req: NextRequest): boolean {
  try {
    return isValidAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)
  } catch {
    return false
  }
}

export function adminCookieOptions(lifetimeMs: number = SESSION_MS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(lifetimeMs / 1000),
  }
}
