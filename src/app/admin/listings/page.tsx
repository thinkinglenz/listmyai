'use client'

import { useState } from 'react'
import { Search, Filter, ExternalLink, Check, X, Trash2, Eye, ChevronDown } from 'lucide-react'

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

const MOCK_TOOLS: Tool[] = [
  { id:'1', name:'GitHub Copilot', slug:'github-copilot', category:'Code Generation', website:'github.com', status:'active', claimed:false, upvotes:1420, rating:4.7, added:'Jan 2026' },
  { id:'2', name:'ChatGPT', slug:'chatgpt', category:'General AI', website:'openai.com', status:'active', claimed:true, upvotes:3200, rating:4.8, added:'Jan 2026' },
  { id:'3', name:'Midjourney', slug:'midjourney', category:'Image Generation', website:'midjourney.com', status:'active', claimed:true, upvotes:2890, rating:4.9, added:'Feb 2026' },
  { id:'4', name:'ScriptGenius', slug:'scriptgenius', category:'Writing', website:'scriptgenius.io', status:'pending', claimed:false, upvotes:0, rating:0, added:'Today' },
  { id:'5', name:'DataForge AI', slug:'dataforge-ai', category:'Analytics', website:'dataforge.ai', status:'active', claimed:false, upvotes:340, rating:4.2, added:'May 2026' },
  { id:'6', name:'AutoDraft AI', slug:'autodraft-ai', category:'Writing', website:'autodraft.ai', status:'pending', claimed:false, upvotes:0, rating:0, added:'Today' },
  { id:'7', name:'ResumeBot', slug:'resumebot', category:'Productivity', website:'resumebot.com', status:'rejected', claimed:false, upvotes:0, rating:0, added:'2d ago' },
  { id:'8', name:'VoiceClone Pro', slug:'voiceclone-pro', category:'Audio', website:'voiceclone.pro', status:'active', claimed:true, upvotes:890, rating:4.5, added:'Apr 2026' },
  { id:'9', name:'NeuralDraw', slug:'neuraldraw', category:'Image Generation', website:'neuraldraw.com', status:'active', claimed:false, upvotes:560, rating:4.3, added:'Mar 2026' },
  { id:'10', name:'SynthVoice', slug:'synthvoice', category:'Audio', website:'synthvoice.com', status:'active', claimed:false, upvotes:710, rating:4.6, added:'Feb 2026' },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
}

export default function AdminListingsPage() {
  const [tools, setTools] = useState<Tool[]>(MOCK_TOOLS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = tools.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  function approve(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t))
  }
  function reject(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t))
  }
  function remove(id: string) {
    setTools(prev => prev.filter(t => t.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }
  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }
  function bulkApprove() {
    setTools(prev => prev.map(t => selected.has(t.id) ? { ...t, status: 'active' } : t))
    setSelected(new Set())
  }
  function bulkDelete() {
    setTools(prev => prev.filter(t => !selected.has(t.id)))
    setSelected(new Set())
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Listings</h1>
        <p className="text-sm text-slate-500">{tools.length} total tools · {tools.filter(t=>t.status==='pending').length} pending review</p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
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
            <button onClick={bulkApprove}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: '#10b981' }}>
              Approve all
            </button>
            <button onClick={bulkDelete}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: '#ef4444' }}>
              Delete all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                style={{ borderColor: '#1e2a3a' }}>
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" className="rounded"
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(t=>t.id)) : new Set())}
                    checked={selected.size === filtered.length && filtered.length > 0}
                  />
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
                const sm = STATUS_META[tool.status]
                return (
                  <tr key={tool.id} className="group transition hover:bg-white/[0.02]"
                    style={{ background: selected.has(tool.id) ? 'rgba(233,69,96,0.04)' : undefined }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded"
                        checked={selected.has(tool.id)}
                        onChange={() => toggleSelect(tool.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-sm">{tool.name}</p>
                      <p className="text-xs text-slate-600">{tool.website}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{tool.category}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: sm.color, background: sm.bg }}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${tool.claimed ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {tool.claimed ? '✓ Claimed' : 'Unclaimed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{tool.upvotes.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {tool.rating > 0 ? `${tool.rating} ★` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tool.added}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <a href={`/tools/${tool.slug}`} target="_blank"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        {tool.status === 'pending' && (
                          <>
                            <button onClick={() => approve(tool.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 transition hover:bg-emerald-500/10">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => reject(tool.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-500/10">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => remove(tool.id)}
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
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">No tools match your filter.</div>
        )}
      </div>
    </div>
  )
}
