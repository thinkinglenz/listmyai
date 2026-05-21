'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase sends the user here with a hash fragment containing the access token
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Also check if already in recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) {
        setError(updateErr.message)
      } else {
        setDone(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  if (done) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-2xl font-black text-white">Password Updated</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your password has been reset. Redirecting to login...
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: '#e94560' }}>
            Go to login now
          </Link>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-black text-white">Loading...</h1>
          <p className="mt-2 text-sm text-slate-400">Verifying your reset link...</p>
          <p className="mt-4 text-xs text-slate-500">
            If this takes too long, your link may have expired.{' '}
            <Link href="/forgot-password" className="hover:underline" style={{ color: '#e94560' }}>Request a new one</Link>
          </p>
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
            <Lock className="h-6 w-6" style={{ color: '#e94560' }} />
          </div>
          <h1 className="text-2xl font-black text-white">Set New Password</h1>
          <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account</p>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" required minLength={6}
                  className="w-full rounded-xl border bg-white/4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: '#1e2a3a', paddingLeft: '2.5rem', paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter your password" required
                  className="w-full rounded-xl border bg-white/4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition"
                  style={{ borderColor: '#1e2a3a', paddingLeft: '2.5rem' }} />
              </div>
            </div>
            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
            )}
            <button type="submit" disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.2)' }}>
              {saving ? 'Updating…' : 'Update Password'} {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
