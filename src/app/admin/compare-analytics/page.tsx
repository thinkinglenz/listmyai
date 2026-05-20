'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, Zap, Users, ShieldAlert, Database, DollarSign,
  TrendingUp, Clock, ArrowUpRight, AlertTriangle, Copy, Check,
} from 'lucide-react'

interface Summary {
  total_comparisons: number
  api_calls: number
  cache_hits: number
  cache_hit_rate: number
  rate_limited: number
  unique_users: number
  total_tokens: number
  tokens_input: number
  tokens_output: number
  estimated_cost_usd: number
}

interface DailyEntry {
  date: string
  comparisons: number
  apiCalls: number
  tokens: number
  uniqueUsers: number
  rateLimited: number
}

interface Analytics {
  setup_required?: boolean
  sql?: string
  summary: Summary
  today: { comparisons: number; api_calls: number; tokens: number; unique_users: number; rate_limited: number }
  week: { comparisons: number; tokens: number; unique_users: number }
  top_tools: { slug: string; name: string; count: number }[]
  top_pairs: { pair: string; count: number }[]
  heavy_users: { ip_hash: string; comparisons: number; rate_limited: number; tokens_used: number }[]
  daily: DailyEntry[]
  recent: { tool_a: string; tool_b: string; cache_hit: boolean; rate_limited: boolean; tokens: number; ip: string; time: string }[]
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function MiniBar({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  return (
    <div className="flex h-16 items-end gap-[2px]">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t transition-all"
          style={{
            height: maxVal > 0 ? `${Math.max(2, (v / maxVal) * 100)}%` : '2%',
            background: i >= data.length - 2 ? color : '#1e2a3a',
          }} />
      ))}
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CompareAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/admin/compare-analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-red-500" />
      </div>
    )
  }

  // ── Setup required ─────────────────────────────────────────────────────
  if (data?.setup_required) {
    return (
      <div>
        <h1 className="text-2xl font-black text-white mb-2">Compare Analytics</h1>
        <p className="text-sm text-slate-500 mb-6">One-time setup: create the comparison_logs table in Supabase.</p>

        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-amber-400" />
            <p className="font-bold text-white">Run this SQL in Supabase → SQL Editor</p>
          </div>
          <div className="relative">
            <pre className="rounded-xl p-4 text-xs text-green-400 overflow-x-auto" style={{ background: '#0d1117' }}>
              {data.sql}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(data.sql || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="absolute top-3 right-3 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:text-white"
              style={{ background: '#1e2a3a' }}>
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">After running the SQL, refresh this page. Analytics will start tracking automatically.</p>
        </div>
      </div>
    )
  }

  if (!data?.summary) return null

  const s = data.summary
  const maxDaily = Math.max(...data.daily.map(d => d.comparisons), 1)
  const maxDailyTokens = Math.max(...data.daily.map(d => d.tokens), 1)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Compare Analytics</h1>
        <p className="text-sm text-slate-500">AI comparison usage, costs, and rate limiting — all data from Supabase (free)</p>
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} label="Total Comparisons" value={s.total_comparisons} sub={`${s.api_calls} API calls · ${s.cache_hits} cached`} color="#e94560" />
        <StatCard icon={Users} label="Unique Users" value={s.unique_users} sub={`${data.today.unique_users} today`} color="#6366f1" />
        <StatCard icon={Zap} label="Tokens Used" value={formatTokens(s.total_tokens)} sub={`${formatTokens(s.tokens_input)} in · ${formatTokens(s.tokens_output)} out`} color="#f59e0b" />
        <StatCard icon={DollarSign} label="API Cost" value="$0.00" sub="Data-driven (no AI API)" color="#10b981" />
      </div>

      {/* ── Today + Rate Limit + Cache ──────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Today</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Comparisons', value: data.today.comparisons },
              { label: 'API calls', value: data.today.api_calls },
              { label: 'Tokens', value: formatTokens(data.today.tokens) },
              { label: 'Unique users', value: data.today.unique_users },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-slate-500">{r.label}</span>
                <span className="font-semibold text-slate-300">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Rate Limiting</p>
          </div>
          <p className="text-2xl font-black text-white">{s.rate_limited}</p>
          <p className="text-xs text-slate-500 mt-1">Total blocked requests</p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Today</span>
              <span className="font-semibold" style={{ color: data.today.rate_limited > 0 ? '#f59e0b' : '#64748b' }}>
                {data.today.rate_limited}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Limit</span>
              <span className="text-slate-300">5 / hour / IP</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Cache Performance</p>
          </div>
          <p className="text-2xl font-black text-white">{s.cache_hit_rate}%</p>
          <p className="text-xs text-slate-500 mt-1">Hit rate ({s.cache_hits} / {s.total_comparisons})</p>
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${s.cache_hit_rate}%`, background: '#10b981' }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-600">
              <span>Saved ≈ ${(((s.cache_hits * 1500) / 1_000_000) * 5).toFixed(3)}</span>
              <span>TTL: 24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily chart ─────────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Daily Comparisons — Last 30 Days</p>
          </div>
          <MiniBar data={data.daily.map(d => d.comparisons)} maxVal={maxDaily} color="#e94560" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-600">
            <span>{data.daily[0]?.date?.slice(5)}</span>
            <span>{data.daily[Math.floor(data.daily.length / 2)]?.date?.slice(5)}</span>
            <span>{data.daily[data.daily.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Daily Tokens — Last 30 Days</p>
          </div>
          <MiniBar data={data.daily.map(d => d.tokens)} maxVal={maxDailyTokens} color="#f59e0b" />
          <div className="mt-2 flex justify-between text-[10px] text-slate-600">
            <span>{data.daily[0]?.date?.slice(5)}</span>
            <span>{data.daily[Math.floor(data.daily.length / 2)]?.date?.slice(5)}</span>
            <span>{data.daily[data.daily.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>
      </div>

      {/* ── Top tools + pairs + heavy users ─────────────────────────────────── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Top compared tools */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <p className="text-sm font-semibold text-white">Most Compared Tools</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {data.top_tools.length === 0 && (
              <p className="px-5 py-6 text-xs text-slate-600 text-center">No data yet</p>
            )}
            {data.top_tools.map((t, i) => (
              <div key={t.slug} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-xs font-bold text-slate-600 w-5">{i + 1}</span>
                <span className="flex-1 text-sm text-white truncate">{t.name}</span>
                <span className="text-xs font-semibold text-slate-400">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top pairs */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <p className="text-sm font-semibold text-white">Top Comparison Pairs</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {data.top_pairs.length === 0 && (
              <p className="px-5 py-6 text-xs text-slate-600 text-center">No data yet</p>
            )}
            {data.top_pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-xs font-bold text-slate-600 w-5">{i + 1}</span>
                <span className="flex-1 text-xs text-slate-300 truncate">{p.pair}</span>
                <span className="text-xs font-semibold text-slate-400">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heavy users */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <p className="text-sm font-semibold text-white">Top Users by Usage</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Hashed IPs for privacy</p>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {data.heavy_users.length === 0 && (
              <p className="px-5 py-6 text-xs text-slate-600 text-center">No data yet</p>
            )}
            {data.heavy_users.map((u, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-[10px] font-mono text-slate-600 w-16 truncate">{u.ip_hash}</span>
                <span className="flex-1 text-xs text-slate-300">
                  {u.comparisons} runs
                  {u.rate_limited > 0 && (
                    <span className="ml-1.5 text-amber-400">· {u.rate_limited} blocked</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500">{formatTokens(u.tokens_used)} tok</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent activity ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
          <p className="text-sm font-semibold text-white">Recent Comparisons</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-600 border-b" style={{ borderColor: '#1e2a3a' }}>
                <th className="px-5 py-2.5 text-left font-medium">Tool A</th>
                <th className="px-2 py-2.5 text-center font-medium">vs</th>
                <th className="px-2 py-2.5 text-left font-medium">Tool B</th>
                <th className="px-3 py-2.5 text-center font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Tokens</th>
                <th className="px-3 py-2.5 text-right font-medium">User</th>
                <th className="px-5 py-2.5 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1e2a3a' }}>
              {data.recent.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-slate-600">No comparisons yet</td></tr>
              )}
              {data.recent.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5 text-slate-300 truncate max-w-[120px]">{r.tool_a}</td>
                  <td className="px-2 py-2.5 text-center text-slate-700">vs</td>
                  <td className="px-2 py-2.5 text-slate-300 truncate max-w-[120px]">{r.tool_b}</td>
                  <td className="px-3 py-2.5 text-center">
                    {r.rate_limited ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-amber-400" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <AlertTriangle className="h-2.5 w-2.5" /> 429
                      </span>
                    ) : r.cache_hit ? (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-emerald-400" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        CACHED
                      </span>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-blue-400" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        API
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{r.tokens > 0 ? formatTokens(r.tokens) : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-600">{r.ip}</td>
                  <td className="px-5 py-2.5 text-right text-slate-600">{timeAgo(r.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pricing insight ─────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4" style={{ color: '#e94560' }} />
          <p className="font-bold text-white">Subscription Insights</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div>
            <p className="text-slate-500 mb-1">Avg. tokens per comparison</p>
            <p className="text-lg font-black text-white">
              {s.api_calls > 0 ? formatTokens(Math.round(s.total_tokens / s.api_calls)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Cost per comparison</p>
            <p className="text-lg font-black text-white">
              {s.api_calls > 0 ? `$${(s.estimated_cost_usd / s.api_calls).toFixed(4)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Suggested free tier</p>
            <p className="text-lg font-black text-white">5 / day</p>
            <p className="text-slate-600 mt-0.5">
              Pro plan: unlimited at ~${s.api_calls > 0 ? ((s.estimated_cost_usd / s.api_calls) * 100).toFixed(2) : '0.50'}/mo for 100 comparisons
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
