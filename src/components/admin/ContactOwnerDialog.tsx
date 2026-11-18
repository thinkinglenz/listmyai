'use client'

import { useState } from 'react'
import { X, Mail, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export interface ContactTarget {
  id: string
  name: string
  slug: string | null
  website: string | null
  ownerEmail: string | null
}

interface Template {
  id: string
  label: string
  subject: (t: ContactTarget) => string
  body: (t: ContactTarget) => string
}

/**
 * Ready-made openings for the reasons an admin actually writes.
 *
 * Templates, not canned sends: the body stays editable and nothing leaves
 * until Send is pressed. The most common message by far is "your site is
 * down", which is why it leads — and why it asks rather than threatens. A
 * claimed listing is a customer relationship, and the first contact should
 * not read like an eviction notice.
 */
const TEMPLATES: Template[] = [
  {
    id: 'unreachable',
    label: 'Site not reachable',
    subject: t => `${t.name} — your site is not loading for us`,
    body: t => [
      `Hello,`,
      ``,
      `We check the links on claimed listings from time to time, and ${t.name} is not loading for us at the moment:`,
      ``,
      `${t.website ?? 'the website on your listing'}`,
      ``,
      `It may well be temporary, or something that only affects us. Could you take a look and let us know?`,
      ``,
      `If the address has changed, reply with the new one and we will update the listing. If the site is down for a while, we can hide the listing until it is back rather than send visitors to a dead link — just say the word.`,
    ].join('\n'),
  },
  {
    id: 'details',
    label: 'Listing details need updating',
    subject: t => `${t.name} — a quick check on your listing details`,
    body: t => [
      `Hello,`,
      ``,
      `We are tidying up the details on claimed listings and wanted to check a couple of things on ${t.name}.`,
      ``,
      `Could you confirm the description, pricing and category are still accurate? If anything has changed, reply here and we will update it, or edit it yourself from your dashboard.`,
    ].join('\n'),
  },
  {
    id: 'blank',
    label: 'Write from scratch',
    subject: t => `About your ${t.name} listing`,
    body: () => '',
  },
]

const FIELD = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600'
const FIELD_STYLE = { background: '#0b0f16', border: '1px solid #1e2a3a' }

/**
 * The draft itself, split out so the prefill can live in useState initialisers
 * rather than an effect.
 *
 * The parent remounts it with a key of target + template, so switching either
 * produces a fresh draft without a reset-on-change effect — and crucially,
 * opening the dialog on a different listing can never leave the previous
 * tool's name in the body. Sending that to the wrong customer is the mistake
 * this arrangement is guarding against.
 */
function Composer({ target, template, onClose }: { target: ContactTarget; template: Template; onClose: () => void }) {
  const [subject, setSubject] = useState(() => template.subject(target))
  const [message, setMessage] = useState(() => template.body(target))
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function send() {
    if (sending) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/listings/contact-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: target.id, subject, message }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setResult({ ok: false, text: data?.error ?? 'The message could not be sent.' })
        return
      }
      // Names the address it reached. A green tick alone does not tell an
      // admin whether it went to the right person.
      setResult({ ok: true, text: `Sent to ${data.to}.` })
    } catch {
      setResult({ ok: false, text: 'That did not send. Check your connection and try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="space-y-3.5 px-5 pb-5">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subject</label>
          <input className={FIELD} style={FIELD_STYLE} value={subject} maxLength={150}
            onChange={e => setSubject(e.target.value)} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Message</label>
          <textarea className={`${FIELD} resize-y`} style={FIELD_STYLE} rows={11} maxLength={4000}
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Write your message…" />
          <p className="mt-1.5 text-[11px] text-slate-600">
            Sent from noreply@listmyai.com, signed as the ListmyAI team. Replies come back to your inbox.
          </p>
        </div>

        {result && (
          <p className="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs"
            style={result.ok
              ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }
              : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            {result.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                       : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />}
            {result.text}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
        <button type="button" onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5">
          {result?.ok ? 'Close' : 'Cancel'}
        </button>
        <button type="button" onClick={() => void send()}
          disabled={sending || !subject.trim() || !message.trim() || result?.ok === true}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: '#e94560' }}>
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending</> : <>Send message</>}
        </button>
      </div>
    </>
  )
}

export default function ContactOwnerDialog({
  target, onClose,
}: { target: ContactTarget | null; onClose: () => void }) {
  const [templateId, setTemplateId] = useState('unreachable')
  if (!target) return null
  const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: 'rgba(2,6,15,0.75)' }}
      onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl" style={{ background: '#161b27', border: '1px solid #1e2a3a' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: '#1e2a3a' }}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <Mail className="h-4 w-4" style={{ color: '#e94560' }} /> Message the owner
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {target.name} · {target.ownerEmail ?? 'no address on the claiming account'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-4 pt-5">
          {TEMPLATES.map(t => (
            <button key={t.id} type="button" onClick={() => setTemplateId(t.id)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition"
              style={t.id === templateId
                ? { background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.4)', color: '#f87171' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2a3a', color: '#94a3b8' }}>
              {t.label}
            </button>
          ))}
        </div>

        <Composer key={`${target.id}:${templateId}`} target={target} template={template} onClose={onClose} />
      </div>
    </div>
  )
}
