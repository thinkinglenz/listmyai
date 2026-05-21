'use client'

import { useState } from 'react'
import { AlertCircle, Shield } from 'lucide-react'
import ClaimModal from './ClaimModal'

interface Props {
  toolId: string
  toolName: string
  toolSlug: string
  toolWebsite: string
}

export default function ClaimBanner({ toolId, toolName, toolSlug, toolWebsite }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border px-5 py-4"
        style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.05)' }}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-sm font-semibold text-white">This listing is unclaimed</p>
            <p className="text-xs text-slate-400">
              Are you the owner of <strong>{toolName}</strong>? Claim it to manage your listing, add deals, and track analytics.
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex w-full sm:w-auto flex-shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#e94560', boxShadow: '0 0 16px rgba(233,69,96,0.2)' }}>
          <Shield className="h-4 w-4" /> Claim Now
        </button>
      </div>

      {open && (
        <ClaimModal
          toolId={toolId}
          toolName={toolName}
          toolSlug={toolSlug}
          toolWebsite={toolWebsite}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
