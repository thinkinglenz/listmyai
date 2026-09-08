'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Loader2, TrendingUp, Eye, MousePointerClick, Clock } from 'lucide-react'

interface BidRow {
  id: string; toolName: string; toolSlug: string
  amountCents: number; impressions: number; clicks: number
  startsAt: string; expiresAt: string; outbidAt: string | null
  status: 'live' | 'outbid' | 'finished'
}
interface Stats {
  bids: BidRow[]
  totalSpendCents: number; totalImpressions: number; totalClicks: number
  shareOfVoice: number
  spendByDay: { date: string; cents: number; impressions: number }[]
}
interface Listing { id: string; name: string }

const money = (c: number) => `$${(c / 100).toFixed(2)}`

const STATUS_STYLE: Record<BidRow['status'], { label: string; color: string; bg: string }> = {
  live:     { label: 'Live',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  outbid:   { label: 'Outbid',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  finished: { label: 'Finished', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

export default function SpotlightPanel({ listings }: { listings: Listing[] }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [minNext, setMinNext] = useState(100)
  const [holder, setHolder] = useState<{ name: string; isPaid: boolean } | null>(null)
  const [toolId, setToolId] = useState(listings[0]?.id ?? '')
  const [amount, setAmount] = useState('1.00')
  const [bidding, setBidding] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      fetch('/api/spotlight/my-bids').then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/spotlight').then(r => r.json()).catch(() => null),
    ])
    if (s) setStats(s)
    if (c) {
      setMinNext(c.minimumNextBidCents ?? 100)
      setHolder(c.current ? { name: c.current.name, isPaid: c.current.isPaid } : null)
      setAmount(((c.minimumNextBidCents ?? 100) / 100).toFixed(2))
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function placeBid() {
    setBidding(true); setMsg(null)
    try {
      const cents = Math.round(parseFloat(amount) * 100)
      const res = await fetch('/api/spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, amountCents: cents }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Bid failed')
      setMsg({ kind: 'ok', text: 'You hold the spotlight for 24 hours. No payment was taken — this is a mock transaction.' })
      await load()
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Bid failed' })
    } finally {
      setBidding(false)
    }
  }

  const card = 'rounded-xl border p-4'
  const cardStyle = { borderColor: '#1e2a3a', background: '#161b27' }

  return (
    <section id="spotlight" className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: '#e94560' }} />
        <h2 className="text-xl font-black text-white">Homepage spotlight</h2>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.04)' }}>
        <p className="mb-1 text-sm text-slate-300">
          {holder?.isPaid
            ? <>Currently held by <strong className="text-white">{holder.name}</strong>. Bid above {money(minNext - 100)} to take it.</>
            : <>Nobody holds the spot right now. Take it for {money(minNext)}.</>}
        </p>
        <p className="mb-4 text-xs text-slate-500">
          One listing at a time, on the homepage, for 24 hours. Anyone can outbid you.
        </p>

        {listings.length === 0 ? (
          <p className="text-sm text-slate-500">You need a live listing before you can bid.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">Listing</label>
              <select value={toolId} onChange={e => setToolId(e.target.value)}
                className="w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                style={{ borderColor: '#1e2a3a' }}>
                {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">Your bid</label>
              <input type="number" step="0.50" min={(minNext / 100).toFixed(2)} value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                style={{ borderColor: '#1e2a3a' }} />
            </div>
            <button onClick={placeBid} disabled={bidding || !toolId}
              className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#e94560' }}>
              {bidding && <Loader2 className="h-4 w-4 animate-spin" />}
              Take the spot
            </button>
          </div>
        )}

        {msg && <p className="mt-3 text-xs" style={{ color: msg.kind === 'ok' ? '#6ee7b7' : '#f87171' }}>{msg.text}</p>}
        <p className="mt-3 text-[11px] text-slate-600">
          No payment is taken and no card details are collected — billing isn&apos;t connected yet.
        </p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={card} style={cardStyle}>
              <p className="text-[11px] uppercase text-slate-500">Total bid</p>
              <p className="mt-1 text-xl font-black text-white">{money(stats.totalSpendCents)}</p>
            </div>
            <div className={card} style={cardStyle}>
              <p className="flex items-center gap-1 text-[11px] uppercase text-slate-500"><Eye className="h-3 w-3" /> Impressions</p>
              <p className="mt-1 text-xl font-black text-white">{stats.totalImpressions.toLocaleString()}</p>
            </div>
            <div className={card} style={cardStyle}>
              <p className="flex items-center gap-1 text-[11px] uppercase text-slate-500"><MousePointerClick className="h-3 w-3" /> Clicks</p>
              <p className="mt-1 text-xl font-black text-white">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <div className={card} style={cardStyle}>
              <p className="flex items-center gap-1 text-[11px] uppercase text-slate-500"><TrendingUp className="h-3 w-3" /> Share of voice</p>
              <p className="mt-1 text-xl font-black" style={{ color: '#e94560' }}>{stats.shareOfVoice.toFixed(1)}%</p>
            </div>
          </div>

          {stats.bids.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-500" style={{ borderBottom: '1px solid #1e2a3a' }}>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">Bid</th>
                    <th className="px-4 py-3">Impressions</th>
                    <th className="px-4 py-3">Clicks</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bids.map(b => {
                    const st = STATUS_STYLE[b.status]
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(30,42,58,0.6)' }}>
                        <td className="px-4 py-3 font-medium text-white">{b.toolName}</td>
                        <td className="px-4 py-3 text-slate-300">{money(b.amountCents)}</td>
                        <td className="px-4 py-3 text-slate-400">{b.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-400">{b.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{b.startsAt.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {stats.spendByDay.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                <Clock className="h-3.5 w-3.5" /> By day
              </p>
              <div className="space-y-2">
                {stats.spendByDay.map(d => (
                  <div key={d.date} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{d.date}</span>
                    <span className="text-slate-300">{money(d.cents)} · {d.impressions.toLocaleString()} impressions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
