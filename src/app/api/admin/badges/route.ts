import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const badges: Record<string, number> = { claims: 0, dmca: 0 }

  try {
    const { count: claimsCount } = await supabase
      .from('claim_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    badges.claims = claimsCount ?? 0
  } catch {}

  try {
    const { count: dmcaCount } = await supabase
      .from('dmca_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    badges.dmca = dmcaCount ?? 0
  } catch {}

  return NextResponse.json(badges)
}
