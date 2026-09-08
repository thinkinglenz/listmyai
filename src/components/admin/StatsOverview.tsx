'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles, Layers, Users, Eye, MousePointerClick, DollarSign, Gavel } from 'lucide-react'

interface Stats {
  listings: { total: number; active: number; pending: number; claimed: number }
  spotlight: {
    totalBids: number; uniqueBidders: number; mockRevenueCents: number
    totalImpressions: number; totalClicks: number; highestBidCents: number
    currentHolder: { name: string; amountCents: number; expiresAt: string } | null
  }
  audience: { users: number; marketingConsented: number; unsubscribed: number }
}

const money = (c: number) => `$${(c / 100).toFixed(2)}`

function Stat({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1.5 text-2xl font-black" style={{ color: color ?? '#fff' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Could not load stats'))))
      .then(setStats)
      .catch(e => setError(e.message))
  }, [])

  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!stats) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-600" /></div>
  }

  const ctr = stats.spotlight.totalImpressions > 0
    ? ((stats.spotlight.totalClicks / stats.spotlight.totalImpressions) * 100).toFixed(1) + '%'
    : '—'

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Listings</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Layers} label="Total"   value={stats.listings.total} />
          <Stat icon={Layers} label="Active"  value={stats.listings.active}  color="#10b981" />
          <Stat icon={Layers} label="Pending" value={stats.listings.pending} color="#f59e0b" />
          <Stat icon={Users}  label="Claimed" value={stats.listings.claimed} color="#3b82f6" />
        </div>
      </div>

      <div>
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3.5 w-3.5" /> Spotlight auction
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat icon={Gavel}              label="Bids"        value={stats.spotlight.totalBids} />
          <Stat icon={Users}              label="Bidders"     value={stats.spotlight.uniqueBidders} />
          <Stat icon={DollarSign}         label="Bid value"   value={money(stats.spotlight.mockRevenueCents)} sub="mock — nothing charged" color="#e94560" />
          <Stat icon={Eye}                label="Impressions" value={stats.spotlight.totalImpressions} />
          <Stat icon={MousePointerClick}  label="Clicks"      value={stats.spotlight.totalClicks} sub={`CTR ${ctr}`} />
          <Stat icon={DollarSign}         label="Highest bid" value={money(stats.spotlight.highestBidCents)} />
        </div>

        {stats.spotlight.currentHolder && (
          <div className="mt-3 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.05)' }}>
            <span className="text-slate-400">On the homepage now: </span>
            <strong className="text-white">{stats.spotlight.currentHolder.name}</strong>
            <span className="text-slate-400"> at {money(stats.spotlight.currentHolder.amountCents)} — until{' '}
              {new Date(stats.spotlight.currentHolder.expiresAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Marketing list</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={Users} label="Contacts"     value={stats.audience.users} />
          <Stat icon={Users} label="Consented"    value={stats.audience.marketingConsented} color="#10b981"
            sub="may receive marketing" />
          <Stat icon={Users} label="Unsubscribed" value={stats.audience.unsubscribed} color="#f59e0b"
            sub="suppressed" />
        </div>
      </div>
    </div>
  )
}
