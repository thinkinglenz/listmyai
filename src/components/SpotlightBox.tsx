'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Clock } from 'lucide-react'

interface Props {
  toolName: string
  toolSlug: string
  tagline: string
  categoryName: string | null
  bidId: string | null
  isPaid: boolean
  expiresAt: string | null
  minimumNextBidCents: number
}

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'expiring'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function SpotlightBox({
  toolName, toolSlug, tagline, categoryName, bidId, isPaid, expiresAt, minimumNextBidCents,
}: Props) {
  const [remaining, setRemaining] = useState<string | null>(expiresAt ? timeLeft(expiresAt) : null)

  useEffect(() => {
    if (!bidId) return
    // Once per browser session: a refresh is the same person, not a new view.
    const key = `lmai_spotlight_seen_${bidId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch { /* private mode — count it rather than lose it */ }

    fetch('/api/spotlight/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bidId, kind: 'impression' }),
    }).catch(() => {})
  }, [bidId])

  useEffect(() => {
    if (!expiresAt) return
    const t = setInterval(() => setRemaining(timeLeft(expiresAt)), 60_000)
    return () => clearInterval(t)
  }, [expiresAt])

  function trackClick() {
    if (!bidId) return
    fetch('/api/spotlight/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bidId, kind: 'click' }),
      keepalive: true, // the navigation would otherwise cancel it
    }).catch(() => {})
  }

  return (
    <div className="rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'linear-gradient(135deg, rgba(233,69,96,0.08), rgba(233,69,96,0.02))' }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" />
          {isPaid ? 'Spotlight' : 'Newly added'}
        </span>
        {remaining && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" /> {remaining}
          </span>
        )}
      </div>

      <Link href={`/tools/${toolSlug}`} onClick={trackClick} className="group block">
        <h3 className="text-lg font-black text-white transition-colors group-hover:text-red-400">{toolName}</h3>
        {tagline && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{tagline}</p>}
        {categoryName && (
          <span className="mt-2.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
            {categoryName}
          </span>
        )}
      </Link>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-[11px] text-slate-500">
          Take this spot for ${(minimumNextBidCents / 100).toFixed(2)}/day
        </span>
        <Link href="/dashboard#spotlight"
          className="flex items-center gap-1 text-xs font-bold transition hover:opacity-80"
          style={{ color: '#e94560' }}>
          Bid <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
