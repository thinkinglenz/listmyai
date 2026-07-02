import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET() {
  const badges: Record<string, number> = { claims: 0, dmca: 0, listings: 0 }

  try {
    const { count: claimsCount } = await supabase
      .from('claim_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'pending_verification'])
    badges.claims = claimsCount ?? 0
  } catch {}

  try {
    const { count: dmcaCount } = await supabase
      .from('dmca_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    badges.dmca = dmcaCount ?? 0
  } catch {}

  try {
    const { count: pendingListings } = await supabase
      .from('ai_tools')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    badges.listings = pendingListings ?? 0
  } catch {}

  try {
    const { count: blogComments } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    badges.blog_comments = blogComments ?? 0
  } catch {}

  try {
    const { count: toolComments } = await supabase
      .from('tool_comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    badges.tool_comments = toolComments ?? 0
  } catch {}

  return NextResponse.json(badges)
}
