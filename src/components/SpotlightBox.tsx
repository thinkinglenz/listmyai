'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Clock } from 'lucide-react'

interface Props {
  toolName: string
  toolSlug: string
  tagline: string
  categoryName: string | null
  logoUrl: string | null
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
  toolName, toolSlug, tagline, categoryName, logoUrl, bidId, isPaid, expiresAt, minimumNextBidCents,
}: Props) {
  // A listing's logo is an external URL we do not control, so a failure has to
  // fall back to something rather than leaving a broken image in the hero.
  const [imgOk, setImgOk] = useState(Boolean(logoUrl))
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
    <div className="relative overflow-hidden rounded-3xl border p-6"
      style={{
        borderColor: 'rgba(233,69,96,0.28)',
        background: 'linear-gradient(150deg, rgba(233,69,96,0.10) 0%, rgba(15,23,42,0.6) 55%, rgba(15,23,42,0.35) 100%)',
        boxShadow: '0 20px 60px -20px rgba(233,69,96,0.25)',
      }}>
      {/* Soft accent bloom behind the card */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl"
        style={{ background: 'rgba(233,69,96,0.18)' }} />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: '#e94560' }}>
            <Sparkles className="h-3.5 w-3.5" />
            {isPaid ? 'Spotlight' : 'Newly added'}
          </span>
          {remaining && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
              <Clock className="h-3 w-3" /> {remaining}
            </span>
          )}
        </div>

        <Link href={`/tools/${toolSlug}`} onClick={trackClick} className="group flex gap-4">
          {/* Listing image, with a branded monogram when there is none */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: imgOk ? '#0b1220' : '#e94560', border: '1px solid rgba(255,255,255,0.08)' }}>
            {imgOk && logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={toolName} className="h-full w-full object-cover"
                onError={() => setImgOk(false)} loading="lazy" />
            ) : (
              <span className="text-2xl font-black text-white">{toolName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-black text-white transition-colors group-hover:text-red-400">
              {toolName}
            </h3>
            {tagline && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-400">{tagline}</p>}
            {categoryName && (
              <span className="mt-2.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                {categoryName}
              </span>
            )}
          </div>
        </Link>

        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="text-[11px] leading-snug text-slate-500">
            Your tool here for<br className="hidden sm:block" />
            <strong className="text-slate-300">${(minimumNextBidCents / 100).toFixed(2)}/day</strong>
          </span>
          <Link href="/dashboard#spotlight"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.35)' }}>
            Take this spot <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
