'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquareText, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Mail } from 'lucide-react'

interface Turn { role: 'user' | 'model'; content: string }
interface Enquiry {
  id: string
  conversation_id: string
  agent_slug: string
  status: 'open' | 'complete'
  turns: number
  summary: string | null
  contact_name: string | null
  contact_email: string | null
  page_path: string | null
  delivered: boolean
  delivery_error: string | null
  transcript: Turn[]
  created_at: string
}
interface Stats { total: number; completed: number; abandoned: number; undelivered: number }
interface PageInfo { page: number; perPage: number; totalPages: number; total: number }

const FILTERS = [
  { id: '', label: 'Everything' },
  { id: 'complete', label: 'Finished' },
  { id: 'open', label: 'Gave up partway' },
]

export default function AdminEnquiriesPage() {
  // null means "nothing has come back yet", which is also what drives the
  // loading state. Storing a separate `loading` flag meant setting it
  // synchronously inside the effect, and a derived value says the same thing
  // without that.
  const [rows, setRows] = useState<Enquiry[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [info, setInfo] = useState<PageInfo | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<string | null>(null)

  // The fetch lives inside the effect with a cancellation flag rather than in
  // a useCallback called from it. That keeps every setState behind an await,
  // and it fixes a real race: clicking through the filters quickly could land
  // an earlier response after a later one and show the wrong list.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/admin/enquiries?status=${status}&page=${page}&perPage=25`)
        if (cancelled) return
        if (!res.ok) { setHint('Not authorised, or the request failed.'); setRows([]); return }
        const d = await res.json()
        if (cancelled) return
        setRows(d.enquiries ?? [])
        setStats(d.stats ?? null)
        setInfo(d.page ?? null)
        setHint(d.hint ?? null)
      } catch {
        if (!cancelled) { setHint('Could not load enquiries.'); setRows([]) }
      }
    })()
    return () => { cancelled = true }
  }, [status, page])

  const loading = rows === null

  const card = { border: '1px solid #1e2a3a', background: '#161b27' }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-white">Agent enquiries</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every conversation started on an agent page, including the ones nobody finished.
      </p>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Conversations started', value: stats.total, color: '#fff' },
            { label: 'Finished', value: stats.completed, color: '#6ee7b7' },
            { label: 'Gave up partway', value: stats.abandoned, color: '#fbbf24' },
            // The one that matters most if it is ever above zero: the lead
            // exists but the email never left.
            { label: 'Not delivered', value: stats.undelivered, color: stats.undelivered > 0 ? '#f87171' : '#64748b' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={card}>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats && stats.undelivered > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {stats.undelivered} finished {stats.undelivered === 1 ? 'enquiry' : 'enquiries'} never reached the inbox.
          The transcript is here, so nothing is lost — but the email is failing and needs fixing.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f.id} type="button" onClick={() => { setStatus(f.id); setPage(1) }}
            className="rounded-full px-3.5 py-1.5 text-xs font-medium transition"
            style={f.id === status
              ? { background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.4)', color: '#f87171' }
              : { background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2a3a', color: '#94a3b8' }}>
            {f.label}
          </button>
        ))}
      </div>

      {hint && (
        <p className="mt-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          {hint}
        </p>
      )}

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : (rows ?? []).length === 0 && !hint ? (
        <p className="mt-6 rounded-xl px-4 py-5 text-sm text-slate-500" style={card}>
          Nothing yet. When someone opens an agent page and types a first answer, it appears here
          straight away — before they finish.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {(rows ?? []).map(r => (
            <div key={r.id} className="rounded-2xl" style={card}>
              <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={r.status === 'complete'
                        ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.12)' }
                        : { color: '#fbbf24', background: 'rgba(245,158,11,0.12)' }}>
                      {r.status === 'complete' ? 'finished' : `gave up after ${r.turns}`}
                    </span>
                    <span className="text-sm font-bold text-white">{r.agent_slug}</span>
                    {r.contact_email && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail className="h-3 w-3" /> {r.contact_email}
                      </span>
                    )}
                    {r.status === 'complete' && (
                      r.delivered
                        ? <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle2 className="h-3 w-3" /> emailed</span>
                        : <span className="flex items-center gap-1 text-[11px] text-red-400"><AlertTriangle className="h-3 w-3" /> not emailed</span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {r.summary ?? r.transcript?.find(t => t.role === 'user')?.content ?? '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {new Date(r.created_at).toLocaleString()}{r.page_path ? ` · ${r.page_path}` : ''}
                  </p>
                </div>
                {open === r.id ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-500" />
                               : <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500" />}
              </button>

              {open === r.id && (
                <div className="space-y-2.5 border-t px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
                  {r.delivery_error && (
                    <p className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}>
                      Delivery error: {r.delivery_error}
                    </p>
                  )}
                  {(r.transcript ?? []).map((t, i) => (
                    <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div className="max-w-[80%] whitespace-pre-wrap rounded-xl px-3.5 py-2 text-xs leading-relaxed"
                        style={t.role === 'user'
                          ? { background: '#e94560', color: '#fff' }
                          : { background: '#0b0f16', color: '#cbd5e1', border: '1px solid #1e2a3a' }}>
                        {t.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {info && info.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span>{(info.page - 1) * info.perPage + 1}–{Math.min(info.page * info.perPage, info.total)} of {info.total}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={info.page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-30" style={{ borderColor: '#1e2a3a' }}>Previous</button>
            <span>{info.page} / {info.totalPages}</span>
            <button type="button" disabled={info.page >= info.totalPages} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-30" style={{ borderColor: '#1e2a3a' }}>Next</button>
          </div>
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
        <MessageSquareText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        A conversation is saved from the visitor&apos;s first answer, so one that stops partway still
        shows up. That is what tells a traffic problem apart from a form problem.
      </p>
    </div>
  )
}
