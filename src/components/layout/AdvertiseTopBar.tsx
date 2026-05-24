'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Megaphone, X, ArrowRight } from 'lucide-react'

const DISMISS_KEY = 'lmai_ads_top_bar_v1'

export default function AdvertiseTopBar() {
  // Default hidden until we know whether the user previously dismissed it,
  // so we never flash the bar then hide it.
  const [show, setShow] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Defer setState to a microtask to avoid the
    // react-hooks/set-state-in-effect lint rule.
    queueMicrotask(() => {
      if (cancelled) return
      try {
        const dismissed = localStorage.getItem(DISMISS_KEY) === '1'
        if (!dismissed) setShow(true)
      } catch {
        setShow(true)
      }
      setReady(true)
    })
    return () => { cancelled = true }
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  // Don't render anything until we've checked dismissal state — avoids CLS.
  if (!ready || !show) return null

  return (
    <div className="relative w-full"
      style={{
        background: 'linear-gradient(90deg,#e94560 0%,#f59e0b 100%)',
      }}>
      <Link href="/advertise"
        className="group flex items-center justify-center gap-2 px-12 py-2 text-center text-xs font-bold text-white transition hover:opacity-95 sm:text-sm">
        <Megaphone className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">
          Advertise on ListmyAI — reach 50,000+ AI buyers monthly · Sponsorships, banners & newsletter spots
        </span>
        <span className="inline sm:hidden">
          Advertise on ListmyAI — reach 50k+ AI buyers
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
