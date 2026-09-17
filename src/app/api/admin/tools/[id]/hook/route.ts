// The Instagram headline for one listing. GET returns it, writing it first if
// the listing has none; POST writes a fresh one.

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { getSocialHook } from '@/lib/social/hook'

async function handle(req: NextRequest, id: string, regenerate: boolean) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  const hook = await getSocialHook(id, { regenerate })
  return NextResponse.json({ hook })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(req, (await params).id, false)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(req, (await params).id, true)
}
