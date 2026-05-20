'use client'

import { useState, useEffect } from 'react'
import { FileWarning, Check, X, ExternalLink, Clock, AlertCircle, Eye } from 'lucide-react'

interface DmcaRequest {
  id: string
  requester: string
  email: string
  company?: string
  listing_url: string
  req_type?: string
  description: string
  status: 'pending' | 'resolved' | 'rejected'
  created_at: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Open',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  resolved:  { label: 'Resolved',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected:  { label: 'Dismissed', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

export default function AdminDmcaPage() {
  const [requests, setRequests] = useState<DmcaRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch('/api/admin/dmca')
      .then(r => r.json())
      .then(d => {
        if (d.requests) {
          setRequests(d.requests)
          if (d.requests.length > 0) setActiveId(d.requests[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function act(id: string, status: 'resolved' | 'rejected') {
    setActing(true)
    const res = await fetch('/api/admin/dmca', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
    setActing(false)
  }

  const active = requests.find(r => r.id === activeId)
  const open = requests.filter(r => r.status === 'pending')

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">DMCA Queue</h1>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${open.length} open · ${requests.length} total`}
        </p>
      </div>

      {!loading && open.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-2xl border p-4"
          style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">
              {open.length} open DMCA request{open.length !== 1 ? 's' : ''} require action
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              DMCA requests must be addressed within 24 hours to maintain safe harbor protection.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">Loading from Supabase…</div>
      )}

      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
          style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
          <FileWarning className="h-10 w-10 mb-3 text-slate-700" />
          <p className="font-semibold text-slate-400">No DMCA requests</p>
          <p className="mt-1 text-sm text-slate-600">
            DMCA takedown requests submitted via <span className="text-slate-400">/dmca</span> will appear here.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {requests.map(req => {
              const sm = STATUS_META[req.status] ?? STATUS_META.pending
              return (
                <button key={req.id} onClick={() => setActiveId(String(req.id))}
                  className="w-full rounded-2xl border p-4 text-left transition hover:border-red-500/30"
                  style={{
                    borderColor: activeId === String(req.id) ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
                    background: activeId === String(req.id) ? 'rgba(233,69,96,0.06)' : '#161b27',
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-white text-sm">{req.requester}</p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
                      style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{req.email}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{req.description}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                    <Clock className="h-3 w-3" /> {formatDate(req.created_at)}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {active ? (
              <div className="sticky top-6 rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <div className="border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: '#1e2a3a' }}>
                  <div>
                    <h2 className="font-bold text-white">DMCA: {active.requester}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {active.id}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ color: (STATUS_META[active.status] ?? STATUS_META.pending).color, background: (STATUS_META[active.status] ?? STATUS_META.pending).bg }}>
                    {(STATUS_META[active.status] ?? STATUS_META.pending).label}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBox label="Submitter" value={active.requester} />
                    <InfoBox label="Email" value={active.email} />
                    {active.company && <InfoBox label="Company" value={active.company} />}
                    <InfoBox label="Submitted" value={formatDate(active.created_at)} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Listing URL</p>
                    <a href={active.listing_url} target="_blank"
                      className="flex items-center gap-1.5 text-sm text-blue-400 hover:underline break-all">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      {active.listing_url}
                    </a>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-2">Description of Infringement</p>
                    <div className="rounded-xl p-3 text-sm leading-relaxed text-slate-300"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2a3a' }}>
                      {active.description}
                    </div>
                  </div>

                  {active.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => act(String(active.id), 'resolved')} disabled={acting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: '#10b981' }}>
                        <Check className="h-4 w-4" /> Mark Resolved
                      </button>
                      <button onClick={() => act(String(active.id), 'rejected')} disabled={acting}
                        className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:text-white disabled:opacity-50"
                        style={{ borderColor: '#1e2a3a' }}>
                        <X className="h-4 w-4" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border p-10 text-center"
                style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
                <FileWarning className="h-8 w-8 mb-2 text-slate-700" />
                <p className="text-sm text-slate-500">Select a request to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2a3a' }}>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  )
}
