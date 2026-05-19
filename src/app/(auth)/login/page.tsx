'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const inputCls = 'w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition'
  const inputStyle = { borderColor:'#1e2a3a' }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{background:'rgba(233,69,96,0.15)',border:'1px solid rgba(233,69,96,0.2)'}}>
            <Sparkles className="h-6 w-6" style={{color:'#e94560'}} />
          </div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to manage your AI listings</p>
        </div>

        <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  className={inputCls} style={{...inputStyle, paddingLeft:'2.5rem'}} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{color:'#e94560'}}>Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className={inputCls} style={{...inputStyle, paddingLeft:'2.5rem', paddingRight:'2.5rem'}} />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{background:'#e94560',boxShadow:'0 0 20px rgba(233,69,96,0.2)'}}>
              Log In <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{background:'#1e2a3a'}} />
            <span className="text-xs text-slate-600">or</span>
            <div className="h-px flex-1" style={{background:'#1e2a3a'}} />
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            style={{borderColor:'#1e2a3a'}}>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold hover:underline" style={{color:'#e94560'}}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
