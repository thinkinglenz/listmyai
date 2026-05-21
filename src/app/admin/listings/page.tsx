'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, Check, X, Trash2, Eye, ChevronDown, ChevronLeft, ChevronRight, Database } from 'lucide-react'

interface Tool {
  id: string
  name: string
  slug: string
  category: string
  website: string
  status: 'active' | 'pending' | 'rejected'
  claimed: boolean
  upvotes: number
  rating: number
  added: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
}

export default function AdminListingsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingCount, setPendingCount] = useState(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadTools = useCallback(async (p: number) => {
    setLoading(true)
    setApiError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      params.set('page', String(p))
      const res = await fetch(`/api/admin/listings?${params}`)
      const data = await res.json()
      if (data.error) {
        setApiError(data.error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTools((data.tools ?? []).map((t: any) => ({
          id: String(t.id),
          name: t.name ?? 'Unnamed',
          slug: t.slug ?? '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: (t.categories as any)?.name ?? '—',
          website: t.website ?? '—',
          status: t.status ?? 'pending',
          claimed: t.claimed ?? false,
          upvotes: t.upvotes ?? 0,
          rating: t.rating_avg ?? 0,
          added: t.created_at
            ? new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—',
        })))
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setPage(data.page ?? 1)
      }
    } catch (err) {
      setApiError(String(err))
    }
    setLoading(false)
  }, [filterStatus, search])

  // Load pending count separately (for the banner)
  useEffect(() => {
    fetch('/api/admin/listings?status=pending&page=1')
      .then(r => r.json())
      .then(d => setPendingCount(d.total ?? 0))
      .catch(() => {})
  }, [tools])

  useEffect(() => { loadTools(1) }, [loadTools])

  // Debounced search
  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return
    setSelected(new Set())
    loadTools(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function approve(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t))
    await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'active' }) })
  }
  async function reject(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t))
    await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'rejected' }) })
  }
  async function remove(id: string) {
    if (!confirm('Delete this tool permanently?')) return
    setTools(prev => prev.filter(t => t.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
    setTotal(prev => prev - 1)
    await fetch('/api/admin/listings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }
  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  async function bulkApprove() {
    const ids = Array.from(selected)
    setTools(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'active' } : t))
    setSelected(new Set())
    await Promise.all(ids.map(id =>
      fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'active' }) })
    ))
  }
  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} tools permanently?`)) return
    const ids = Array.from(selected)
    setTools(prev => prev.filter(t => !ids.includes(t.id)))
    setSelected(new Set())
    setTotal(prev => prev - ids.length)
    await Promise.all(ids.map(id =>
      fetch('/api/admin/listings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    ))
  }

  // Page range for pagination buttons
  function getPageRange(): number[] {
    const range: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }

  const fromItem = (page - 1) * 30 + 1
  const toItem = Math.min(page * 30, total)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Listings</h1>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading from Supabase…' : apiError ? '⚠️ Error loading data' : `${total} total tools · ${pendingCount} pending review · live from Supabase`}
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }} />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="appearance-none rounded-xl border py-2.5 pl-9 pr-8 text-sm text-slate-300 outline-none"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{selected.size} selected</span>
            <button onClick={bulkApprove} className="rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90" style={{ background: '#10b981' }}>Approve all</button>
            <button onClick={bulkDelete} className="rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90" style={{ background: '#ef4444' }}>Delete all</button>
          </div>
        )}
      </div>

      {/* Error */}
      {apiError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>Supabase error:</strong> {apiError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading tools from Supabase…</div>
        ) : tools.length === 0 && total === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Database className="h-10 w-10 mb-3 text-slate-700" />
            <p className="font-semibold text-slate-400">No tools match your filter</p>
            <p className="mt-1 text-sm text-slate-600">
              Tools submitted via <a href="/submit" target="_blank" className="underline" style={{ color: '#e94560' }}>/submit</a> will appear here for review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500" style={{ borderColor: '#1e2a3a' }}>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded"
                      onChange={e => setSelected(e.target.checked ? new Set(tools.map(t => t.id)) : new Set())}
                      checked={selected.size === tools.length && tools.length > 0} />
                  </th>
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Claimed</th>
                  <th className="px-4 py-3">Upvotes</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {tools.map(tool => {
                  const sm = STATUS_META[tool.status] ?? STATUS_META.pending
                  return (
                    <tr key={tool.id} className="group transition hover:bg-white/[0.02]"
                      style={{ background: selected.has(tool.id) ? 'rgba(233,69,96,0.04)' : undefined }}>
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded" checked={selected.has(tool.id)} onChange={() => toggleSelect(tool.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white text-sm">{tool.name}</p>
                        <p className="text-xs text-slate-600">{tool.website}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{tool.category}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: sm.color, background: sm.bg }}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${tool.claimed ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {tool.claimed ? '✓ Claimed' : 'Unclaimed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{tool.upvotes.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{tool.rating > 0 ? `${tool.rating} ★` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{tool.added}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {tool.slug && (
                            <a href={`/tools/${tool.slug}`} target="_blank"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white">
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {tool.status === 'pending' && (
                            <>
                              <button onClick={() => approve(tool.id)} title="Approve"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 transition hover:bg-emerald-500/10">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => reject(tool.id)} title="Reject"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-500/10">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button onClick={() => remove(tool.id)} title="Delete"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
          <p className="text-xs text-slate-500">
            Showing {fromItem}–{toItem} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageRange()[0] > 1 && (
              <>
                <button onClick={() => goToPage(1)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs text-slate-400 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  1
                </button>
                {getPageRange()[0] > 2 && <span className="px-1 text-slate-600">…</span>}
              </>
            )}
            {getPageRange().map(p => (
              <button key={p} onClick={() => goToPage(p)}
                className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition"
                style={{
                  borderColor: p === page ? '#e94560' : '#1e2a3a',
                  background: p === page ? 'rgba(233,69,96,0.15)' : '#161b27',
                  color: p === page ? '#e94560' : '#94a3b8',
                }}>
                {p}
              </button>
            ))}
            {getPageRange()[getPageRange().length - 1] < totalPages && (
              <>
                {getPageRange()[getPageRange().length - 1] < totalPages - 1 && <span className="px-1 text-slate-600">…</span>}
                <button onClick={() => goToPage(totalPages)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs text-slate-400 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  {totalPages}
                </button>
              </>
            )}
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {pendingCount > 0 && !loading && (
        <div className="mt-4 rounded-xl border p-3 text-sm text-slate-400" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
          <span className="font-semibold text-amber-400">⚠️ {pendingCount} pending</span> — hover any row to reveal the ✓ approve / ✗ reject buttons.
        </div>
      )}
    </div>
  )
}
