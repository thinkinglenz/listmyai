import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const [
      { count: totalTools },
      { count: pendingTools },
      { count: claimedTools },
      { count: pendingClaims },
    ] = await Promise.all([
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }),
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('claimed', true),
      supabase.from('claim_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'pending_verification']),
    ])

    // DMCA — table might not exist
    let dmcaOpen = 0
    try {
      const { count } = await supabase.from('dmca_requests').select('*', { count: 'exact', head: true }).eq('status', 'open')
      dmcaOpen = count ?? 0
    } catch { /* table doesn't exist */ }

    // Get total upvotes — try ai_tools.upvotes column first, fallback to upvotes table count
    let totalUpvotes = 0
    try {
      const { data: upvoteData, error: upErr } = await supabase
        .from('ai_tools')
        .select('upvotes')
        .gt('upvotes', 0)
      if (!upErr && upvoteData && upvoteData.length > 0) {
        totalUpvotes = upvoteData.reduce((s, t) => s + (t.upvotes || 0), 0)
      } else {
        // Fallback: count rows in upvotes table
        const { count } = await supabase.from('upvotes').select('*', { count: 'exact', head: true })
        totalUpvotes = count ?? 0
      }
    } catch {
      // Last resort: count from upvotes table
      try {
        const { count } = await supabase.from('upvotes').select('*', { count: 'exact', head: true })
        totalUpvotes = count ?? 0
      } catch { /* neither exists */ }
    }

    // Get total users from auth
    let totalUsers = 0
    try {
      const { data: authData } = await supabase.auth.admin.listUsers()
      totalUsers = authData?.users?.length ?? 0
    } catch { /* profiles fallback */
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      totalUsers = count ?? 0
    }

    // Recent claims (real data)
    const { data: recentClaims } = await supabase
      .from('claim_requests')
      .select('id, claimant_email, claimant_name, status, created_at, ai_tools(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    // Recent tools (real data)
    const { data: recentTools } = await supabase
      .from('ai_tools')
      .select('id, name, slug, status, created_at, categories(name)')
      .order('created_at', { ascending: false })
      .limit(5)

    // Rating stats — try ai_tools columns first, fallback to ratings table
    let avgRating = 0
    let totalReviews = 0
    try {
      const { data: ratingData, error: ratErr } = await supabase
        .from('ai_tools')
        .select('rating_avg, rating_count')
        .gt('rating_count', 0)

      if (!ratErr && ratingData && ratingData.length > 0) {
        totalReviews = ratingData.reduce((s, t) => s + (t.rating_count || 0), 0)
        const weighted = ratingData.reduce((s, t) => s + (t.rating_avg || 0) * (t.rating_count || 0), 0)
        avgRating = totalReviews > 0 ? weighted / totalReviews : 0
      } else {
        // Fallback: count from ratings table
        const { count } = await supabase.from('ratings').select('*', { count: 'exact', head: true })
        totalReviews = count ?? 0
        if (totalReviews > 0) {
          const { data: allRatings } = await supabase.from('ratings').select('rating')
          if (allRatings && allRatings.length > 0) {
            avgRating = allRatings.reduce((s, r) => s + (r.rating || 0), 0) / allRatings.length
          }
        }
      }
    } catch {
      try {
        const { count } = await supabase.from('ratings').select('*', { count: 'exact', head: true })
        totalReviews = count ?? 0
      } catch { /* neither exists */ }
    }

    // Tools added in last 30 days by day
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAdded } = await supabase
      .from('ai_tools')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    // Group by day
    const dailyCounts: number[] = new Array(30).fill(0)
    if (recentAdded) {
      for (const t of recentAdded) {
        const daysAgo = Math.floor((Date.now() - new Date(t.created_at).getTime()) / (24 * 60 * 60 * 1000))
        const idx = 29 - Math.min(daysAgo, 29)
        dailyCounts[idx]++
      }
    }

    return NextResponse.json({
      totalTools: totalTools ?? 0,
      totalUsers,
      claimedTools: claimedTools ?? 0,
      pendingTools: pendingTools ?? 0,
      totalUpvotes,
      pendingClaims: pendingClaims ?? 0,
      dmcaOpen: dmcaOpen ?? 0,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      recentClaims: (recentClaims ?? []).map((c: Record<string, unknown>) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tool: (c.ai_tools as any)?.name ?? 'Unknown',
        email: c.claimant_email,
        status: c.status,
        created_at: c.created_at,
      })),
      recentTools: (recentTools ?? []).map((t: Record<string, unknown>) => ({
        name: t.name,
        slug: t.slug,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: (t.categories as any)?.name ?? 'Other',
        status: t.status,
        created_at: t.created_at,
      })),
      dailyCounts,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
