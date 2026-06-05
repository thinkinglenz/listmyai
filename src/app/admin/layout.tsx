'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, List, Shield, Users, FileWarning,
  Bot, LogOut, Menu, ChevronRight, Zap, Lock, Eye, EyeOff, CreditCard, BarChart3, Send, BookOpen,
} from 'lucide-react'

// ─── Admin password + Google Authenticator 2FA gate ─────────────────────────
const ADMIN_PASSWORD = 'lmai@admin2026'
const SESSION_KEY    = 'lmai_admin_auth'
const REMEMBER_KEY   = 'lmai_admin_remember'
const SETUP_KEY      = 'lmai_totp_setup_done'
const REMEMBER_DAYS  = 30

function isTrustedBrowser(): boolean {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return false
    const { token, expiresAt } = JSON.parse(raw)
    return !!token && Date.now() < expiresAt
  } catch { return false }
}

function trustBrowser() {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({
    token,
    expiresAt: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000,
  }))
}

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [step, setStep]       = useState<'password' | 'totp' | 'setup'>('password')
  const [pw, setPw]           = useState('')
  const [code, setCode]       = useState('')
  const [show, setShow]       = useState(false)
  const [error, setError]     = useState('')
  const [shake, setShake]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)
  const [qrUrl, setQrUrl]     = useState('')

  function triggerShake() {
    setShake(true); setTimeout(() => setShake(false), 500)
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== ADMIN_PASSWORD) {
      setError('Incorrect password.'); setPw(''); triggerShake(); return
    }
    setError('')
    // Check if TOTP has been set up in this browser before
    const setupDone = localStorage.getItem(SETUP_KEY) === '1'
    if (!setupDone) {
      // First time — show QR code setup
      fetch('/api/admin/totp')
        .then(r => r.json())
        .then(d => { setQrUrl(d.qr); setStep('setup') })
    } else {
      setStep('totp')
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/admin/totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.verified) {
      localStorage.setItem(SETUP_KEY, '1')
      if (remember) trustBrowser()
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setError(data.error ?? 'Incorrect code.'); setCode(''); triggerShake()
    }
  }

  const stepColor = step === 'password' ? '#e94560' : '#16a34a'

  return (
    <div className="flex min-h-screen items-center justify-center p-4"
      style={{ background: '#0d1117' }}>
      <div className={`w-full max-w-sm rounded-2xl border p-8 transition-all ${shake ? 'animate-pulse' : ''}`}
        style={{ borderColor: '#1e2a3a', background: '#161b27' }}>

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: stepColor }}>
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-white">
            {step === 'password' ? 'Admin Access' : step === 'setup' ? 'Set Up 2FA' : 'Two-Factor Auth'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 'password' && 'Enter the admin password to continue'}
            {step === 'setup'    && 'Scan the QR code with Google Authenticator'}
            {step === 'totp'     && 'Open Google Authenticator and enter the code'}
          </p>
        </div>

        {/* Step 1 — Password */}
        {step === 'password' && (
          <form onSubmit={submitPassword} className="space-y-4">
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={pw}
                onChange={e => { setPw(e.target.value); setError('') }}
                placeholder="Admin password" autoFocus
                className="w-full rounded-xl border py-3 pl-4 pr-10 text-sm text-white placeholder-slate-600 outline-none"
                style={{ borderColor: error ? '#ef4444' : '#1e2a3a', background: '#0d1117' }} />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit"
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Continue →
            </button>
          </form>
        )}

        {/* Step 2a — First-time QR setup */}
        {step === 'setup' && (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <p className="text-xs font-semibold text-white mb-1">Option A — Scan QR code</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open Google Authenticator → tap <strong className="text-white">+</strong> → <strong className="text-white">Scan QR code</strong> → point at the code below (use a second device)
              </p>
            </div>

            {qrUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="TOTP QR Code" className="rounded-xl"
                  width={260} height={260} />
              </div>
            )}

            {/* Manual entry key — for when scanning isn't possible */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <p className="text-xs font-semibold text-white mb-1">Option B — Enter key manually</p>
              <p className="text-xs text-slate-400 mb-2">
                Open Google Authenticator → tap <strong className="text-white">+</strong> → <strong className="text-white">Enter a setup key</strong> → use these details:
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#0d1117' }}>
                  <span className="text-slate-500">Account name</span>
                  <span className="font-mono font-bold text-white">ListmyAI Admin</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#0d1117' }}>
                  <span className="text-slate-500">Key</span>
                  <span className="font-mono font-bold text-green-400 tracking-wider select-all">56N56OEHAZZUCV2VKA4K</span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#0d1117' }}>
                  <span className="text-slate-500">Type</span>
                  <span className="font-mono text-white">Time-based</span>
                </div>
              </div>
            </div>
            <form onSubmit={submitCode} className="space-y-3">
              <input type="text" inputMode="numeric" maxLength={6}
                value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="Enter code to confirm setup" autoFocus
                className="w-full rounded-xl border py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-slate-700 outline-none"
                style={{ borderColor: error ? '#ef4444' : '#1e2a3a', background: '#0d1117' }} />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="rounded accent-green-500" />
                Remember this browser for {REMEMBER_DAYS} days
              </label>
              <button type="submit" disabled={loading || code.length !== 6}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#16a34a' }}>
                {loading ? 'Verifying…' : 'Confirm Setup & Enter'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2b — TOTP code entry */}
        {step === 'totp' && (
          <form onSubmit={submitCode} className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-xl p-4"
              style={{ background: '#0d1117', border: '1px solid #1e2a3a' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(22,163,74,0.15)' }}>
                <span className="text-xl">🔐</span>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Open <strong className="text-white">Google Authenticator</strong> and enter<br />the code for <strong className="text-white">ListmyAI Admin</strong>
              </p>
            </div>
            <input type="text" inputMode="numeric" maxLength={6}
              value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="000000" autoFocus
              className="w-full rounded-xl border py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-slate-700 outline-none"
              style={{ borderColor: error ? '#ef4444' : '#1e2a3a', background: '#0d1117' }} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                className="rounded accent-green-500" />
              Remember this browser for {REMEMBER_DAYS} days
            </label>
            <button type="submit" disabled={loading || code.length !== 6}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#16a34a' }}>
              {loading ? 'Verifying…' : 'Verify & Enter Admin Panel'}
            </button>
            <button type="button" onClick={() => { setStep('password'); setCode(''); setError('') }}
              className="w-full text-xs text-slate-600 hover:text-slate-400 transition">
              ← Back
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-slate-600">
          Not an admin?{' '}
          <Link href="/" className="hover:underline" style={{ color: '#e94560' }}>Go back to site</Link>
        </p>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/listings', label: 'Listings', icon: List, badgeKey: 'listings' as const },
  { href: '/admin/claims', label: 'Claim Requests', icon: Shield, badgeKey: 'claims' as const },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/dmca', label: 'DMCA Queue', icon: FileWarning, badgeKey: 'dmca' as const },
  { href: '/admin/outreach', label: 'Outreach', icon: Send },
  { href: '/admin/compare-analytics', label: 'Compare Analytics', icon: BarChart3 },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen, badgeKey: 'blog_comments' as const },
  { href: '/admin/scraper', label: 'Scraper', icon: Bot },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const pathname = usePathname()

  useEffect(() => {
    // Already authed this session OR browser is trusted for 30 days
    if (sessionStorage.getItem(SESSION_KEY) === '1' || isTrustedBrowser()) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
    }
  }, [])

  // Fetch live badge counts
  useEffect(() => {
    if (!authed) return
    fetch('/api/admin/badges')
      .then(r => r.ok ? r.json() : {})
      .then(d => setBadges(d ?? {}))
      .catch(() => {})
  }, [authed, pathname])

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  function isActive(item: typeof NAV_ITEMS[0]) {
    const p = pathname?.replace(/\/$/, '') || ''
    return item.exact ? p === item.href : p.startsWith(item.href)
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0d1117', color: '#e2e8f0' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b px-5" style={{ borderColor: '#1e2a3a' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#e94560' }}>
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">ListmyAI</p>
            <p className="text-xs" style={{ color: '#e94560' }}>Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isActive(item)
            const count = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? 'rgba(233,69,96,0.12)' : 'transparent',
                  color: active ? '#e94560' : '#94a3b8',
                }}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ background: '#e94560' }}>
                    {count}
                  </span>
                )}
                {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3" style={{ borderColor: '#1e2a3a' }}>
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: '#e94560' }}>A</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Super Admin</p>
              <p className="truncate text-xs text-slate-500">lmai@admin2026</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:text-white">
            <LogOut className="h-4 w-4" /> Back to site
          </Link>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10">
            <LogOut className="h-4 w-4" /> Log out of admin
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b px-4 lg:px-6" style={{ borderColor: '#1e2a3a' }}>
          <button className="text-slate-500 transition hover:text-white lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span className="rounded-full border px-3 py-1 text-xs font-medium text-amber-400"
            style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)' }}>
            🔒 Admin Mode
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
