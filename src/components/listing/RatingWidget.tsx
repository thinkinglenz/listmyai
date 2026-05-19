'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, LogIn } from 'lucide-react'

interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  text: string
  date: string
}

interface Props {
  toolName: string
  ratingAvg: number
  ratingCount: number
  reviews?: Review[]
}

const SAMPLE_REVIEWS: Review[] = [
  { id:'r1', author:'Sarah M.', avatar:'S', rating:5, text:'Absolutely transformed my workflow. The code suggestions are scarily accurate and save me hours every week.', date:'Mar 2026' },
  { id:'r2', author:'James K.', avatar:'J', rating:4, text:'Great tool overall. Occasionally gets confused with complex multi-file contexts but the chat feature makes up for it.', date:'Feb 2026' },
  { id:'r3', author:'Priya R.', avatar:'P', rating:5, text:'Best AI coding assistant I\'ve tried. The test writing feature alone is worth the subscription.', date:'Jan 2026' },
]

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

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="w-3 text-right">{label}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#f59e0b' }} />
      </div>
      <span className="w-5 text-right">{count}</span>
    </div>
  )
}

export default function RatingWidget({ toolName, ratingAvg, ratingCount, reviews = SAMPLE_REVIEWS }: Props) {
  const [userRating, setUserRating] = useState(0)
  const [showLoginNudge, setShowLoginNudge] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Fake distribution for demo
  const dist = [
    { label: '5', count: Math.round(ratingCount * 0.55) },
    { label: '4', count: Math.round(ratingCount * 0.25) },
    { label: '3', count: Math.round(ratingCount * 0.11) },
    { label: '2', count: Math.round(ratingCount * 0.06) },
    { label: '1', count: Math.round(ratingCount * 0.03) },
  ]

  function handleStarClick(v: number) {
    setUserRating(v)
    setShowLoginNudge(true)
  }

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <h2 className="mb-5 text-lg font-bold text-white">Ratings & Reviews</h2>

      {/* Summary */}
      <div className="flex gap-6 mb-6">
        <div className="text-center">
          <p className="text-5xl font-black text-white">{ratingAvg.toFixed(1)}</p>
          <StarRow value={Math.round(ratingAvg)} />
          <p className="mt-1 text-xs text-slate-500">{ratingCount.toLocaleString()} ratings</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(d => <RatingBar key={d.label} label={d.label} count={d.count} total={ratingCount} />)}
        </div>
      </div>

      {/* Rate this tool */}
      <div className="mb-6 rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
        <p className="mb-2 text-sm font-medium text-slate-300">Rate {toolName}</p>
        {submitted ? (
          <p className="text-sm text-emerald-400">✓ Thanks for your rating!</p>
        ) : (
          <>
            <StarRow value={userRating} interactive onSelect={handleStarClick} />
            {showLoginNudge && (
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
            {!showLoginNudge && (
              <p className="mt-1.5 text-xs text-slate-600">Tap a star to rate · Requires a free account</p>
            )}
          </>
        )}
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: '#e94560' }}>
              {r.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{r.author}</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />)}
                </div>
                <span className="text-xs text-slate-600">{r.date}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{r.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4" style={{ borderColor: '#1e2a3a' }}>
        <Link href="/register" className="text-sm hover:underline" style={{ color: '#e94560' }}>
          + Write a review — requires free account
        </Link>
      </div>
    </div>
  )
}
