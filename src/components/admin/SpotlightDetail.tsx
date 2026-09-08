'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface Claim {
  id: string; toolName: string; toolSlug: string; email: string | null
  amountCents: number; impressions: number; clicks: number; startsAt: string
  status: 'live' | 'taken over' | 'finished'
}
interface Bidder { email: string; claims: number; impressions: number; clicks: number; cents: number }

const money = (c: number) => `$${(c / 100).toFixed(2)}`

const STATUS: Record<Claim['status'], { color: string; bg: string }> = {
  'live':       { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  'taken over': { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  'finished':   { color: '#94a3b8', bg: 'rgba(100,116,139,0.12)' },
}

export default function SpotlightDetail() {
  const [data, setData] = useState<{ claims: Claim[]; bidders: Bidder[]; unavailable?: boolean } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats/spotlight-detail')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error())))
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  if (failed) return null
  if (!data) {
    return <div className="flex items-center gap-2 rounded-xl border px-4 py-5 text-xs text-slate-600" style={{ borderColor: '#1e2a3a' }}>
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading spotlight detail…
    </div>
  }
  if (data.unavailable || data.claims.length === 0) {
    return <p className="rounded-xl border px-4 py-3 text-xs text-slate-500" style={{ borderColor: '#1e2a3a' }}>
      Nobody has taken the spotlight yet.
    </p>
  }

  const ctr = (imp: number, clk: number) => imp > 0 ? `${((clk / imp) * 100).toFixed(1)}%` : '—'
  const th = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase text-slate-500'
  const td = 'px-4 py-2.5'

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3.5 w-3.5" /> Who has taken the spot
        </p>
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: '1px solid #1e2a3a' }}>
              <th className={th}>Customer</th><th className={th}>Times</th>
              <th className={th}>Impressions</th><th className={th}>Clicks</th>
              <th className={th}>CTR</th><th className={th}>Value</th>
            </tr></thead>
            <tbody>
              {data.bidders.map(b => (
                <tr key={b.email} style={{ borderBottom: '1px solid rgba(30,42,58,0.6)' }}>
                  <td className={`${td} text-white`}>{b.email}</td>
                  <td className={`${td} text-slate-300`}>{b.claims}</td>
                  <td className={`${td} text-slate-400`}>{b.impressions.toLocaleString()}</td>
                  <td className={`${td} text-slate-400`}>{b.clicks.toLocaleString()}</td>
                  <td className={`${td} text-slate-400`}>{ctr(b.impressions, b.clicks)}</td>
                  <td className={td} style={{ color: '#e94560' }}>{money(b.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Every placement</p>
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: '1px solid #1e2a3a' }}>
              <th className={th}>Listing</th><th className={th}>Customer</th>
              <th className={th}>Started</th><th className={th}>Impressions</th>
              <th className={th}>Clicks</th><th className={th}>CTR</th><th className={th}>Status</th>
            </tr></thead>
            <tbody>
              {data.claims.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(30,42,58,0.6)' }}>
                  <td className={`${td} font-medium text-white`}>{c.toolName}</td>
                  <td className={`${td} text-slate-400`}>{c.email ?? '—'}</td>
                  <td className={`${td} text-xs text-slate-500`}>{new Date(c.startsAt).toLocaleString()}</td>
                  <td className={`${td} text-slate-400`}>{c.impressions.toLocaleString()}</td>
                  <td className={`${td} text-slate-400`}>{c.clicks.toLocaleString()}</td>
                  <td className={`${td} text-slate-400`}>{ctr(c.impressions, c.clicks)}</td>
                  <td className={td}>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ color: STATUS[c.status].color, background: STATUS[c.status].bg }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
