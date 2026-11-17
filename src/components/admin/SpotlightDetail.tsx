'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

interface Claim {
  id: string; toolName: string; toolSlug: string; email: string | null
  amountCents: number; impressions: number; clicks: number; startsAt: string
  status: 'live' | 'taken over' | 'finished'
}
interface Bidder { email: string; claims: number; impressions: number; clicks: number; cents: number }
interface PageInfo { page: number; perPage: number; totalPages: number; total: number }
interface Payload {
  claims: Claim[]; bidders: Bidder[]
  claimsPage?: PageInfo; biddersPage?: PageInfo
  unavailable?: boolean; rollupTruncated?: boolean
}

const money = (c: number) => `$${(c / 100).toFixed(2)}`

const STATUS: Record<Claim['status'], { color: string; bg: string }> = {
  'live':       { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)' },
  'taken over': { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  'finished':   { color: '#94a3b8', bg: 'rgba(100,116,139,0.12)' },
}

/**
 * Prev/next with the position spelled out.
 *
 * Deliberately not disabled while a page is loading: a control that goes dead
 * on every click reads as broken. It shows a spinner in place of the counts
 * instead, so the position stays legible and the buttons stay pressable.
 */
function Pager({ info, busy, onPage }: { info?: PageInfo; busy: boolean; onPage: (p: number) => void }) {
  if (!info || info.totalPages <= 1) return null
  const btn = 'flex h-7 w-7 items-center justify-center rounded-lg border transition disabled:opacity-30'
  const first = (info.page - 1) * info.perPage + 1
  const last = Math.min(info.page * info.perPage, info.total)

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: '1px solid #1e2a3a' }}>
      <span className="text-[11px] text-slate-500">
        {busy ? <Loader2 className="inline h-3 w-3 animate-spin" /> : <>{first}&ndash;{last} of {info.total.toLocaleString()}</>}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous page" className={btn}
          style={{ borderColor: '#1e2a3a', color: '#94a3b8' }}
          disabled={info.page <= 1}
          onClick={() => onPage(info.page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] text-slate-500">{info.page} / {info.totalPages}</span>
        <button type="button" aria-label="Next page" className={btn}
          style={{ borderColor: '#1e2a3a', color: '#94a3b8' }}
          disabled={info.page >= info.totalPages}
          onClick={() => onPage(info.page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function SpotlightDetail() {
  const [data, setData] = useState<Payload | null>(null)
  const [failed, setFailed] = useState(false)
  const [claimsPage, setClaimsPage] = useState(1)
  const [biddersPage, setBiddersPage] = useState(1)
  // Whether anything has ever arrived. A ref, not state: a failed fetch is
  // only fatal when there is nothing on screen to keep, and reading that from
  // a closure would give a stale answer.
  const loadedOnce = useRef(false)

  const load = useCallback((cp: number, bp: number) => {
    fetch(`/api/admin/stats/spotlight-detail?claimsPage=${cp}&biddersPage=${bp}&perPage=25`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: Payload) => { loadedOnce.current = true; setData(d) })
      // Keep whatever is already on screen if a page fetch fails, rather than
      // blanking a table the admin was reading.
      .catch(() => { if (!loadedOnce.current) setFailed(true) })
  }, [])

  useEffect(() => { load(claimsPage, biddersPage) }, [claimsPage, biddersPage, load])

  // Derived, not stored. Setting a `busy` flag synchronously inside the effect
  // is a setState-during-effect, and this says something truer anyway: the
  // table is stale exactly while what is rendered is not the page that was
  // asked for.
  const busy = data !== null && (
    (data.claimsPage?.page ?? claimsPage) !== claimsPage ||
    (data.biddersPage?.page ?? biddersPage) !== biddersPage
  )

  if (failed) return null
  if (!data) {
    return <div className="flex items-center gap-2 rounded-xl border px-4 py-5 text-xs text-slate-600" style={{ borderColor: '#1e2a3a' }}>
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading spotlight detail&hellip;
    </div>
  }
  if (data.unavailable || (data.claims.length === 0 && claimsPage === 1)) {
    return <p className="rounded-xl border px-4 py-3 text-xs text-slate-500" style={{ borderColor: '#1e2a3a' }}>
      Nobody has taken the spotlight yet.
    </p>
  }

  const ctr = (imp: number, clk: number) => imp > 0 ? `${((clk / imp) * 100).toFixed(1)}%` : '—'
  const th = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase text-slate-500'
  const td = 'px-4 py-2.5'
  const shell = { borderColor: '#1e2a3a', background: '#161b27' }

  return (
    <div className="space-y-5">
      {data.rollupTruncated && (
        <p className="flex items-start gap-2 rounded-xl px-4 py-2.5 text-xs"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          There are more bids than the customer totals below count. Treat those figures as a floor, not a total.
        </p>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3.5 w-3.5" /> Who has taken the spot
        </p>
        <div className="rounded-xl border" style={shell}>
          <div className="overflow-x-auto">
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
          <Pager info={data.biddersPage} busy={busy} onPage={setBiddersPage} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Every placement</p>
        <div className="rounded-xl border" style={shell}>
          <div className="overflow-x-auto">
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
          <Pager info={data.claimsPage} busy={busy} onPage={setClaimsPage} />
        </div>
      </div>
    </div>
  )
}
