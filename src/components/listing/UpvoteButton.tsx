'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, Info } from 'lucide-react'
import { formatCount } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

interface Props {
  toolId: string
  toolName: string
  initialCount: number
}

export default function UpvoteButton({ toolId, toolName, initialCount }: Props) {
  const { user } = useAuth()
  const [count, setCount] = useState(initialCount)
  const [upvoted, setUpvoted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showLoginNudge, setShowLoginNudge] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!user) {
      // Not logged in: show login nudge
      setShowLoginNudge(s => !s)
      return
    }

    // Logged in: toggle upvote
    setLoading(true)
    try {
      const res = await fetch('/api/tools/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      })
      const data = await res.json()
      if (res.ok) {
        setUpvoted(data.upvoted)
        setCount(c => data.upvoted ? c + 1 : Math.max(0, c - 1))
      }
    } catch {
      // Silently fail
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button onClick={handleClick} disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition disabled:opacity-50"
          style={{
            borderColor: upvoted ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
            background: upvoted ? 'rgba(233,69,96,0.1)' : 'rgba(255,255,255,0.03)',
            color: upvoted ? '#e94560' : '#94a3b8',
          }}>
          <ThumbsUp className={`h-4 w-4 ${upvoted ? 'fill-current' : ''}`} />
          {upvoted ? 'Upvoted' : 'Upvote'} ({formatCount(count)})
        </button>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:text-slate-400"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(s => !s)}>
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* What is an upvote? tooltip */}
      {showTooltip && (
        <div className="absolute left-0 top-12 z-20 w-64 rounded-xl border p-3 text-xs text-slate-400 shadow-xl"
          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <p className="font-semibold text-white mb-1">What is an upvote?</p>
          <p>An upvote is your way of saying &ldquo;I recommend this tool.&rdquo; It helps others discover the best AI tools in the community. Each account can upvote a tool once.</p>
        </div>
      )}

      {/* Login nudge — only shown when not authenticated */}
      {showLoginNudge && !user && (
        <div className="absolute left-0 top-12 z-20 w-72 rounded-xl border p-4 shadow-xl"
          style={{ borderColor: 'rgba(233,69,96,0.2)', background: '#161b27' }}>
          <p className="text-sm font-semibold text-white mb-1">Upvote {toolName}</p>
          <p className="text-xs text-slate-400 mb-3">
            Upvotes tell the community this tool is worth using. You need a free ListmyAI account to upvote — one vote per tool.
          </p>
          <div className="flex gap-2">
            <Link href="/register"
              className="flex-1 rounded-lg py-2 text-center text-xs font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Sign up free
            </Link>
            <Link href="/login"
              className="flex-1 rounded-lg border py-2 text-center text-xs font-medium text-slate-300 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
