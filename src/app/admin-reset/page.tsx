'use client'

// Set a new admin password from an emailed link.
//
// Lives at /admin-reset, not /admin/reset: everything under /admin is gated by
// the admin layout's password screen, so a reset page there would be locked
// behind the very password it exists to replace.

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const MIN = 10

function ResetForm() {
  const token = useSearchParams().get('token') ?? ''
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pw.length < MIN) { setError(`Use at least ${MIN} characters.`); return }
    if (pw !== confirm) { setError('The two passwords do not match.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', token, password: pw }),
      })
      const data = await res.json()
      if (res.ok) setDone(true)
      else setError(data.error ?? 'Could not set the password.')
    } catch {
      setError('Network error. Try again.')
    }
    setBusy(false)
  }

  if (!token) return (
    <p className="text-sm text-slate-400">
      This page needs the link from the reset email. Open that link to continue.
    </p>
  )

  if (done) return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
      <p className="font-semibold text-white">Password changed</p>
      <p className="mt-1 text-sm text-slate-400">You can sign in with it now.</p>
      <Link href="/admin" className="mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white"
        style={{ background: '#e94560' }}>Go to admin →</Link>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={pw} autoFocus
          onChange={e => { setPw(e.target.value); setError('') }}
          placeholder="New password"
          className="w-full rounded-xl border py-3 pl-4 pr-10 text-sm text-white placeholder-slate-600 outline-none"
          style={{ borderColor: error ? '#ef4444' : '#1e2a3a', background: '#0d1117' }} />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <input type={show ? 'text' : 'password'} value={confirm}
        onChange={e => { setConfirm(e.target.value); setError('') }}
        placeholder="Confirm new password"
        className="w-full rounded-xl border py-3 px-4 text-sm text-white placeholder-slate-600 outline-none"
        style={{ borderColor: error ? '#ef4444' : '#1e2a3a', background: '#0d1117' }} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-slate-600">
        At least {MIN} characters. Pick something you will remember: there is no copy of it anywhere.
      </p>
      <button type="submit" disabled={busy}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: '#e94560' }}>
        {busy ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}

export default function AdminResetPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border p-8"
        style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: '#e94560' }}>
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">New admin password</h1>
          <p className="mt-1 text-sm text-slate-400">Choose a password for the admin panel</p>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
