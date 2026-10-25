'use client'

// "Tell us what's wrong" under every editorial.
//
// The page claims these pieces are not edited by the companies they cover but
// that corrections are welcome. This is what makes that claim true rather than
// decorative.
import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'

export default function CorrectionForm({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/editorial/correction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, email, message }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong'); setState('idle'); return }
      setState('sent')
    } catch {
      setError('Could not reach us — please try again')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <p className="mt-6 flex items-center gap-2 text-sm text-emerald-400">
        <Check className="h-4 w-4" /> Thanks — we read every one of these and will reply to you.
      </p>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
        style={{ color: '#e94560' }}>
        <AlertCircle className="h-4 w-4" /> Something wrong here? Tell us
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border p-5"
      style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <p className="text-sm text-slate-400">
        Corrections go to a person, not a form queue. Tell us what is wrong and what the
        correct version is, and we will fix the page or explain why we have left it.
      </p>
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email, so we can reply"
        className="mt-4 w-full rounded-lg border px-3 py-2 text-sm text-white placeholder:text-slate-600"
        style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
      <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)}
        placeholder="What have we got wrong?"
        className="mt-3 w-full rounded-lg border px-3 py-2 text-sm text-white placeholder:text-slate-600"
        style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={state === 'sending'}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          style={{ background: '#e94560' }}>
          {state === 'sending' ? 'Sending…' : 'Send correction'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400">Cancel</button>
      </div>
    </form>
  )
}
