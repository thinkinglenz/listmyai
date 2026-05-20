'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [authLoading, user, router])

  const inputCls = 'w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition'
  const inputStyle = { borderColor: '#1e2a3a' }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f97316', '#22c55e', '#22c55e']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/login?verified=1`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // If session exists, email confirmation is off → auto-login
    if (data.session) {
      router.push('/dashboard')
      return
    }

    // Email confirmation is on → show verification screen
    setEmailSent(true)
    setLoading(false)
  }

  // ─── Email verification sent screen ────────────────────────────────────
  if (emailSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Mail className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Check your email</h1>
          <p className="text-sm text-slate-400 mb-6">
            We sent a verification link to <strong className="text-white">{email}</strong>.
            Click the link in the email to activate your account.
          </p>

          <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-white mb-1">What to do next:</p>
                <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                  <li>Open your email inbox</li>
                  <li>Click the verification link from ListmyAI</li>
                  <li>You&apos;ll be redirected to log in</li>
                </ol>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button
              onClick={() => { setEmailSent(false); setError('') }}
              className="font-semibold hover:underline" style={{ color: '#e94560' }}>
              try again
            </button>
          </p>

          <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: '#e94560' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // ─── Registration form ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.2)' }}>
            <Sparkles className="h-6 w-6" style={{ color: '#e94560' }} />
          </div>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">List your AI tool — free for 6 months</p>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith" required autoComplete="name"
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required autoComplete="new-password" minLength={8}
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem', paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor[strength] : '#1e2a3a' }} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <div className="relative mt-0.5 flex-shrink-0">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" required />
                <div className="flex h-4 w-4 items-center justify-center rounded"
                  style={{ background: agreed ? '#e94560' : 'transparent', border: `1px solid ${agreed ? '#e94560' : '#334155'}` }}>
                  {agreed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                I agree to the{' '}
                <Link href="/terms" className="hover:underline" style={{ color: '#e94560' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy-policy" className="hover:underline" style={{ color: '#e94560' }}>Privacy Policy</Link>
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={!agreed || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.2)' }}>
              {loading ? 'Creating account…' : <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: '#e94560' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
