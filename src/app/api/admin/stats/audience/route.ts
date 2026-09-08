// Marketing list health.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const [contacts, consented, suppressed] = await Promise.all([
    supabase.from('marketing_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('marketing_contacts').select('*', { count: 'exact', head: true }).eq('consent_marketing', true),
    supabase.from('email_suppressions').select('*', { count: 'exact', head: true }),
  ])

  // These tables arrive with a migration that may not have been run yet.
  const unavailable = Boolean(contacts.error || suppressed.error)

  return NextResponse.json({
    contacts: contacts.count ?? 0,
    marketingConsented: consented.count ?? 0,
    unsubscribed: suppressed.count ?? 0,
    unavailable,
  })
}
