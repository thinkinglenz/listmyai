'use client'

import { useEffect } from 'react'

/**
 * Invisible tracker mounted on each tool page.
 * - Records a "view" impression on every page load.
 * - Records a "click" whenever any outbound link (tagged with
 *   ?ref=listmyai by the page) is clicked.
 */
export default function ToolPageTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // ── View — impression-based: every page load counts ──
    fetch('/api/tools/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, event: 'view' }),
      keepalive: true,
    }).catch(() => {})

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
