'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MessageSquare, Check, X, Trash2, ExternalLink, AlertTriangle } from 'lucide-react'

const ADMIN_SECRET = 'lmai@admin2026'

interface AdminComment {
  id: string
  tool_id: string
  author_name: string
  author_email: string | null
  body: string
  status: 'pending' | 'approved' | 'rejected'
  moderator_note: string | null
  created_at: string
  ai_tools: { name: string; slug: string } | { name: string; slug: string }[] | null
}

function toolOf(c: AdminComment): { name: string; slug: string } | null {
  if (!c.ai_tools) return null
  return Array.isArray(c.ai_tools) ? c.ai_tools[0] ?? null : c.ai_tools
}

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'] as const

const STATUS_CLS: Record<string, string> = {
  pending:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  approved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof STATUS_TABS[number]>('pending')
  const [needsMigration, setNeedsMigration] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tool-comments?status=${filter}&secret=${ADMIN_SECRET}`)
      const data = await res.json()
      setComments(data.comments ?? [])
      setNeedsMigration(!!data.needsMigration)
    } catch { /* ignore */ }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function moderate(id: string, action: 'approve' | 'reject') {
    setBusy(id)
    await fetch(`/api/admin/tool-comments?secret=${ADMIN_SECRET}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    setBusy(null)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this comment permanently?')) return
    setBusy(id)
    await fetch(`/api/admin/tool-comments?id=${id}&secret=${ADMIN_SECRET}`, { method: 'DELETE' })
    setBusy(null)
    load()
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black text-white">
          <MessageSquare className="h-6 w-6" style={{ color: '#e94560' }} />
          Tool Comments
        </h1>
        <p className="mt-1 text-sm text-slate-500">Moderate comments posted on tool pages — only approved comments are shown publicly.</p>
      </div>

      {needsMigration && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>The <code>tool_comments</code> table doesn&apos;t exist yet. Run <code>supabase/migrations/tool_comments.sql</code> in the Supabase SQL editor.</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition"
            style={{
              background: filter === s ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.03)',
              color: filter === s ? '#e94560' : '#94a3b8',
              border: `1px solid ${filter === s ? 'rgba(233,69,96,0.25)' : '#1e2a3a'}`,
            }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border py-14 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-500">No {filter !== 'all' ? filter : ''} comments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(c => {
            const tool = toolOf(c)
            return (
              <div key={c.id} className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{c.author_name}</span>
                  {c.author_email && <span className="text-xs text-slate-600">{c.author_email}</span>}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_CLS[c.status] ?? ''}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-slate-600">
                    {new Date(c.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {tool && (
                    <Link href={`/tools/${tool.slug}`} target="_blank"
                      className="ml-auto flex items-center gap-1 text-xs hover:underline" style={{ color: '#e94560' }}>
                      {tool.name} <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                <p className="mb-3 text-sm leading-relaxed text-slate-300">{c.body}</p>

                <div className="flex flex-wrap gap-2">
                  {c.status !== 'approved' && (
                    <button onClick={() => moderate(c.id, 'approve')} disabled={busy === c.id}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button onClick={() => moderate(c.id, 'reject')} disabled={busy === c.id}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  )}
                  <button onClick={() => remove(c.id)} disabled={busy === c.id}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
