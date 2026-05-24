'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Menu, X, Search, Plus, ShieldCheck, LogOut, User, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const SESSION_KEY = 'lmai_admin_auth'

const NAV_LINKS = [
  { href: '/directory',   label: 'Browse AI Tools' },
  { href: '/trending',    label: '📈 Trending' },
  { href: '/compare',     label: 'Compare' },
  { href: '/deals',       label: '🔥 Deals' },
  { href: '/categories',  label: 'Categories' },
  { href: '/advertise',   label: '📣 Advertise' },
]

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem(SESSION_KEY) === '1')
  }, [])

  function adminLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAdmin(false)
    setOpen(false)
  }

  async function handleSignOut() {
    await signOut()
    setShowUserMenu(false)
    setOpen(false)
    router.push('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-navy/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red shadow-glow-red">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            List<span className="text-brand-red">my</span>AI
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="text-sm text-slate-300 transition-colors hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/directory"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Search className="h-4 w-4" />
            Search
          </Link>

          {isAdmin && (
            <>
              <Link href="/admin"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition"
                style={{ color: '#e94560', background: 'rgba(233,69,96,0.08)' }}>
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Link>
              <button onClick={adminLogout}
                title="Exit admin session"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
                <LogOut className="h-4 w-4" /> Exit
              </button>
            </>
          )}

          {/* Auth-aware user section */}
          {!loading && (
            user ? (
              /* Logged in: show avatar + dropdown */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(m => !m)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: '#e94560' }}>
                    {initials}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                </button>

                {showUserMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border p-1.5 shadow-xl"
                      style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                      <div className="px-3 py-2 border-b mb-1" style={{ borderColor: '#1e2a3a' }}>
                        <p className="text-sm font-medium text-white truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link href="/dashboard" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link href="/submit" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                        <Plus className="h-4 w-4" /> Submit Tool
                      </Link>
                      <hr className="my-1" style={{ borderColor: '#1e2a3a' }} />
                      <button onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Not logged in: show Log in */
              <Link href="/login"
                className="rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:text-white">
                Log in
              </Link>
            )
          )}

          <Link href="/submit"
            className="flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 shadow-glow-red">
            <Plus className="h-4 w-4" />
            Submit AI
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(o => !o)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-brand-border bg-brand-navy px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                {l.label}
              </Link>
            ))}
            <hr className="my-2 border-brand-border" />

            {isAdmin && (
              <>
                <Link href="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold"
                  style={{ color: '#e94560', background: 'rgba(233,69,96,0.08)' }}>
                  <ShieldCheck className="h-4 w-4" /> Admin Panel
                </Link>
                <button onClick={adminLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" /> Exit Admin Session
                </button>
                <hr className="my-2 border-brand-border" />
              </>
            )}

            {/* Mobile auth section */}
            {!loading && (
              user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: '#e94560' }}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                  Log in
                </Link>
              )
            )}

            <Link href="/submit" onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />
              Submit Your AI Tool
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
