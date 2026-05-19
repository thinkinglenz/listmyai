'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'

export default function RegisterPage() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)

  const inputCls = 'w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition'
  const inputStyle = { borderColor: '#1e2a3a' }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f97316', '#22c55e', '#22c55e']

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('verify')
  }

  if (step === 'verify') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Mail className="h-8 w-8" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-2xl font-black text-white">Check your email</h1>
          <p className="mt-2 text-sm text-slate-400">
            We sent a verification link to <span className="font-semibold text-white">{email}</span>
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Click the link to activate your account. You can close this tab.
          </p>
          <div className="mt-6 rounded-2xl border p-4 text-left" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-xs text-slate-500">Didn&apos;t receive it?</p>
            <button className="mt-1 text-sm font-semibold hover:underline" style={{ color: '#e94560' }}>
              Resend verification email
            </button>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#e94560' }}>Back to login</Link>
          </p>
        </div>
      </div>
    )
  }

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
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="sr-only" required />
                <div className="flex h-4 w-4 items-center justify-center rounded"
                  style={{ background: agreed ? '#e94560' : 'transparent', border: `1px solid ${agreed ? '#e94560' : '#334155'}` }}>
                  {agreed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs text-slate-400">
                I agree to the{' '}
                <Link href="/terms" className="hover:underline" style={{ color: '#e94560' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="hover:underline" style={{ color: '#e94560' }}>Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={!agreed}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.2)' }}>
              Create Account <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: '#1e2a3a' }} />
            <span className="text-xs text-slate-600">or</span>
            <div className="h-px flex-1" style={{ background: '#1e2a3a' }} />
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            style={{ borderColor: '#1e2a3a' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: '#e94560' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
