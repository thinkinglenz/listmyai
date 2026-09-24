'use client'

// Buying promotion for a listing you own. Prices and contents come from the
// package catalogue, so this panel and the pricing page can never disagree.

import { useState } from 'react'
import { Rocket, Check, Loader2 } from 'lucide-react'
import { PACKAGES, PACKAGE_ORDER, offerLabel, type PackageId } from '@/lib/billing/packages'

interface Listing { id: string; name: string }

export default function PromotePanel({ listings }: { listings: Listing[] }) {
  const [toolId, setToolId] = useState(listings[0]?.id ?? '')
  const [busy, setBusy] = useState<PackageId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function buy(packageId: PackageId) {
    if (!toolId) { setError('Add or claim a listing first'); return }
    setBusy(packageId); setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, packageId }),
      })
      const data = await res.json()
      // A claimed package is delivered immediately, so say so here rather than
      // bouncing the page — there is nothing to pay and nowhere to go.
      if (data.free) {
        setDone(data.delivered
          ? `${PACKAGES[packageId].name} is live on your listing.`
          : `${PACKAGES[packageId].name} claimed. ${data.note ?? 'Delivery is still finishing.'}`)
      } else if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Could not start your promotion')
      }
    } catch (e) {
      setError(String(e))
    }
    setBusy(null)
  }

  if (listings.length === 0) return null

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4" style={{ color: '#e94560' }} />
          <h2 className="font-bold text-white">Promote your listing</h2>
        </div>
        {listings.length > 1 && (
          <select value={toolId} onChange={e => setToolId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm text-white"
            style={{ borderColor: '#1e2a3a', background: '#0f172a' }}>
            {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        We sell placement and promotion, not traffic. Everything below is delivered automatically
        and reported back to you with links.
      </p>

      {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
      {done && <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{done}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PACKAGE_ORDER.map(id => {
          const p = PACKAGES[id]
          return (
            <div key={id} className="flex flex-col rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-bold text-white">{p.name}</p>
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-lg font-black" style={{ color: '#e94560' }}>{offerLabel(p).now}</span>
                {offerLabel(p).was && (
                  <span className="text-xs font-semibold text-slate-500 line-through">{offerLabel(p).was}</span>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-400">{p.summary}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {p.includes.map(inc => (
                  <li key={inc} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-400">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-500" />{inc}
                  </li>
                ))}
              </ul>
              <button onClick={() => buy(id)} disabled={busy !== null}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#e94560' }}>
                {busy === id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {offerLabel(p).cta}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
