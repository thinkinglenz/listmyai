'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { MessageSquare, Send, User } from 'lucide-react'

interface Comment {
  id: string
  author_name: string
  body: string
  created_at: string
}

interface Props {
  postId: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Load approved comments
  const loadComments = useCallback(async () => {
    const res = await fetch(`/api/blog/comments?post_id=${postId}`)
    if (res.ok) {
      const data = await res.json()
      setComments(data.comments ?? [])
    }
    setLoading(false)
  }, [postId])

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session
      if (s?.user) {
        setUser({
          id: s.user.id,
          email: s.user.email ?? '',
          name: s.user.user_metadata?.full_name ?? s.user.email?.split('@')[0] ?? 'User',
        })
      }
    })
    loadComments()
  }, [loadComments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !user) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, body: body.trim() }),
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

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.href : undefined },
    })
  }

  return (
    <section className="mt-14 border-t pt-10" style={{ borderColor: '#1e2a3a' }}>
      <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-white">
        <MessageSquare className="h-5 w-5" style={{ color: '#e94560' }} />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              <div className="mb-2 h-3 w-24 rounded bg-slate-800" />
              <div className="h-4 w-full rounded bg-slate-800" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="mb-6 rounded-2xl border py-8 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="mb-8 space-y-4">
          {comments.map(c => (
            <div key={c.id} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
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
      <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
        {!user ? (
          <div className="text-center">
            <User className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="mb-1 font-semibold text-white">Sign in to comment</p>
            <p className="mb-4 text-sm text-slate-500">Join the conversation — sign in or create a free account.</p>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}
            >
              Sign in with Google
            </button>
          </div>
        ) : submitted ? (
          <div className="py-4 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-white">Comment submitted!</p>
            <p className="mt-1 text-sm text-slate-500">Your comment is awaiting moderation and will appear once approved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: '#e94560' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-white">{user.name}</span>
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              maxLength={2000}
              required
              className="w-full resize-none rounded-xl border p-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-red-500/50"
              style={{ borderColor: '#1e2a3a', background: '#0d1117' }}
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-600">{body.length}/2000 · Comments are moderated before publishing</p>
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#e94560' }}
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
