'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3, Users, List, Shield, TrendingUp,
  ArrowUpRight, Globe, Star, ThumbsUp, AlertCircle,
} from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  color: string
  trend?: string
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: StatCardProps) {
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
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
          <TrendingUp className="h-3 w-3" /> {trend}
        </div>
      )}
    </div>
  )
}

const RECENT_CLAIMS = [
  { tool: 'AutoDraft AI', email: 'team@autodraft.ai', status: 'pending', ago: '2h ago' },
  { tool: 'CodeWhiz Pro', email: 'hello@codewhiz.io', status: 'pending', ago: '5h ago' },
  { tool: 'DataBot Pro', email: 'admin@databot.pro', status: 'approved', ago: '1d ago' },
  { tool: 'SynthVoice', email: 'ops@synthvoice.com', status: 'manual', ago: '2d ago' },
]

const RECENT_TOOLS = [
  { name: 'NeuralDraw', category: 'Image Generation', status: 'active', date: 'Today' },
  { name: 'ScriptGenius', category: 'Writing', status: 'pending', date: 'Today' },
  { name: 'DataForge AI', category: 'Analytics', status: 'active', date: 'Yesterday' },
  { name: 'VoiceClone Pro', category: 'Audio', status: 'active', date: 'Yesterday' },
  { name: 'ResumeBot', category: 'Productivity', status: 'rejected', date: '2d ago' },
]

const STATUS_COLOR: Record<string, string> = {
  active: '#10b981', pending: '#f59e0b', rejected: '#ef4444', approved: '#10b981', manual: '#6366f1',
}
const STATUS_BG: Record<string, string> = {
  active: 'rgba(16,185,129,0.1)', pending: 'rgba(245,158,11,0.1)', rejected: 'rgba(239,68,68,0.1)',
  approved: 'rgba(16,185,129,0.1)', manual: 'rgba(99,102,241,0.1)',
}

interface Stats {
  totalTools: number; totalUsers: number; claimedTools: number
  pendingTools: number; totalUpvotes: number; totalReviews: number; dmcaOpen: number
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
        <StatCard label="Total Listings" value={s ? s.totalTools.toLocaleString() : '—'} sub={s ? `${s.pendingTools} pending review` : 'Loading…'} icon={List} color="#e94560" />
        <StatCard label="Registered Users" value={s ? s.totalUsers.toLocaleString() : '—'} sub="From Supabase Auth" icon={Users} color="#6366f1" />
        <StatCard label="Claimed Listings" value={s ? s.claimedTools.toLocaleString() : '—'} sub={s && s.totalTools > 0 ? `${Math.round((s.claimedTools/s.totalTools)*100)}% claim rate` : '—'} icon={Shield} color="#10b981" />
        <StatCard label="Total Upvotes" value={s ? s.totalUpvotes.toLocaleString() : '—'} sub="Across all tools" icon={ThumbsUp} color="#f59e0b" />
      </div>

      {/* Secondary stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Monthly Visitors</p>
          </div>
          <p className="text-2xl font-black text-white">42,100</p>
          <div className="mt-3 space-y-2">
            {[
              { page: '/tools/github-copilot', views: '3,240' },
              { page: '/tools/chatgpt', views: '2,890' },
              { page: '/categories', views: '1,740' },
            ].map(r => (
              <div key={r.page} className="flex justify-between text-xs">
                <span className="text-slate-500 truncate">{r.page}</span>
                <span className="text-slate-300 ml-2">{r.views}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-white">Reviews</p>
          </div>
          <p className="text-2xl font-black text-white">9,302</p>
          <div className="mt-3 space-y-1">
            {[
              { label: 'Avg. rating', value: '4.3 ★' },
              { label: '5-star reviews', value: '61%' },
              { label: 'Flagged', value: '7' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-slate-500">{r.label}</span>
                <span className="text-slate-300">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Action Required</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Pending claims', count: 3, href: '/admin/claims', color: '#f59e0b' },
              { label: 'DMCA requests', count: 1, href: '/admin/dmca', color: '#e94560' },
              { label: 'Pending listings', count: 8, href: '/admin/listings', color: '#6366f1' },
              { label: 'Flagged reviews', count: 7, href: '/admin/listings', color: '#94a3b8' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs transition hover:opacity-80"
                style={{ background: `${item.color}10` }}>
                <span style={{ color: item.color }}>{item.label}</span>
                <span className="flex items-center gap-1 font-bold" style={{ color: item.color }}>
                  {item.count} <ArrowUpRight className="h-3 w-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent claims */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <h2 className="font-bold text-white">Recent Claim Requests</h2>
            <a href="/admin/claims" className="text-xs hover:underline" style={{ color: '#e94560' }}>View all →</a>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {RECENT_CLAIMS.map(c => (
              <div key={c.tool} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{c.tool}</p>
                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                </div>
                <span className="text-xs text-slate-600">{c.ago}</span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                  style={{ color: STATUS_COLOR[c.status], background: STATUS_BG[c.status] }}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent listings */}
        <div className="rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
            <h2 className="font-bold text-white">Recently Added Tools</h2>
            <a href="/admin/listings" className="text-xs hover:underline" style={{ color: '#e94560' }}>View all →</a>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
            {RECENT_TOOLS.map(t => (
              <div key={t.name} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.category}</p>
                </div>
                <span className="text-xs text-slate-600">{t.date}</span>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                  style={{ color: STATUS_COLOR[t.status], background: STATUS_BG[t.status] }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart placeholder */}
      <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-500" />
          <h2 className="font-bold text-white">New Listings — Last 30 Days</h2>
        </div>
        <div className="flex h-32 items-end gap-1">
          {[4,7,5,9,12,8,6,14,10,7,11,9,13,15,8,12,16,10,9,14,11,13,18,15,12,16,20,17,14,19].map((v, i) => (
            <div key={i} className="flex-1 rounded-t"
              style={{ height: `${(v / 20) * 100}%`, background: i >= 27 ? '#e94560' : '#1e2a3a' }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-600">
          <span>Apr 19</span><span>Apr 30</span><span>May 10</span><span>May 19</span>
        </div>
      </div>
    </div>
  )
}
