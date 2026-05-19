'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  LayoutDashboard, Plus, Eye, Star, TrendingUp, Tag, Settings,
  ExternalLink, CheckCircle, Clock, AlertCircle, ChevronRight,
  BarChart3, Users, Zap, Edit, Trash2, Globe, Shield, Bell,
} from 'lucide-react'

type Tab = 'overview' | 'listings' | 'analytics' | 'promos' | 'settings'

const MOCK_LISTINGS = [
  {
    id: '1', name: 'MyAI Tool', slug: 'myai-tool', category: 'Productivity',
    status: 'active' as const, views: 1284, upvotes: 47, rating: 4.6,
    claimed: true, verified: false, plan: 'free', trialEnds: '2026-11-18',
  },
  {
    id: '2', name: 'DataBot Pro', slug: 'databot-pro', category: 'Analytics',
    status: 'pending' as const, views: 0, upvotes: 0, rating: 0,
    claimed: true, verified: false, plan: 'free', trialEnds: '2026-11-18',
  },
]

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   Icon: CheckCircle },
  pending:  { label: 'Pending',  color: '#f97316', bg: 'rgba(249,115,22,0.1)',  Icon: Clock },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   Icon: AlertCircle },
  inactive: { label: 'Inactive', color: '#64748b', bg: 'rgba(100,116,139,0.1)', Icon: AlertCircle },
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-sm text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-600">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')

  const navItems: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'overview',   label: 'Overview',   Icon: LayoutDashboard },
    { id: 'listings',   label: 'My Listings', Icon: Globe },
    { id: 'analytics',  label: 'Analytics',  Icon: BarChart3 },
    { id: 'promos',     label: 'Promotions', Icon: Tag },
    { id: 'settings',   label: 'Settings',   Icon: Settings },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your AI tool listings</p>
          </div>
          <Link href="/submit"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.2)' }}>
            <Plus className="h-4 w-4" /> Submit Listing
          </Link>
        </div>

        <div className="flex gap-8">

          {/* Sidebar nav */}
          <nav className="hidden w-48 flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-1">
              {navItems.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
                  style={{
                    background: tab === id ? 'rgba(233,69,96,0.1)' : 'transparent',
                    color: tab === id ? '#e94560' : '#94a3b8',
                  }}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile tab bar */}
          <div className="mb-6 flex gap-1 overflow-x-auto lg:hidden">
            {navItems.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition"
                style={{
                  background: tab === id ? 'rgba(233,69,96,0.1)' : '#161b27',
                  color: tab === id ? '#e94560' : '#94a3b8',
                  border: `1px solid ${tab === id ? 'rgba(233,69,96,0.2)' : '#1e2a3a'}`,
                }}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard icon={Eye}       label="Total Views"  value="1,284" sub="All listings"    color="#e94560" />
                  <StatCard icon={TrendingUp} label="Upvotes"      value="47"    sub="This month"      color="#a855f7" />
                  <StatCard icon={Star}       label="Avg Rating"   value="4.6"   sub="From 12 reviews" color="#f59e0b" />
                  <StatCard icon={Users}      label="Listings"     value="2"     sub="1 active"        color="#22c55e" />
                </div>

                {/* Trial notice */}
                <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.05)' }}>
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: '#e94560' }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">Free listing — 6 months included</p>
                      <p className="mt-0.5 text-sm text-slate-400">Your listings are free until November 18, 2026. Upgrade anytime to unlock featured placement, priority support, and analytics.</p>
                    </div>
                    <button className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                      style={{ background: '#e94560' }}>Upgrade</button>
                  </div>
                </div>

                {/* Recent listings */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-white">Recent Listings</h2>
                    <button onClick={() => setTab('listings')} className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#e94560' }}>
                      View all <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_LISTINGS.map(listing => {
                      const s = STATUS_CONFIG[listing.status]
                      return (
                        <div key={listing.id} className="flex items-center gap-4 rounded-2xl border p-4 transition hover:border-slate-700"
                          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                            style={{ background: '#e94560' }}>
                            {listing.name[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white">{listing.name}</p>
                            <p className="text-xs text-slate-500">{listing.category}</p>
                          </div>
                          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ background: s.bg, color: s.color }}>
                            <s.Icon className="h-3 w-3" /> {s.label}
                          </span>
                          <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.views}</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{listing.upvotes}</span>
                          </div>
                          <Link href={`/tools/${listing.slug}`}
                            className="flex-shrink-0 text-slate-500 transition hover:text-white">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── LISTINGS ── */}
            {tab === 'listings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">My Listings ({MOCK_LISTINGS.length})</h2>
                  <Link href="/submit"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: '#e94560' }}>
                    <Plus className="h-3.5 w-3.5" /> Add listing
                  </Link>
                </div>
                {MOCK_LISTINGS.map(listing => {
                  const s = STATUS_CONFIG[listing.status]
                  return (
                    <div key={listing.id} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                          style={{ background: '#e94560' }}>
                          {listing.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white">{listing.name}</h3>
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ background: s.bg, color: s.color }}>
                              <s.Icon className="h-3 w-3" /> {s.label}
                            </span>
                            {listing.verified && (
                              <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                                <Shield className="h-3 w-3" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">{listing.category} · Free plan until {listing.trialEnds}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.views} views</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{listing.upvotes} upvotes</span>
                            {listing.rating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" />{listing.rating}</span>}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Link href={`/tools/${listing.slug}`}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                            style={{ borderColor: '#1e2a3a' }}>
                            <ExternalLink className="h-3 w-3" /> View
                          </Link>
                          <button className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                            style={{ borderColor: '#1e2a3a' }}>
                            <Edit className="h-3 w-3" /> Edit
                          </button>
                          <button className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition hover:bg-red-500/10"
                            style={{ borderColor: '#1e2a3a', color: '#ef4444' }}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {listing.status === 'pending' && (
                        <div className="mt-4 rounded-xl border px-4 py-3 text-xs text-slate-400" style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.05)' }}>
                          Your listing is under review. We&apos;ll notify you by email within 24–48 hours.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="font-bold text-white">Analytics</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard icon={Eye}       label="Views (30d)"  value="842"  color="#e94560" />
                  <StatCard icon={TrendingUp} label="Upvotes (30d)" value="31" color="#a855f7" />
                  <StatCard icon={Star}       label="Reviews (30d)" value="4"  color="#f59e0b" />
                  <StatCard icon={Users}      label="Click-thrus"  value="128" color="#22c55e" />
                </div>
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                  <p className="font-semibold text-slate-400">Detailed charts coming soon</p>
                  <p className="mt-1 text-sm text-slate-600">Upgrade to Pro to unlock full analytics including referrer data, geographic breakdown, and conversion tracking.</p>
                  <button className="mt-4 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{ background: '#e94560' }}>Upgrade to Pro</button>
                </div>
              </div>
            )}

            {/* ── PROMOS ── */}
            {tab === 'promos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">Promotions</h2>
                  <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: '#e94560' }}>
                    <Plus className="h-3.5 w-3.5" /> Add promo
                  </button>
                </div>
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <Tag className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                  <p className="font-semibold text-slate-400">No promotions yet</p>
                  <p className="mt-1 text-sm text-slate-600">Add coupon codes, free trial offers, or discounts to boost visibility on the Deals page.</p>
                  <button className="mt-4 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{ background: '#e94560' }}>Add your first promo</button>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === 'settings' && (
              <div className="space-y-6">
                <h2 className="font-bold text-white">Account Settings</h2>

                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <h3 className="mb-4 font-semibold text-white">Profile</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Full name', value: 'Jane Smith', type: 'text' },
                      { label: 'Email', value: 'jane@example.com', type: 'email' },
                      { label: 'Company', value: '', type: 'text', placeholder: 'Optional' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="mb-1.5 block text-sm font-medium text-slate-300">{f.label}</label>
                        <input type={f.type} defaultValue={f.value} placeholder={f.placeholder}
                          className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition"
                          style={{ borderColor: '#1e2a3a' }} />
                      </div>
                    ))}
                    <button className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ background: '#e94560' }}>Save changes</button>
                  </div>
                </div>

                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <h3 className="mb-4 font-semibold text-white">Notifications</h3>
                  <div className="space-y-3">
                    {[
                      'New reviews on my listings',
                      'Listing status changes',
                      'Trial expiry reminders',
                      'ListmyAI news & updates',
                    ].map(label => (
                      <label key={label} className="flex cursor-pointer items-center justify-between gap-4">
                        <span className="text-sm text-slate-300">{label}</span>
                        <div className="relative flex-shrink-0">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="h-5 w-9 rounded-full transition peer-checked:bg-red-500 peer-not-checked:bg-slate-700"
                            style={{ background: '#334155' }} />
                          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
                  <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-white">Danger zone</h3>
                      <p className="mt-1 text-sm text-slate-400">Permanently delete your account and all listings. This cannot be undone.</p>
                      <button className="mt-3 rounded-xl border px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                        style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
