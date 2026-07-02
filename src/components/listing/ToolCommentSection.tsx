'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, User } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface Comment {
  id: string
  author_name: string
  body: string
  created_at: string
}

interface Props {
  toolId: string
  toolSlug: string
  toolName: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ToolCommentSection({ toolId, toolSlug, toolName }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/comments?tool_id=${toolId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments ?? [])
      }
    } catch { /* leave empty */ }
    setLoading(false)
  }, [toolId])

  useEffect(() => { loadComments() }, [loadComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !user) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/tools/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: toolId, body: body.trim() }),
      })
      if (res.ok) {
        setSubmitted(true)
        setBody('')
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to submit comment. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="rounded-2xl border p-4 sm:p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-white">
        <MessageSquare className="h-5 w-5" style={{ color: '#e94560' }} />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      <p className="mb-5 text-sm text-slate-400">
        Share your experience with {toolName} — comments are moderated before publishing.
      </p>

      {/* Comment list */}
      {loading ? (
        <div className="mb-5 space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              <div className="mb-2 h-3 w-24 rounded bg-slate-800" />
              <div className="h-4 w-full rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="mb-5 rounded-xl border py-6 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
          <p className="text-sm text-slate-500">No comments yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: '#e94560' }}>
                  {c.author_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-white">{c.author_name}</span>
                <span className="text-xs text-slate-600">{fmtDate(c.created_at)}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      {!user ? (
        <div className="rounded-xl border py-6 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
          <User className="mx-auto mb-2 h-7 w-7 text-slate-600" />
          <p className="mb-1 text-sm font-semibold text-white">Sign in to comment</p>
          <p className="mb-4 text-xs text-slate-500">Join the conversation with a free account.</p>
          <Link href={`/login?redirect=/tools/${toolSlug}`}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560' }}>
            Log in
          </Link>
        </div>
      ) : submitted ? (
        <div className="rounded-xl border py-6 text-center" style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)' }}>
          <p className="mb-1 text-2xl">✅</p>
          <p className="text-sm font-semibold text-white">Comment submitted!</p>
          <p className="mt-1 text-xs text-slate-500">It will appear here once approved by our team.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: '#e94560' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-white">{displayName}</span>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={`How has ${toolName} worked for you?`}
            rows={4}
            maxLength={2000}
            required
            className="w-full resize-none rounded-xl border p-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-red-500/50"
            style={{ borderColor: '#1e2a3a', background: '#0d1117' }}
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">{body.length}/2000 · Moderated before publishing</p>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#e94560' }}>
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
