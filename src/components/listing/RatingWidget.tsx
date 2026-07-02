'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, LogIn, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface Props {
  toolId: string
  toolName: string
  ratingAvg: number
  ratingCount: number
}

function StarRow({ value, interactive, onSelect }: { value: number; interactive?: boolean; onSelect?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s}
          className={`h-5 w-5 transition-colors ${interactive ? 'cursor-pointer' : ''} ${s <= active ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onSelect?.(s)}
        />
      ))}
    </div>
  )
}

export default function RatingWidget({ toolId, toolName, ratingAvg, ratingCount }: Props) {
  const { user } = useAuth()
  const [userRating, setUserRating] = useState(0)
  const [showLoginNudge, setShowLoginNudge] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleStarClick(v: number) {
    setUserRating(v)
    setSaveError('')

    if (!user) {
      setShowLoginNudge(true)
      return
    }

    // Logged in: save rating
    setSaving(true)
    try {
      const res = await fetch('/api/tools/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, rating: v }),
      })
      if (res.ok) {
        setSaved(true)
        setShowLoginNudge(false)
      } else {
        const body = await res.json().catch(() => null)
        setSaveError(body?.error ?? 'Could not save your rating. Please try again.')
      }
    } catch {
      setSaveError('Could not save your rating. Please check your connection and try again.')
    }
    setSaving(false)
  }

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <h2 className="mb-5 text-lg font-bold text-white">Rate {toolName}</h2>

      {/* Rate this tool */}
      <div className="mb-4 rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
        <p className="mb-2 text-sm font-medium text-slate-300">How would you rate {toolName}?</p>
        <StarRow value={userRating} interactive onSelect={handleStarClick} />

        {/* Saved confirmation */}
        {saved && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border p-3" style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)' }}>
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
            <p className="text-xs text-slate-300">Your <strong className="text-white">{userRating}-star</strong> rating has been saved. Thank you!</p>
          </div>
        )}

        {/* Saving state */}
        {saving && (
          <p className="mt-2 text-xs text-slate-500">Saving your rating...</p>
        )}

        {/* Save error */}
        {saveError && !saving && (
          <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {saveError}
          </p>
        )}

        {/* Login nudge — only when not logged in */}
        {showLoginNudge && !user && !saved && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.05)' }}>
            <LogIn className="h-4 w-4 flex-shrink-0" style={{ color: '#e94560' }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-300">You selected <strong className="text-white">{userRating} star{userRating !== 1 ? 's' : ''}</strong>. Log in to save your rating.</p>
            </div>
            <Link href="/login" className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Log in
            </Link>
          </div>
        )}

        {/* Hint text when idle */}
        {!showLoginNudge && !saved && !saving && userRating === 0 && (
          <p className="mt-1.5 text-xs text-slate-600">
            {user ? 'Tap a star to rate' : 'Tap a star to rate · Requires a free account'}
          </p>
        )}
      </div>

      {ratingCount > 0 ? (
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="text-2xl font-black text-white">{ratingAvg.toFixed(1)}</span>
          <StarRow value={Math.round(ratingAvg)} />
          <span className="text-xs text-slate-500">({ratingCount.toLocaleString()} ratings)</span>
        </div>
      ) : (
        <p className="text-sm text-slate-600">No ratings yet. Be the first to rate {toolName}!</p>
      )}

      {!user && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: '#1e2a3a' }}>
          <Link href="/register" className="text-sm hover:underline" style={{ color: '#e94560' }}>
            + Write a review — requires free account
          </Link>
        </div>
      )}
    </div>
  )
}
