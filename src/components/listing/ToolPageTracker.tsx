'use client'

import { useEffect } from 'react'

/**
 * Invisible tracker mounted on each tool page.
 * - Records one "view" per tool per browser session.
 * - Records a "click" whenever any outbound link (tagged with
 *   ?ref=listmyai by the page) is clicked.
 */
export default function ToolPageTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // ── View — dedupe per session ──
    const key = `lmai_viewed_${slug}`
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        fetch('/api/tools/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, event: 'view' }),
          keepalive: true,
        }).catch(() => {})
      }
    } catch { /* sessionStorage unavailable */ }

    // ── Clicks on outbound links (they all carry ref=listmyai) ──
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.('a')
      if (!a?.href?.includes('ref=listmyai')) return
      const body = JSON.stringify({ slug, event: 'click' })
      try {
        navigator.sendBeacon?.('/api/tools/track', new Blob([body], { type: 'application/json' }))
          || fetch('/api/tools/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      } catch { /* ignore */ }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [slug])

  return null
}
