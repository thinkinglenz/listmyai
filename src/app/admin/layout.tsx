'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, List, Shield, Users, FileWarning,
  Bot, LogOut, Menu, ChevronRight, Zap, Lock, Eye, EyeOff, CreditCard, BarChart3,
} from 'lucide-react'

// ─── Admin password gate ────────────────────────────────────────────────────
const ADMIN_PASSWORD = 'lmai@admin2026'
const SESSION_KEY = 'lmai_admin_auth'

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function attempt(e: React.FormEvent) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setError(true)
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4"
      style={{ background: '#0d1117' }}>
      <div className={`w-full max-w-sm rounded-2xl border p-8 ${shake ? 'animate-pulse' : ''}`}
        style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: '#e94560' }}>
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the admin password to continue</p>
        </div>
        <form onSubmit={attempt} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setError(false) }}
              placeholder="Admin password"
              autoFocus
              className="w-full rounded-xl border py-3 pl-4 pr-10 text-sm text-white placeholder-slate-600 outline-none"
              style={{
                borderColor: error ? '#ef4444' : '#1e2a3a',
                background: '#0d1117',
              }}
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">Incorrect password. Try again.</p>}
          <button type="submit"
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560' }}>
            Enter Admin Panel
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-600">
          Not an admin? <Link href="/" className="hover:underline" style={{ color: '#e94560' }}>Go back to site</Link>
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
  { href: '/admin/compare-analytics', label: 'Compare Analytics', icon: BarChart3 },
  { href: '/admin/scraper', label: 'Scraper', icon: Bot },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const pathname = usePathname()

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setAuthed(true)
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
