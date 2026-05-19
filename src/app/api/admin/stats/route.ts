import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const [
      { count: totalTools },
      { count: totalUsers },
      { count: claimedTools },
      { count: pendingTools },
      { count: totalUpvotes },
      { count: totalReviews },
      { count: dmcaOpen },
    ] = await Promise.all([
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('claimed', true),
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('upvotes').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('dmca_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    ])

    return NextResponse.json({
      totalTools: totalTools ?? 0,
      totalUsers: totalUsers ?? 0,
      claimedTools: claimedTools ?? 0,
      pendingTools: pendingTools ?? 0,
      totalUpvotes: totalUpvotes ?? 0,
      totalReviews: totalReviews ?? 0,
      dmcaOpen: dmcaOpen ?? 0,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
