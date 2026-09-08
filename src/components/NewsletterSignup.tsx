'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'

// Stored verbatim alongside the opt-in, so there is a record of exactly what
// was agreed to rather than just a boolean.
const CONSENT_TEXT =
  'I agree to receive marketing emails from ListmyAI about AI tools, deals and services. ' +
  'I can unsubscribe at any time.'

export default function NewsletterSignup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', consent: false })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consentText: CONSENT_TEXT }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10" style={{ color: '#10b981' }} />
        <p className="font-bold text-white">You&apos;re on the list</p>
        <p className="mt-1.5 text-sm text-slate-400">Check your inbox for a confirmation.</p>
      </div>
    )
  }

  const field = 'w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2'
  const fieldStyle = { borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties

  return (
    <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(233,69,96,0.12)' }}>
          <Mail className="h-5 w-5" style={{ color: '#e94560' }} />
        </div>
        <div>
          <h3 className="font-bold text-white">New AI tools, weekly</h3>
          <p className="text-xs text-slate-500">Tools, deals and deep-dives. No more than twice a week.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Your name" className={field} style={fieldStyle} />
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="you@company.com" className={field} style={fieldStyle} />
        </div>

        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
          placeholder="Mobile number (optional)" className={field} style={fieldStyle} />

        {/* Unticked by default — a pre-ticked box is not valid consent. */}
        <label className="flex cursor-pointer items-start gap-2.5 pt-1">
          <input type="checkbox" checked={form.consent}
            onChange={e => setForm({ ...form, consent: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-red-500" />
          <span className="text-xs leading-relaxed text-slate-400">{CONSENT_TEXT}</span>
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={state === 'sending' || !form.consent}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ background: '#e94560' }}>
          {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
          Subscribe
        </button>

        <p className="text-center text-[11px] text-slate-600">
          We store your details to send these emails and nothing else. See our{' '}
          <a href="/privacy-policy" className="underline">privacy policy</a>.
        </p>
      </form>
    </div>
  )
}
