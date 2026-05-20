'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, ExternalLink, Check, X, Trash2, Eye, ChevronDown, Database } from 'lucide-react'

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

  const loadTools = useCallback(async () => {
    setLoading(true)
    setApiError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/listings?${params}`)
      const data = await res.json()
      if (data.error) {
        setApiError(data.error)
      } else {
        setTools((data.tools ?? []).map((t: any) => ({
          id: String(t.id),
          name: t.name ?? 'Unnamed',
          slug: t.slug ?? '',
          category: t.categories?.name ?? '—',
          website: t.website ?? '—',
          status: t.status ?? 'pending',
          claimed: t.claimed ?? false,
          upvotes: t.upvotes ?? 0,
          rating: t.rating_avg ?? 0,
          added: t.created_at
            ? new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—',
        })))
      }
    } catch (err) {
      setApiError(String(err))
    }
    setLoading(false)
  }, [filterStatus, search])

  useEffect(() => { loadTools() }, [loadTools])

  const filtered = tools.filter(t => {
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.website.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

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
    await Promise.all(ids.map(id =>
      fetch('/api/admin/listings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    ))
  }

  const pendingCount = tools.filter(t => t.status === 'pending').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Listings</h1>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading from Supabase…' : apiError ? '⚠️ Error loading data' : `${tools.length} total tools · ${pendingCount} pending review · live from Supabase`}
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }} />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
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
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Database className="h-10 w-10 mb-3 text-slate-700" />
            <p className="font-semibold text-slate-400">No tools in the database yet</p>
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
                      onChange={e => setSelected(e.target.checked ? new Set(filtered.map(t => t.id)) : new Set())}
                      checked={selected.size === filtered.length && filtered.length > 0} />
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
                {filtered.map(tool => {
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
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">No tools match your filter.</div>
            )}
          </div>
        )}
      </div>

      {pendingCount > 0 && !loading && (
        <div className="mt-4 rounded-xl border p-3 text-sm text-slate-400" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
          <span className="font-semibold text-amber-400">⚠️ {pendingCount} pending</span> — hover any row to reveal the ✓ approve / ✗ reject buttons.
        </div>
      )}
    </div>
  )
}
