'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface Props {
  toolId: string
  toolSlug: string
  toolName: string
}

const MIN_AWAY_MS = 8000 // must have been away at least this long

/**
 * Honest growth loop: when a visitor clicks out to a tool's website and
 * later returns to this tab, ask them to rate the tool with one tap.
 * Shows at most once per tool per browser; never fakes anything.
 */
export default function ReturnRatingPrompt({ toolId, toolSlug, toolName }: Props) {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [saved, setSaved] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)

  const outKey = `lmai_out_${toolSlug}`
  const doneKey = `lmai_rate_prompt_done_${toolSlug}`
  const pendingKey = 'lmai_pending_rating'

  const submitRating = useCallback(async (value: number) => {
    try {
      const res = await fetch('/api/tools/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, rating: value }),
      })
      if (res.ok) {
        setSaved(true)
        try { localStorage.setItem(doneKey, '1') } catch {}
        setTimeout(() => setVisible(false), 2500)
        return true
      }
    } catch { /* ignore */ }
    return false
  }, [toolId, doneKey])

  // Record when the visitor leaves via an outbound link
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.('a')
      if (!a?.href?.includes('ref=listmyai')) return
      try { sessionStorage.setItem(outKey, String(Date.now())) } catch {}
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [outKey])

  // When they come back to the tab, offer the one-tap rating
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      try {
        if (localStorage.getItem(doneKey)) return
        const left = Number(sessionStorage.getItem(outKey) ?? 0)
        if (!left || Date.now() - left < MIN_AWAY_MS) return
        sessionStorage.removeItem(outKey)
        setVisible(true)
      } catch { /* storage unavailable */ }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [outKey, doneKey])

  // After login: auto-save a rating the visitor picked before logging in
  useEffect(() => {
    if (!user) return
    try {
      const raw = localStorage.getItem(pendingKey)
      if (!raw) return
      const pending = JSON.parse(raw) as { slug: string; rating: number }
      if (pending.slug !== toolSlug) return
      localStorage.removeItem(pendingKey)
      setRating(pending.rating)
      setVisible(true)
      submitRating(pending.rating)
    } catch { /* ignore */ }
  }, [user, toolSlug, submitRating])

  async function handleStar(value: number) {
    setRating(value)
    if (user) {
      await submitRating(value)
    } else {
      try { localStorage.setItem(pendingKey, JSON.stringify({ slug: toolSlug, rating: value })) } catch {}
      setNeedsLogin(true)
    }
  }

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(doneKey, '1') } catch {}
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-80">
      <div className="rounded-2xl border p-4 shadow-2xl"
        style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-white">
            {saved ? 'Thanks for rating! ⭐' : `Was ${toolName} helpful?`}
          </p>
          <button onClick={dismiss} aria-label="Dismiss"
            className="rounded p-1 text-slate-500 transition hover:bg-white/10 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {saved ? (
          <p className="mt-1 text-xs text-slate-400">
            Your {rating}-star rating helps others discover great tools.
          </p>
        ) : needsLogin ? (
          <div className="mt-2">
            <p className="text-xs text-slate-400">
              You picked <span className="font-bold text-white">{rating} star{rating !== 1 ? 's' : ''}</span> — log in
              and it saves automatically.
            </p>
            <Link href={`/login?redirect=/tools/${toolSlug}`}
              className="mt-2.5 inline-flex rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Log in to save
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-slate-500">Tap a star — takes one second.</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => handleStar(s)}
                  aria-label={`Rate ${s} star${s !== 1 ? 's' : ''}`}
                  className="p-0.5 transition-transform hover:scale-110">
                  <Star className={`h-7 w-7 ${s <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
