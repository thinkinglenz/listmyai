// Site-wide numbers for the admin overview.

import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { getAdminStats } from '@/lib/spotlight/stats'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }
  return NextResponse.json(await getAdminStats())
}
