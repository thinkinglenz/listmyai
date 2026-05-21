'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3, Users, List, Shield, TrendingUp,
  ArrowUpRight, Star, ThumbsUp, AlertCircle,
} from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
}

function StatCard({ label, value, sub, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  active: '#10b981', pending: '#f59e0b', rejected: '#ef4444', approved: '#10b981',
  manual: '#6366f1', claimed: '#3b82f6', pending_verification: '#8b5cf6',
}
const STATUS_BG: Record<string, string> = {
  active: 'rgba(16,185,129,0.1)', pending: 'rgba(245,158,11,0.1)', rejected: 'rgba(239,68,68,0.1)',
  approved: 'rgba(16,185,129,0.1)', manual: 'rgba(99,102,241,0.1)', claimed: 'rgba(59,130,246,0.1)',
  pending_verification: 'rgba(139,92,246,0.1)',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface Stats {
  totalTools: number
  totalUsers: number
  claimedTools: number
  pendingTools: number
  totalUpvotes: number
  pendingClaims: number
  dmcaOpen: number
  totalReviews: number
  avgRating: number
  recentClaims: { tool: string; email: string; status: string; created_at: string }[]
  recentTools: { name: string; slug: string; category: string; status: string; created_at: string }[]
  dailyCounts: number[]
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  const s = stats

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Admin Overview</h1>
        <p className="text-sm text-slate-500">Welcome back. Here&apos;s what&apos;s happening on ListmyAI.</p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Listings" value={s ? s.totalTools.toLocaleString() : '...'} sub={s ? `${s.pendingTools} pending review` : 'Loading...'} icon={List} color="#e94560" />
        <StatCard label="Registered Users" value={s ? s.totalUsers.toLocaleString() : '...'} sub="From Supabase Auth" icon={Users} color="#6366f1" />
        <StatCard label="Claimed Listings" value={s ? s.claimedTools.toLocaleString() : '...'} sub={s && s.totalTools > 0 ? `${Math.round((s.claimedTools / s.totalTools) * 100)}% claim rate` : '...'} icon={Shield} color="#10b981" />
        <StatCard label="Total Upvotes" value={s ? s.totalUpvotes.toLocaleString() : '...'} sub="Across all tools" icon={ThumbsUp} color="#f59e0b" />
      </div>

      {/* Secondary stats — all real data */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Reviews & Ratings</p>
          </div>
          <p className="text-2xl font-black text-white">{s ? s.totalReviews.toLocaleString() : '...'}</p>
          <p className="text-xs text-slate-500 mt-1">Total ratings across all tools</p>
          {s && s.avgRating > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-amber-400">{'★'.repeat(Math.round(s.avgRating))}</span>
              <span className="text-white font-bold">{s.avgRating.toFixed(1)}</span>
              <span className="text-slate-500 text-xs">avg rating</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Action Required</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Pending claims', count: s?.pendingClaims ?? 0, href: '/admin/claims', color: '#f59e0b' },
              { label: 'DMCA requests', count: s?.dmcaOpen ?? 0, href: '/admin/dmca', color: '#e94560' },
              { label: 'Pending listings', count: s?.pendingTools ?? 0, href: '/admin/listings', color: '#6366f1' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs transition hover:opacity-80"
                style={{ background: `${item.color}10` }}>
                <span style={{ color: item.color }}>{item.label}</span>
                <span className="flex items-center gap-1 font-bold" style={{ color: item.color }}>
                  {item.count} <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent claims — real data */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <h2 className="font-bold text-white">Recent Claim Requests</h2>
            <Link href="/admin/claims" className="text-xs hover:underline" style={{ color: '#e94560' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {s?.recentClaims && s.recentClaims.length > 0 ? (
              s.recentClaims.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{c.tool}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  </div>
                  <span className="text-xs text-slate-600">{timeAgo(c.created_at)}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                    style={{ color: STATUS_COLOR[c.status] ?? '#94a3b8', background: STATUS_BG[c.status] ?? 'rgba(148,163,184,0.1)' }}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-600">
                {s ? 'No claim requests yet' : 'Loading...'}
              </div>
            )}
          </div>
        </div>

        {/* Recent listings — real data */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <h2 className="font-bold text-white">Recently Added Tools</h2>
            <Link href="/admin/listings" className="text-xs hover:underline" style={{ color: '#e94560' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {s?.recentTools && s.recentTools.length > 0 ? (
              s.recentTools.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.category}</p>
                  </div>
                  <span className="text-xs text-slate-600">{timeAgo(t.created_at)}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                    style={{ color: STATUS_COLOR[t.status] ?? '#94a3b8', background: STATUS_BG[t.status] ?? 'rgba(148,163,184,0.1)' }}>
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-600">
                {s ? 'No tools yet' : 'Loading...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real bar chart — last 30 days */}
      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-500" />
          <h2 className="font-bold text-white">New Listings — Last 30 Days</h2>
          {s && <span className="ml-auto text-xs text-slate-500">{s.dailyCounts.reduce((a, b) => a + b, 0)} total</span>}
        </div>
        <div className="flex h-32 items-end gap-1">
          {(s?.dailyCounts ?? new Array(30).fill(0)).map((v, i) => {
            const max = Math.max(...(s?.dailyCounts ?? [1]), 1)
            return (
              <div key={i} className="flex-1 rounded-t transition-all"
                title={`${v} tools`}
                style={{ height: `${Math.max((v / max) * 100, 2)}%`, background: i >= 27 ? '#e94560' : v > 0 ? '#1e3a5f' : '#1e2a3a' }} />
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-600">
          <span>{new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
