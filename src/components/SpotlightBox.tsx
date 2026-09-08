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
  coverUrl: string | null
  website: string | null
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

/**
 * Hero image, best first:
 *   1. an admin-chosen cover
 *   2. a live screenshot of the tool's own site
 *   3. the generated brand card, which always renders
 * Steps 1 and 2 can both fail — an external URL can rot, and the screenshot
 * route returns 404 for sites that block bots — so the chain is walked at
 * runtime rather than picked once on the server.
 */
function imageChain(coverUrl: string | null, website: string | null, slug: string): string[] {
  const chain: string[] = []
  if (coverUrl) chain.push(coverUrl)
  if (website) chain.push(`/api/tools/screenshot?url=${encodeURIComponent(website)}`)
  chain.push(`/api/tool-social/${slug}`)
  return chain
}

export default function SpotlightBox({
  toolName, toolSlug, tagline, categoryName, logoUrl, coverUrl, website,
  bidId, isPaid, expiresAt, minimumNextBidCents,
}: Props) {
  const [remaining, setRemaining] = useState<string | null>(expiresAt ? timeLeft(expiresAt) : null)
  const [logoOk, setLogoOk] = useState(Boolean(logoUrl))

  const sources = imageChain(coverUrl, website, toolSlug)
  const [srcIndex, setSrcIndex] = useState(0)

  useEffect(() => {
    if (!bidId) return
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
    <div className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: 'rgba(233,69,96,0.28)',
        background: 'linear-gradient(160deg, rgba(233,69,96,0.10) 0%, rgba(15,23,42,0.75) 45%, rgba(13,17,23,0.9) 100%)',
        boxShadow: '0 24px 70px -24px rgba(233,69,96,0.35)',
      }}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: 'rgba(233,69,96,0.20)' }} />

      {/* Label */}
      <div className="relative flex items-center justify-between gap-3 px-5 pt-5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" />
          {isPaid ? 'Spotlight' : 'Newly added'}
        </span>
        {remaining && (
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
            <Clock className="h-3 w-3" /> {remaining}
          </span>
        )}
      </div>

      <Link href={`/tools/${toolSlug}`} onClick={trackClick} className="group relative block">
        {/* Screenshot of the listing */}
        <div className="mx-5 mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0b1220' }}>
          <div className="aspect-[16/10] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sources[srcIndex]}
              alt={`${toolName} website`}
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
              // Step down the chain rather than showing a broken image.
              onError={() => setSrcIndex(i => Math.min(i + 1, sources.length - 1))}
              loading="eager"
            />
          </div>
        </div>

        {/* Identity */}
        <div className="flex items-start gap-3.5 px-5 pt-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: logoOk ? '#0b1220' : '#e94560', border: '1px solid rgba(255,255,255,0.1)' }}>
            {logoOk && logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" onError={() => setLogoOk(false)} />
            ) : (
              <span className="text-xl font-black text-white">{toolName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-black text-white transition-colors group-hover:text-red-400">{toolName}</h3>
            {tagline && <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-slate-400">{tagline}</p>}
          </div>
        </div>
      </Link>

      {categoryName && (
        <div className="px-5 pt-3">
          <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
            {categoryName}
          </span>
        </div>
      )}

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t px-5 py-4"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <span className="text-[11px] leading-snug text-slate-500">
          Your tool here for<br />
          <strong className="text-slate-300">${(minimumNextBidCents / 100).toFixed(2)}/day</strong>
        </span>
        <Link href="/dashboard#spotlight"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          style={{ background: '#e94560', boxShadow: '0 0 22px rgba(233,69,96,0.4)' }}>
          Take this spot <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
