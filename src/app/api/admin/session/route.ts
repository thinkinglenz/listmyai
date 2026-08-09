// Tells the admin panel whether this browser holds a valid admin session, and
// lets it end one. The signed cookie is the single source of truth: the panel
// used to trust a token it minted itself in localStorage, which no server ever
// checked and which left write requests unauthenticated.

import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: isAdminRequest(req) })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
