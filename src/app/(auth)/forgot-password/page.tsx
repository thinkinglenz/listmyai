'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (resetErr) {
        setError(resetErr.message)
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Mail className="h-8 w-8" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-2xl font-black text-white">Check your email</h1>
          <p className="mt-2 text-sm text-slate-400">
            If <span className="font-semibold text-white">{email}</span>{' '}has an account, you&apos;ll receive a reset link shortly.
          </p>
          <p className="mt-4 text-xs text-slate-500">Didn&apos;t receive it? Check your spam folder or try again.</p>
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => setSent(false)}
              className="rounded-xl border py-3 text-sm text-slate-300 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              Try a different email
            </button>
            <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: '#e94560' }}>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.2)' }}>
            <Sparkles className="h-6 w-6" style={{ color: '#e94560' }} />
          </div>
          <h1 className="text-2xl font-black text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: '#1e2a3a', paddingLeft: '2.5rem' }} />
              </div>
            </div>
            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
            )}
            <button type="submit" disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.2)' }}>
              {sending ? 'Sending…' : 'Send Reset Link'} {!sending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-white transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
