'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles, Layers, Users, Eye, MousePointerClick, DollarSign, Gavel } from 'lucide-react'
import SpotlightDetail from '@/components/admin/SpotlightDetail'
import AnnounceSpotlight from '@/components/admin/AnnounceSpotlight'

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

/**
 * Each section fetches independently.
 *
 * These were one request, and a single slow query took the whole overview down
 * with it. Separate requests mean the fast sections paint immediately and one
 * failure costs only its own block.
 */
function useSection<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => { if (alive) setData(d) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [url])

  return { data, failed }
}

function SectionShell({ title, icon: Icon, failed, loading, children }: {
  title: string; icon?: React.ElementType; failed: boolean; loading: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />} {title}
      </p>
      {failed ? (
        <p className="rounded-xl border px-4 py-3 text-xs text-slate-500" style={{ borderColor: '#1e2a3a' }}>
          Couldn&apos;t load this section.
        </p>
      ) : loading ? (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-5 text-xs text-slate-600" style={{ borderColor: '#1e2a3a' }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : children}
    </div>
  )
}

interface Listings { total: number; pending: number; claimed: number }
interface Spotlight {
  totalBids: number; uniqueBidders: number; mockRevenueCents: number
  totalImpressions: number; totalClicks: number; highestBidCents: number
  currentHolder: { name: string; amountCents: number; expiresAt: string } | null
  unavailable?: boolean
}
interface Audience { contacts: number; marketingConsented: number; unsubscribed: number; unavailable?: boolean }

export default function StatsOverview() {
  const listings  = useSection<Listings>('/api/admin/stats/listings')
  const spotlight = useSection<Spotlight>('/api/admin/stats/spotlight')
  const audience  = useSection<Audience>('/api/admin/stats/audience')

  const ctr = spotlight.data && spotlight.data.totalImpressions > 0
    ? ((spotlight.data.totalClicks / spotlight.data.totalImpressions) * 100).toFixed(1) + '%'
    : '—'

  return (
    <div className="space-y-6">
      <SectionShell title="Listings" icon={Layers} failed={listings.failed} loading={!listings.data}>
        {listings.data && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon={Layers} label="Total"   value={listings.data.total} sub="approximate" />
            <Stat icon={Layers} label="Pending" value={listings.data.pending} color="#f59e0b" />
            <Stat icon={Users}  label="Claimed" value={listings.data.claimed} color="#3b82f6" />
          </div>
        )}
      </SectionShell>

      <SectionShell title="Spotlight auction" icon={Sparkles} failed={spotlight.failed} loading={!spotlight.data}>
        {spotlight.data && (spotlight.data.unavailable ? (
          <p className="rounded-xl border px-4 py-3 text-xs text-slate-500" style={{ borderColor: '#1e2a3a' }}>
            Not set up yet — run the spotlight_bids migration.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat icon={Gavel}             label="Bids"        value={spotlight.data.totalBids} />
              <Stat icon={Users}             label="Bidders"     value={spotlight.data.uniqueBidders} />
              <Stat icon={DollarSign}        label="Bid value"   value={money(spotlight.data.mockRevenueCents)} sub="mock — nothing charged" color="#e94560" />
              <Stat icon={Eye}               label="Impressions" value={spotlight.data.totalImpressions} />
              <Stat icon={MousePointerClick} label="Clicks"      value={spotlight.data.totalClicks} sub={`CTR ${ctr}`} />
              <Stat icon={DollarSign}        label="Highest bid" value={money(spotlight.data.highestBidCents)} />
            </div>
            <div className="mt-4"><SpotlightDetail /></div>

            {spotlight.data.currentHolder && (
              <div className="mt-3 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.05)' }}>
                <span className="text-slate-400">On the homepage now: </span>
                <strong className="text-white">{spotlight.data.currentHolder.name}</strong>
                <span className="text-slate-400"> at {money(spotlight.data.currentHolder.amountCents)} — until{' '}
                  {new Date(spotlight.data.currentHolder.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </>
        ))}
      </SectionShell>

      <div><AnnounceSpotlight /></div>

      <SectionShell title="Marketing list" icon={Users} failed={audience.failed} loading={!audience.data}>
        {audience.data && (audience.data.unavailable ? (
          <p className="rounded-xl border px-4 py-3 text-xs text-slate-500" style={{ borderColor: '#1e2a3a' }}>
            Not set up yet — run the marketing_consent migration.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon={Users} label="Contacts"     value={audience.data.contacts} />
            <Stat icon={Users} label="Consented"    value={audience.data.marketingConsented} color="#10b981" sub="may receive marketing" />
            <Stat icon={Users} label="Unsubscribed" value={audience.data.unsubscribed} color="#f59e0b" sub="suppressed" />
          </div>
        ))}
      </SectionShell>
    </div>
  )
}
