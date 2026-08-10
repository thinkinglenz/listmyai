'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Plus, Eye, Star, TrendingUp, Tag, Settings,
  ExternalLink, CheckCircle, Clock, AlertCircle, ChevronRight,
  BarChart3, Users, Zap, Edit, Globe, Shield, Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview' | 'listings' | 'analytics' | 'promos' | 'settings'

interface Listing {
  id: string
  name: string
  slug: string
  category_name?: string
  status: 'active' | 'pending' | 'rejected' | 'claimed' | 'verified'
  view_count: number
  upvotes: number
  rating_avg: number
  rating_count: number
  click_count: number
  is_featured: boolean
  created_at: string
}

interface ClaimRequest {
  id: string
  status: 'pending' | 'pending_verification' | 'approved' | 'rejected' | 'expired'
  rejection_reason: string | null
  created_at: string
  tool_name: string
  tool_slug: string | null
}

interface UserProfile {
  full_name: string
  email: string
  company?: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  active:   { label: 'Active',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   Icon: CheckCircle },
  claimed:  { label: 'Claimed',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  Icon: Shield },
  verified: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.1)',  Icon: CheckCircle },
  pending:  { label: 'Pending',  color: '#f97316', bg: 'rgba(249,115,22,0.1)',  Icon: Clock },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   Icon: AlertCircle },
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
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Form state for settings
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, display_name, company, created_at')
        .eq('id', user.id)
        .maybeSingle()

      const userProfile: UserProfile = {
        full_name: prof?.full_name || prof?.display_name || user.user_metadata?.full_name || 'User',
        email: user.email ?? '',
        company: prof?.company ?? '',
        created_at: prof?.created_at ?? user.created_at,
      }
      setProfile(userProfile)
      setEditName(userProfile.full_name)
      setEditCompany(userProfile.company ?? '')

      // Load user's claimed/submitted tools
      // Try combined query first; fall back to claimed_by only if submitted_by column doesn't exist
      let { data: tools, error: toolsErr } = await supabase
        .from('ai_tools')
        .select('id, name, slug, status, view_count, upvotes, rating_avg, rating_count, click_count, is_featured, created_at, category_id, categories(name)')
        .or(`submitted_by.eq.${user.id},claimed_by.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50)

      // Fallback: if submitted_by column doesn't exist, query only claimed_by
      if (toolsErr) {
        const fallback = await supabase
          .from('ai_tools')
          .select('id, name, slug, status, view_count, upvotes, rating_avg, rating_count, click_count, is_featured, created_at, category_id, categories(name)')
          .eq('claimed_by', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        tools = fallback.data
      }

      if (tools && tools.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setListings(tools.map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          category_name: t.categories?.name ?? 'Other',
          status: t.status ?? 'pending',
          view_count: t.view_count ?? 0,
          upvotes: t.upvotes ?? 0,
          rating_avg: t.rating_avg ?? 0,
          rating_count: t.rating_count ?? 0,
          click_count: t.click_count ?? 0,
          is_featured: t.is_featured ?? false,
          created_at: t.created_at,
        })))
      }

      // Claim requests, so a pending or rejected claim is visible here rather
      // than only in the email we sent.
      const { data: claims } = await supabase
        .from('claim_requests')
        .select('id, status, rejection_reason, created_at, ai_tools(name, slug)')
        .order('created_at', { ascending: false })
        .limit(20)

      if (claims) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setClaimRequests(claims.map((c: any) => ({
          id: c.id,
          status: c.status,
          rejection_reason: c.rejection_reason ?? null,
          created_at: c.created_at,
          tool_name: (Array.isArray(c.ai_tools) ? c.ai_tools[0]?.name : c.ai_tools?.name) ?? 'a listing',
          tool_slug: (Array.isArray(c.ai_tools) ? c.ai_tools[0]?.slug : c.ai_tools?.slug) ?? null,
        })))
      }

      setLoading(false)
    }

    load()
  }, [router])

  async function saveProfile() {
    setSavingProfile(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ full_name: editName, company: editCompany })
        .eq('id', user.id)
      setProfile(prev => prev ? { ...prev, full_name: editName, company: editCompany } : prev)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    }
    setSavingProfile(false)
  }

  // Compute stats from real data
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0)
  const totalUpvotes = listings.reduce((s, l) => s + l.upvotes, 0)
  const avgRating = listings.filter(l => l.rating_count > 0).length > 0
    ? listings.reduce((s, l) => s + l.rating_avg * l.rating_count, 0) / listings.reduce((s, l) => s + l.rating_count, 0)
    : 0
  const totalReviews = listings.reduce((s, l) => s + l.rating_count, 0)
  const activeCount = listings.filter(l => ['active', 'claimed', 'verified'].includes(l.status)).length

  const navItems: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'overview',   label: 'Overview',   Icon: LayoutDashboard },
    { id: 'listings',   label: 'My Listings', Icon: Globe },
    { id: 'analytics',  label: 'Analytics',  Icon: BarChart3 },
    { id: 'promos',     label: 'Promotions', Icon: Tag },
    { id: 'settings',   label: 'Settings',   Icon: Settings },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
            </p>
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

          {/* Main content */}
          <div className="min-w-0 flex-1">

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard icon={Eye}        label="Total Views"  value={totalViews.toLocaleString()} sub="All listings" color="#e94560" />
                  <StatCard icon={TrendingUp}  label="Upvotes"      value={totalUpvotes}                sub="All time"    color="#a855f7" />
                  <StatCard icon={Star}        label="Avg Rating"   value={avgRating > 0 ? avgRating.toFixed(1) : '—'} sub={totalReviews > 0 ? `From ${totalReviews} reviews` : 'No reviews yet'} color="#f59e0b" />
                  <StatCard icon={Users}       label="Listings"     value={listings.length}             sub={`${activeCount} active`} color="#22c55e" />
                </div>

                {listings.length === 0 && (
                  <div className="rounded-2xl border p-10 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
                    <Plus className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                    <p className="font-semibold text-slate-400">No listings yet</p>
                    <p className="mt-1 text-sm text-slate-600">Submit your first AI tool — it&apos;s free for 6 months.</p>
                    <Link href="/submit"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      style={{ background: '#e94560' }}>
                      <Plus className="h-4 w-4" /> Submit Your Tool
                    </Link>
                  </div>
                )}

                {/* Claim requests that need the claimant to do something, or
                    that were turned down and need explaining. */}
                {claimRequests.filter(c => c.status === 'rejected' || c.status === 'pending').length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 font-bold text-white">Your Claim Requests</h2>
                    <div className="space-y-3">
                      {claimRequests
                        .filter(c => c.status === 'rejected' || c.status === 'pending')
                        .map(claim => {
                          const rejected = claim.status === 'rejected'
                          return (
                            <div
                              key={claim.id}
                              className="rounded-2xl border p-4"
                              style={{
                                borderColor: rejected ? 'rgba(239,68,68,0.25)' : '#1e2a3a',
                                background: rejected ? 'rgba(239,68,68,0.05)' : '#161b27',
                              }}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-white">{claim.tool_name}</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={
                                    rejected
                                      ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                                      : { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
                                  }
                                >
                                  {rejected ? 'Not approved' : 'Awaiting review'}
                                </span>
                              </div>

                              {rejected && claim.rejection_reason && (
                                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                                  {claim.rejection_reason}
                                </p>
                              )}

                              {rejected && claim.tool_slug && (
                                <Link
                                  href={`/tools/${claim.tool_slug}`}
                                  className="mt-3 inline-block text-xs font-semibold hover:underline"
                                  style={{ color: '#e94560' }}
                                >
                                  Claim again from your company email →
                                </Link>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {listings.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-bold text-white">Your Listings</h2>
                      <button onClick={() => setTab('listings')} className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#e94560' }}>
                        View all <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {listings.slice(0, 5).map(listing => {
                        const s = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.pending
                        return (
                          <div key={listing.id} className="flex items-center gap-4 rounded-2xl border p-4 transition hover:border-slate-700"
                            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                              style={{ background: '#e94560' }}>
                              {listing.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white">{listing.name}</p>
                              <p className="text-xs text-slate-500">{listing.category_name}</p>
                            </div>
                            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{ background: s.bg, color: s.color }}>
                              <s.Icon className="h-3 w-3" /> {s.label}
                            </span>
                            <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.view_count}</span>
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
                )}

                {/* Contact / Advertise Card */}
                <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white mb-1">Questions or Interested in Advertising?</h3>
                      <p className="text-sm text-slate-400">Get in touch about sponsorships, partnerships, or any other inquiries.</p>
                    </div>
                    <Link href="/contact"
                      className="flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 whitespace-nowrap"
                      style={{ background: '#e94560' }}>
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── LISTINGS ── */}
            {tab === 'listings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">My Listings ({listings.length})</h2>
                  <Link href="/submit"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                    style={{ background: '#e94560' }}>
                    <Plus className="h-3.5 w-3.5" /> Add listing
                  </Link>
                </div>
                {listings.length === 0 && (
                  <div className="rounded-2xl border p-10 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
                    <Globe className="mx-auto mb-3 h-10 w-10 text-slate-700" />
                    <p className="font-semibold text-slate-400">No listings yet</p>
                    <p className="mt-1 text-sm text-slate-600">Submit your AI tool to get started.</p>
                  </div>
                )}
                {listings.map(listing => {
                  const s = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.pending
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
                            {listing.is_featured && (
                              <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                <Zap className="h-3 w-3" /> Featured
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">{listing.category_name}</p>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.view_count} views</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{listing.upvotes} upvotes</span>
                            {listing.rating_count > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" />{listing.rating_avg.toFixed(1)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Link href={`/dashboard/edit/${listing.slug}`}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                            style={{ borderColor: '#1e2a3a' }}>
                            <Edit className="h-3 w-3" /> Edit
                          </Link>
                          <Link href={`/tools/${listing.slug}`}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                            style={{ borderColor: '#1e2a3a' }}>
                            <ExternalLink className="h-3 w-3" /> View
                          </Link>
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
                  <StatCard icon={Eye}        label="Total Views"    value={totalViews.toLocaleString()} color="#e94560" />
                  <StatCard icon={TrendingUp}  label="Total Upvotes"  value={totalUpvotes}                color="#a855f7" />
                  <StatCard icon={Star}        label="Total Reviews"  value={totalReviews}                color="#f59e0b" />
                  <StatCard icon={Users}       label="Click-throughs" value={listings.reduce((s, l) => s + l.click_count, 0)} color="#22c55e" />
                </div>
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                  <p className="font-semibold text-slate-400">Detailed charts coming soon</p>
                  <p className="mt-1 text-sm text-slate-600">Detailed analytics with referrer data, geographic breakdown, and conversion tracking will be available soon.</p>
                </div>
              </div>
            )}

            {/* ── PROMOS ── */}
            {tab === 'promos' && (
              <div className="space-y-6">
                <h2 className="font-bold text-white">Promotions</h2>
                <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <Tag className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                  <p className="font-semibold text-slate-400">No promotions yet</p>
                  <p className="mt-1 text-sm text-slate-600">Add coupon codes, free trial offers, or discounts to boost visibility on the Deals page.</p>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === 'settings' && profile && (
              <div className="space-y-6">
                <h2 className="font-bold text-white">Account Settings</h2>

                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <h3 className="mb-4 font-semibold text-white">Profile</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Full name</label>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition"
                        style={{ borderColor: '#1e2a3a' }} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                      <input type="email" value={profile.email} disabled
                        className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        style={{ borderColor: '#1e2a3a' }} />
                      <p className="mt-1 text-xs text-slate-600">Email cannot be changed here</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Company</label>
                      <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition"
                        style={{ borderColor: '#1e2a3a' }} />
                    </div>
                    <button onClick={saveProfile} disabled={savingProfile}
                      className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#e94560' }}>
                      {savingProfile ? 'Saving…' : profileSaved ? '✓ Saved' : 'Save changes'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <p className="text-xs text-slate-500">
                    Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
