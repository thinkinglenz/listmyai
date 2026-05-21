'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Send, Mail, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight,
  Filter, ChevronDown, AlertTriangle, ExternalLink, Users,
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  slug: string
  website: string
  contact_email: string
  claimed: boolean
  outreach_sent_at: string | null
  created_at: string
}

interface Stats {
  totalWithEmail: number
  totalSent: number
  totalPending: number
}

interface SendResult {
  id: string
  name: string
  email: string
  sent: boolean
  error?: string
}

export default function AdminOutreachPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'sent' | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null)

  const loadTools = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/outreach?filter=${filter}&page=${p}`)
      const data = await res.json()
      if (data.needsMigration) {
        setMigrationNeeded(true)
        setError(data.error)
      } else if (data.error) {
        setError(data.error)
      } else {
        setTools(data.tools ?? [])
        setStats(data.stats ?? null)
        setPage(data.page ?? 1)
        setTotalPages(data.totalPages ?? 1)
        setTotal(data.total ?? 0)
      }
    } catch (err) {
      setError(String(err))
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { loadTools(1) }, [loadTools])

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return
    setSelected(new Set())
    loadTools(p)
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function selectAll() {
    if (selected.size === tools.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(tools.filter(t => !t.outreach_sent_at && !t.claimed).map(t => t.id)))
    }
  }

  async function sendOutreach(ids: string[]) {
    if (ids.length === 0) return
    if (!confirm(`Send outreach emails to ${ids.length} tool owner${ids.length > 1 ? 's' : ''}?`)) return

    setSending(true)
    setSendResults(null)
    try {
      const res = await fetch('/api/admin/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolIds: ids }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSendResults(data.results ?? [])
        // Refresh list
        setSelected(new Set())
        setTimeout(() => loadTools(page), 1000)
      }
    } catch (err) {
      setError(String(err))
    }
    setSending(false)
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const fromItem = (page - 1) * 30 + 1
  const toItem = Math.min(page * 30, total)

  if (migrationNeeded) {
    return (
      <div>
        <h1 className="text-2xl font-black text-white mb-4">Outreach</h1>
        <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-white mb-2">Database Migration Required</h2>
              <p className="text-sm text-slate-400 mb-4">Run this SQL in your Supabase SQL Editor to enable outreach tracking:</p>
              <pre className="rounded-xl p-4 text-sm text-emerald-400 overflow-x-auto" style={{ background: '#0d1117' }}>
                ALTER TABLE ai_tools ADD COLUMN outreach_sent_at timestamptz;
              </pre>
              <button onClick={() => { setMigrationNeeded(false); loadTools(1) }}
                className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: '#e94560' }}>
                I&apos;ve run the migration — retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Outreach</h1>
        <p className="text-sm text-slate-500">Email tool owners to let them know their tool is listed — invite them to claim it</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-3xl font-black text-slate-300">{stats.totalWithEmail}</p>
            <p className="mt-1 text-xs text-slate-500">Have Contact Email</p>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-3xl font-black text-amber-400">{stats.totalPending}</p>
            <p className="mt-1 text-xs text-slate-500">Pending Outreach</p>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-3xl font-black text-emerald-400">{stats.totalSent}</p>
            <p className="mt-1 text-xs text-slate-500">Emails Sent</p>
          </div>
        </div>
      )}

      {/* Send results banner */}
      {sendResults && (
        <div className="mb-4 rounded-xl border p-4" style={{
          borderColor: sendResults.every(r => r.sent) ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
          background: sendResults.every(r => r.sent) ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white">
              {sendResults.filter(r => r.sent).length} sent, {sendResults.filter(r => !r.sent).length} failed
            </p>
            <button onClick={() => setSendResults(null)} className="text-xs text-slate-500 hover:text-white">Dismiss</button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {sendResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {r.sent ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                <span className="text-white font-medium">{r.name}</span>
                <span className="text-slate-500">{r.email}</span>
                {r.error && <span className="text-red-400">— {r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <select value={filter} onChange={e => { setFilter(e.target.value as typeof filter); setPage(1); setSelected(new Set()) }}
            className="appearance-none rounded-xl border py-2.5 pl-9 pr-8 text-sm text-slate-300 outline-none"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <option value="pending">Pending outreach</option>
            <option value="sent">Already sent</option>
            <option value="all">All with email</option>
          </select>
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="flex-1" />

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{selected.size} selected</span>
            <button onClick={() => sendOutreach(Array.from(selected))} disabled={sending}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#e94560' }}>
              {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? 'Sending…' : `Send ${selected.size} Email${selected.size > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && !migrationNeeded && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading tools…</div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 mb-3 text-slate-700" />
            <p className="font-semibold text-slate-400">
              {filter === 'pending' ? 'No tools pending outreach' : filter === 'sent' ? 'No emails sent yet' : 'No tools with contact emails'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Run enrichment first to scrape contact emails from tool websites.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500" style={{ borderColor: '#1e2a3a' }}>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded"
                      onChange={selectAll}
                      checked={selected.size > 0 && selected.size === tools.filter(t => !t.outreach_sent_at && !t.claimed).length}
                      disabled={filter === 'sent'} />
                  </th>
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3">Contact Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {tools.map(tool => {
                  const canSend = !tool.outreach_sent_at && !tool.claimed
                  return (
                    <tr key={tool.id} className="group transition hover:bg-white/[0.02]"
                      style={{ background: selected.has(tool.id) ? 'rgba(233,69,96,0.04)' : undefined }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded"
                          checked={selected.has(tool.id)}
                          onChange={() => toggleSelect(tool.id)}
                          disabled={!canSend} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-white text-sm">{tool.name}</p>
                            <a href={tool.website} target="_blank" rel="noopener"
                              className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1">
                              {tool.website.replace(/https?:\/\//, '').replace(/\/$/, '')}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-300 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          {tool.contact_email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tool.claimed ? (
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-400" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            Claimed
                          </span>
                        ) : tool.outreach_sent_at ? (
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-blue-400" style={{ background: 'rgba(59,130,246,0.1)' }}>
                            Sent {timeAgo(tool.outreach_sent_at)}
                          </span>
                        ) : (
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-amber-400" style={{ background: 'rgba(245,158,11,0.1)' }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {new Date(tool.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        {canSend ? (
                          <button onClick={() => sendOutreach([tool.id])} disabled={sending}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 opacity-0 group-hover:opacity-100"
                            style={{ background: '#e94560' }}>
                            <Send className="h-3 w-3" /> Send
                          </button>
                        ) : (
                          <a href={`/tools/${tool.slug}`} target="_blank"
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition opacity-0 group-hover:opacity-100">
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {fromItem}–{toItem} of {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition hover:text-white disabled:opacity-30"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <button key={p} onClick={() => goToPage(p)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition"
                  style={{
                    borderColor: p === page ? '#e94560' : '#1e2a3a',
                    background: p === page ? 'rgba(233,69,96,0.15)' : '#161b27',
                    color: p === page ? '#e94560' : '#94a3b8',
                  }}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition hover:text-white disabled:opacity-30"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <h3 className="text-sm font-semibold text-white mb-2">How Outreach Works</h3>
        <ul className="space-y-1.5 text-xs text-slate-500">
          <li>1. <strong className="text-slate-400">Enrichment</strong> scrapes contact emails from tool websites (Admin &rarr; Scraper)</li>
          <li>2. <strong className="text-slate-400">Outreach</strong> sends a branded email: &ldquo;Your tool is listed on ListmyAI — claim it for free&rdquo;</li>
          <li>3. The email links to the tool&apos;s listing page where owners can <strong className="text-emerald-400">Claim</strong> it</li>
          <li>4. Each tool is only emailed <strong className="text-white">once</strong> — duplicates are automatically prevented</li>
        </ul>
      </div>
    </div>
  )
}
