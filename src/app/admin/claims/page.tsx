'use client'

import { useState, useEffect } from 'react'
import { Shield, Check, X, ExternalLink, Mail, Clock, AlertCircle } from 'lucide-react'

interface Claim {
  id: string
  tool_id: string
  claimant_email: string
  claimant_name: string
  claim_type: 'domain-match' | 'manual'
  status: 'pending' | 'approved' | 'rejected'
  note?: string
  created_at: string
  ai_tools?: { name: string; slug: string; website: string }
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  'domain-match': { label: 'Domain Match', color: '#10b981' },
  'manual':       { label: 'Manual Review', color: '#6366f1' },
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [tableReady, setTableReady] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch('/api/admin/claims')
      .then(r => {
        if (!r.ok) { setTableReady(false); return null }
        return r.json()
      })
      .then(d => { if (d?.claims) setClaims(d.claims) })
      .catch(() => setTableReady(false))
      .finally(() => setLoading(false))
  }, [])

  async function act(id: string, status: 'approved' | 'rejected') {
    setActing(true)
    const res = await fetch('/api/admin/claims', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setClaims(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      setActiveId(null)
    }
    setActing(false)
  }

  const pending  = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')
  const active   = claims.find(c => c.id === activeId)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Claim Requests</h1>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${pending.length} pending · ${resolved.length} resolved · live from Supabase`}
        </p>
      </div>

      {!loading && claims.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
          style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
          <Shield className="h-10 w-10 mb-3 text-slate-700" />
          <p className="font-semibold text-slate-400">No claim requests yet</p>
          <p className="mt-1 text-sm text-slate-600">
            When someone clicks &quot;Claim Listing&quot; on a tool page, it will appear here.
          </p>
          {!tableReady && (
            <div className="mt-6 rounded-xl border p-4 text-left max-w-md" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
              <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ One setup step needed</p>
              <p className="text-xs text-slate-400">
                Run this SQL in Supabase to create the claims table:
              </p>
              <pre className="mt-2 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap" style={{ fontFamily: 'monospace' }}>{SQL_HINT}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* List */}
          <div className="lg:col-span-3 space-y-3">
            {loading && (
              <div className="py-12 text-center text-sm text-slate-500">Loading from Supabase…</div>
            )}
            {!loading && pending.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting Review</p>
                {pending.map(claim => (
                  <ClaimCard key={claim.id} claim={claim} active={activeId === claim.id}
                    onClick={() => setActiveId(activeId === claim.id ? null : claim.id)} />
                ))}
              </>
            )}
            {!loading && resolved.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Resolved</p>
                {resolved.map(claim => (
                  <ClaimCard key={claim.id} claim={claim} active={activeId === claim.id}
                    onClick={() => setActiveId(activeId === claim.id ? null : claim.id)} />
                ))}
              </>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {active ? (
              <div className="sticky top-6 rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-white">{active.ai_tools?.name ?? 'Unknown tool'}</h2>
                    {active.ai_tools?.slug && (
                      <a href={`/tools/${active.ai_tools.slug}`} target="_blank"
                        className="flex items-center gap-1 text-xs hover:underline mt-0.5"
                        style={{ color: '#e94560' }}>
                        View listing <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: STATUS_META[active.status].color, background: STATUS_META[active.status].bg }}>
                    {STATUS_META[active.status].label}
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  <Row label="Claimant" value={active.claimant_name} />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Email</p>
                    <a href={`mailto:${active.claimant_email}`} className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
                      <Mail className="h-3.5 w-3.5" /> {active.claimant_email}
                    </a>
                  </div>
                  {active.ai_tools?.website && (
                    <Row label="Tool domain" value={active.ai_tools.website} />
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Type</p>
                    <span className="text-sm font-medium" style={{ color: TYPE_META[active.claim_type]?.color ?? '#94a3b8' }}>
                      {TYPE_META[active.claim_type]?.label ?? active.claim_type}
                    </span>
                  </div>
                  <Row label="Submitted" value={new Date(active.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
                </div>

                {active.note && (
                  <div className="mb-5 flex gap-2 rounded-xl border p-3"
                    style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' }}>
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <p className="text-xs text-slate-300">{active.note}</p>
                  </div>
                )}

                {active.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => act(active.id, 'approved')} disabled={acting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#10b981' }}>
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => act(active.id, 'rejected')} disabled={acting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="sticky top-6 flex flex-col items-center justify-center rounded-2xl border p-10 text-center"
                style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
                <Shield className="h-8 w-8 mb-2 text-slate-700" />
                <p className="text-sm text-slate-500">Select a claim to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ClaimCard({ claim, active, onClick }: { claim: Claim; active: boolean; onClick: () => void }) {
  const sm = STATUS_META[claim.status]
  const tm = TYPE_META[claim.claim_type] ?? { label: claim.claim_type, color: '#94a3b8' }
  return (
    <button onClick={onClick} className="w-full rounded-2xl border p-4 text-left transition hover:border-red-500/30"
      style={{
        borderColor: active ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
        background: active ? 'rgba(233,69,96,0.06)' : '#161b27',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm">{claim.ai_tools?.name ?? 'Unknown'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{claim.claimant_email}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
          <span className="text-[10px] font-medium" style={{ color: tm.color }}>{tm.label}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
        <Clock className="h-3 w-3" />
        {new Date(claim.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </div>
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  )
}

const SQL_HINT = `CREATE TABLE IF NOT EXISTS claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  claimant_email TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  claim_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
