import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()

  // Fetch all comparison logs
  const { data: logs, error } = await supabase
    .from('comparison_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) {
    // Table might not exist yet
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({
        setup_required: true,
        sql: `CREATE TABLE comparison_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_a_slug text NOT NULL,
  tool_b_slug text NOT NULL,
  tool_a_name text NOT NULL DEFAULT '',
  tool_b_name text NOT NULL DEFAULT '',
  ip_hash text NOT NULL DEFAULT '',
  use_case text,
  cache_hit boolean DEFAULT false,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  rate_limited boolean DEFAULT false,
  model text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_comparison_logs_created ON comparison_logs(created_at DESC);
CREATE INDEX idx_comparison_logs_ip ON comparison_logs(ip_hash);`,
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const allLogs = logs || []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 86400_000)
  const monthAgo = new Date(now.getTime() - 30 * 86400_000)

  // ── Aggregate stats ─────────────────────────────────────────────────────
  const totalComparisons = allLogs.length
  const apiCalls = allLogs.filter(l => !l.cache_hit && !l.rate_limited).length
  const cacheHits = allLogs.filter(l => l.cache_hit).length
  const rateLimited = allLogs.filter(l => l.rate_limited).length
  const totalTokensInput = allLogs.reduce((sum, l) => sum + (l.tokens_input || 0), 0)
  const totalTokensOutput = allLogs.reduce((sum, l) => sum + (l.tokens_output || 0), 0)
  const totalTokens = totalTokensInput + totalTokensOutput
  const uniqueUsers = new Set(allLogs.map(l => l.ip_hash)).size

  // Today's stats
  const todayLogs = allLogs.filter(l => new Date(l.created_at) >= todayStart)
  const todayComparisons = todayLogs.length
  const todayApiCalls = todayLogs.filter(l => !l.cache_hit && !l.rate_limited).length
  const todayTokens = todayLogs.reduce((sum, l) => sum + (l.tokens_input || 0) + (l.tokens_output || 0), 0)
  const todayUniqueUsers = new Set(todayLogs.map(l => l.ip_hash)).size
  const todayRateLimited = todayLogs.filter(l => l.rate_limited).length

  // This week
  const weekLogs = allLogs.filter(l => new Date(l.created_at) >= weekAgo)
  const weekComparisons = weekLogs.length
  const weekTokens = weekLogs.reduce((sum, l) => sum + (l.tokens_input || 0) + (l.tokens_output || 0), 0)
  const weekUniqueUsers = new Set(weekLogs.map(l => l.ip_hash)).size

  // ── Estimated cost (Haiku 4.5: $1/MTok in, $5/MTok out) ────────────────
  const estimatedCost = (totalTokensInput / 1_000_000) * 1 + (totalTokensOutput / 1_000_000) * 5

  // ── Cache hit rate ─────────────────────────────────────────────────────
  const cacheHitRate = totalComparisons > 0
    ? Math.round((cacheHits / totalComparisons) * 100)
    : 0

  // ── Top compared tools ─────────────────────────────────────────────────
  const toolCounts: Record<string, { name: string; count: number }> = {}
  for (const l of allLogs) {
    if (l.rate_limited) continue
    const keyA = l.tool_a_slug
    const keyB = l.tool_b_slug
    if (!toolCounts[keyA]) toolCounts[keyA] = { name: l.tool_a_name || keyA, count: 0 }
    if (!toolCounts[keyB]) toolCounts[keyB] = { name: l.tool_b_name || keyB, count: 0 }
    toolCounts[keyA].count++
    toolCounts[keyB].count++
  }
  const topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))

  // ── Top compared pairs ─────────────────────────────────────────────────
  const pairCounts: Record<string, { a: string; b: string; count: number }> = {}
  for (const l of allLogs) {
    if (l.rate_limited) continue
    const sorted = [l.tool_a_slug, l.tool_b_slug].sort()
    const key = sorted.join(' vs ')
    if (!pairCounts[key]) pairCounts[key] = { a: l.tool_a_name || sorted[0], b: l.tool_b_name || sorted[1], count: 0 }
    pairCounts[key].count++
  }
  const topPairs = Object.entries(pairCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([, v]) => ({ pair: `${v.a} vs ${v.b}`, count: v.count }))

  // ── Daily breakdown (last 30 days) ─────────────────────────────────────
  const dailyMap: Record<string, { comparisons: number; apiCalls: number; tokens: number; users: Set<string>; rateLimited: number }> = {}
  const monthLogs = allLogs.filter(l => new Date(l.created_at) >= monthAgo)
  for (const l of monthLogs) {
    const day = new Date(l.created_at).toISOString().slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { comparisons: 0, apiCalls: 0, tokens: 0, users: new Set(), rateLimited: 0 }
    dailyMap[day].comparisons++
    dailyMap[day].users.add(l.ip_hash)
    if (l.rate_limited) dailyMap[day].rateLimited++
    if (!l.cache_hit && !l.rate_limited) {
      dailyMap[day].apiCalls++
      dailyMap[day].tokens += (l.tokens_input || 0) + (l.tokens_output || 0)
    }
  }

  // Fill in missing days
  const daily = []
  for (let d = new Date(monthAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const entry = dailyMap[key]
    daily.push({
      date: key,
      comparisons: entry?.comparisons || 0,
      apiCalls: entry?.apiCalls || 0,
      tokens: entry?.tokens || 0,
      uniqueUsers: entry?.users.size || 0,
      rateLimited: entry?.rateLimited || 0,
    })
  }

  // ── Heavy users (users who hit rate limits or use most) ─────────────────
  const userUsage: Record<string, { total: number; rateLimited: number; tokens: number }> = {}
  for (const l of allLogs) {
    if (!userUsage[l.ip_hash]) userUsage[l.ip_hash] = { total: 0, rateLimited: 0, tokens: 0 }
    userUsage[l.ip_hash].total++
    if (l.rate_limited) userUsage[l.ip_hash].rateLimited++
    userUsage[l.ip_hash].tokens += (l.tokens_input || 0) + (l.tokens_output || 0)
  }
  const heavyUsers = Object.entries(userUsage)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .map(([hash, v]) => ({
      ip_hash: hash.slice(0, 8) + '…',
      comparisons: v.total,
      rate_limited: v.rateLimited,
      tokens_used: v.tokens,
    }))

  // ── Recent comparisons (last 20) ────────────────────────────────────────
  const recent = allLogs.slice(0, 20).map(l => ({
    tool_a: l.tool_a_name || l.tool_a_slug,
    tool_b: l.tool_b_name || l.tool_b_slug,
    cache_hit: l.cache_hit,
    rate_limited: l.rate_limited,
    tokens: (l.tokens_input || 0) + (l.tokens_output || 0),
    ip: (l.ip_hash || '').slice(0, 8) + '…',
    time: l.created_at,
  }))

  return NextResponse.json({
    summary: {
      total_comparisons: totalComparisons,
      api_calls: apiCalls,
      cache_hits: cacheHits,
      cache_hit_rate: cacheHitRate,
      rate_limited: rateLimited,
      unique_users: uniqueUsers,
      total_tokens: totalTokens,
      tokens_input: totalTokensInput,
      tokens_output: totalTokensOutput,
      estimated_cost_usd: Math.round(estimatedCost * 1000) / 1000,
    },
    today: {
      comparisons: todayComparisons,
      api_calls: todayApiCalls,
      tokens: todayTokens,
      unique_users: todayUniqueUsers,
      rate_limited: todayRateLimited,
    },
    week: {
      comparisons: weekComparisons,
      tokens: weekTokens,
      unique_users: weekUniqueUsers,
    },
    top_tools: topTools,
    top_pairs: topPairs,
    heavy_users: heavyUsers,
    daily,
    recent,
  })
}
