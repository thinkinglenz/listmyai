'use client'

import { useState } from 'react'
import { Shield, Check, X, ExternalLink, Mail, Clock, AlertCircle } from 'lucide-react'

interface Claim {
  id: string
  tool: string
  slug: string
  toolDomain: string
  claimantEmail: string
  claimantName: string
  type: 'domain-match' | 'manual'
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  note?: string
}

const MOCK_CLAIMS: Claim[] = [
  {
    id: 'c1', tool: 'AutoDraft AI', slug: 'autodraft-ai', toolDomain: 'autodraft.ai',
    claimantEmail: 'team@autodraft.ai', claimantName: 'Jordan Lee', type: 'domain-match',
    status: 'pending', submittedAt: '2h ago',
  },
  {
    id: 'c2', tool: 'CodeWhiz Pro', slug: 'codewhiz-pro', toolDomain: 'codewhiz.io',
    claimantEmail: 'hello@codewhiz.io', claimantName: 'Priya Sharma', type: 'domain-match',
    status: 'pending', submittedAt: '5h ago',
  },
  {
    id: 'c3', tool: 'SynthVoice', slug: 'synthvoice', toolDomain: 'synthvoice.com',
    claimantEmail: 'ops@myagency.com', claimantName: 'Alex Torres', type: 'manual',
    status: 'pending', submittedAt: '2d ago',
    note: 'Domain mismatch — claimant says they are the marketing agency for SynthVoice. Requires manual verification.',
  },
  {
    id: 'c4', tool: 'DataBot Pro', slug: 'databot-pro', toolDomain: 'databot.pro',
    claimantEmail: 'admin@databot.pro', claimantName: 'Sam Nguyen', type: 'domain-match',
    status: 'approved', submittedAt: '1d ago',
  },
  {
    id: 'c5', tool: 'PixelMind', slug: 'pixelmind', toolDomain: 'pixelmind.ai',
    claimantEmail: 'contact@randomco.com', claimantName: 'Unknown', type: 'manual',
    status: 'rejected', submittedAt: '3d ago',
    note: 'Could not verify ownership. Email domain does not match tool domain.',
  },
]

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
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS)
  const [activeId, setActiveId] = useState<string | null>(null)

  function approve(id: string) {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
    setActiveId(null)
  }
  function reject(id: string) {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
    setActiveId(null)
  }

  const pending = claims.filter(c => c.status === 'pending')
  const resolved = claims.filter(c => c.status !== 'pending')
  const active = claims.find(c => c.id === activeId)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Claim Requests</h1>
        <p className="text-sm text-slate-500">{pending.length} pending · {resolved.length} resolved</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* List */}
        <div className="lg:col-span-3 space-y-3">
          {pending.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting Review</p>
              {pending.map(claim => (
                <ClaimCard key={claim.id} claim={claim} active={activeId === claim.id}
                  onClick={() => setActiveId(activeId === claim.id ? null : claim.id)} />
              ))}
            </>
          )}
          {resolved.length > 0 && (
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
                  <h2 className="font-bold text-white">{active.tool}</h2>
                  <a href={`/tools/${active.slug}`} target="_blank"
                    className="flex items-center gap-1 text-xs hover:underline mt-0.5"
                    style={{ color: '#e94560' }}>
                    View listing <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ color: STATUS_META[active.status].color, background: STATUS_META[active.status].bg }}>
                  {STATUS_META[active.status].label}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <Row label="Claimant" value={active.claimantName} />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                  <a href={`mailto:${active.claimantEmail}`} className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {active.claimantEmail}
                  </a>
                </div>
                <Row label="Tool domain" value={active.toolDomain} />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Type</p>
                  <span className="text-sm font-medium" style={{ color: TYPE_META[active.type].color }}>
                    {TYPE_META[active.type].label}
                  </span>
                </div>
                <Row label="Submitted" value={active.submittedAt} />
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
                  <button onClick={() => approve(active.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{ background: '#10b981' }}>
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => reject(active.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/10"
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
              <p className="text-sm text-slate-500">Select a claim request to review details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClaimCard({ claim, active, onClick }: { claim: Claim; active: boolean; onClick: () => void }) {
  const sm = STATUS_META[claim.status]
  const tm = TYPE_META[claim.type]
  return (
    <button onClick={onClick} className="w-full rounded-2xl border p-4 text-left transition hover:border-red-500/30"
      style={{
        borderColor: active ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
        background: active ? 'rgba(233,69,96,0.06)' : '#161b27',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm">{claim.tool}</p>
          <p className="text-xs text-slate-500 mt-0.5">{claim.claimantEmail}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
          <span className="text-[10px] font-medium" style={{ color: tm.color }}>{tm.label}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
        <Clock className="h-3 w-3" /> {claim.submittedAt}
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
