'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

/**
 * Reasons are editable rather than fixed codes: the claimant reads this text
 * verbatim in their email and on their dashboard, so it has to be able to say
 * something specific about their case.
 */
const PRESETS = [
  {
    label: 'Not a company email address',
    text: 'We could not verify that you represent this company. Claims must come from an email address on the tool\'s own domain — a personal address (Gmail, Outlook, Yahoo and similar) is not enough to prove ownership. Please submit a new claim using your company email address, and we will approve it right away.',
  },
  {
    label: 'Email domain does not match the tool',
    text: 'The email address on this claim belongs to a different domain than the tool being claimed. Please claim again from an email address on the tool\'s own domain so we can verify the connection.',
  },
  {
    label: 'Already claimed by someone else',
    text: 'This listing has already been claimed and verified by another representative of the company. If you believe that is a mistake, reply to this email and we will look into it.',
  },
  {
    label: 'Not enough information',
    text: 'We were not able to confirm your connection to this tool from the information provided. Please claim again from your company email address, and include your role at the company.',
  },
]

interface Props {
  toolName: string
  claimantEmail: string
  busy: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export default function RejectClaimDialog({ toolName, claimantEmail, busy, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState(PRESETS[0].text)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border bg-slate-900" style={{ borderColor: '#1e2a3a' }}>
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Reject claim</h2>
            <p className="text-xs text-slate-500">{toolName} · {claimantEmail}</p>
          </div>
          <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Common reasons</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setReason(preset.text)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                  style={{
                    borderColor: reason === preset.text ? '#e94560' : '#1e2a3a',
                    color: reason === preset.text ? '#e94560' : undefined,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-400">
              Reason sent to the claimant
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={7}
              className="w-full resize-none rounded-lg border bg-white/5 px-3 py-2 text-sm leading-relaxed text-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Emailed to {claimantEmail} and shown on their dashboard. Edit it to suit this claim.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={busy || !reason.trim()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: '#ef4444' }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject and notify
          </button>
        </div>
      </div>
    </div>
  )
}
