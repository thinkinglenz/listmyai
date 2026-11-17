'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Megaphone, X, ArrowRight } from 'lucide-react'

const DISMISS_KEY = 'lmai_ads_top_bar_v1'

export default function AdvertiseTopBar() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') setHidden(true)
    } catch {}
  }, [])

  function dismiss() {
    setHidden(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  if (hidden) return null

  return (
    // Was a pink-to-orange gradient, which introduced a second accent colour
    // and out-shouted the headline directly beneath it. Now a quiet bar in the
    // one accent. It stays rather than being removed: /pricing left the navbar
    // in the same pass, and this is its remaining link above the fold.
    <div className="relative w-full border-b"
      style={{
        background: '#120d14',
        borderColor: 'rgba(233,69,96,0.22)',
      }}>
      <Link href="/pricing"
        className="group flex items-center justify-center gap-2 px-12 py-2 text-center text-xs font-semibold transition hover:text-white sm:text-sm"
        style={{ color: '#e9a0ae' }}>
        <Megaphone className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">
          Promote your AI tool — launch packages, sponsored reviews & homepage spotlight
        </span>
        <span className="inline sm:hidden">
          Promote your AI tool on ListmyAI
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:bg-white/10 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
