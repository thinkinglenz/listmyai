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

    // Get total upvotes — sum of ai_tools.upvotes (matches what tool pages show)
    let totalUpvotes = 0
    try {
      // PostgREST aggregate — single fast query
      const { data: agg, error: aggErr } = await supabase.from('ai_tools').select('upvotes.sum()')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!aggErr && agg?.[0]) totalUpvotes = (agg[0] as any).sum ?? 0
      else if (aggErr) throw aggErr
    } catch {
      // Aggregates disabled — fetch only tools that have upvotes and sum here
      try {
        const { data } = await supabase.from('ai_tools').select('upvotes').gt('upvotes', 0).limit(20000)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalUpvotes = (data ?? []).reduce((s, r: any) => s + (r.upvotes ?? 0), 0)
      } catch { /* keep 0 */ }
    }

    // Get total users from auth — paginate to get real count
    let totalUsers = 0
    try {
      let page = 1
      while (true) {
        const { data: authData } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
        const batch = authData?.users ?? []
        totalUsers += batch.length
        if (batch.length < 1000) break
        page++
      }
    } catch {
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

    // Rating stats — from ai_tools counters (matches what tool pages show,
    // and includes ratings saved via the pre-migration fallback)
    let avgRating = 0
    let totalReviews = 0
    try {
      const { data: rated } = await supabase
        .from('ai_tools')
        .select('rating_avg, rating_count')
        .gt('rating_count', 0)
        .limit(20000)
      for (const r of rated ?? []) {
        totalReviews += r.rating_count ?? 0
        avgRating += (r.rating_avg ?? 0) * (r.rating_count ?? 0)
      }
      avgRating = totalReviews > 0 ? avgRating / totalReviews : 0
    } catch { /* keep 0 */ }

    // Tools added in last 30 days — only fetch the date column, limit to recent
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('ai_tools')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)

    const dailyCounts: number[] = new Array(30).fill(0)
    // Only fetch individual dates if there are a reasonable number of recent tools
    if ((recentCount ?? 0) > 0 && (recentCount ?? 0) < 5000) {
      const { data: recentAdded } = await supabase
        .from('ai_tools')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true })
      if (recentAdded) {
        for (const t of recentAdded) {
          const daysAgo = Math.floor((Date.now() - new Date(t.created_at).getTime()) / (24 * 60 * 60 * 1000))
          const idx = 29 - Math.min(daysAgo, 29)
          dailyCounts[idx]++
        }
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
