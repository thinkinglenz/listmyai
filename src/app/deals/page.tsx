import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Gift, Tag, Zap, Percent, BadgeCheck, ExternalLink, Sparkles } from 'lucide-react'
import CopyCodeButton from '@/components/promo/CopyCodeButton'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'AI Deals, Promo Codes & Free Trials',
  description: 'Save money on AI tools with exclusive promo codes, free trials, lifetime deals, and free tiers. Verified discounts on the best AI software — up to 50% off.',
  openGraph: {
    title: 'AI Deals & Promo Codes — Save on the Best AI Tools',
    description: 'Exclusive promo codes, free trials, and lifetime deals on AI tools. Up to 50% off on chatbots, image generators, video tools, and more.',
    url: 'https://listmyai.com/deals',
  },
  alternates: { canonical: 'https://listmyai.com/deals' },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type DealType = 'all' | 'promo_code' | 'free_trial' | 'free' | 'freemium'

const DEAL_TABS: { key: DealType; label: string; icon: React.ReactNode }[] = [
  { key: 'all',        label: 'All Deals',    icon: <Gift className="h-4 w-4" /> },
  { key: 'promo_code', label: 'Promo Codes',  icon: <Tag className="h-4 w-4" /> },
  { key: 'free_trial', label: 'Free Trials',  icon: <Zap className="h-4 w-4" /> },
  { key: 'free',       label: 'Free Tools',   icon: <BadgeCheck className="h-4 w-4" /> },
  { key: 'freemium',   label: 'Freemium',     icon: <Percent className="h-4 w-4" /> },
]

interface Props { searchParams: Promise<{ type?: string }> }

export default async function DealsPage({ searchParams }: Props) {
  const { type = 'all' } = await searchParams
  const activeType = type as DealType

  type DealTool = {
    id: string; name: string; slug: string; logo_url?: string; website?: string
    tagline?: string; pricing_model?: string; starting_price?: string
    has_free_trial: boolean; trial_duration?: string
    promo_code?: string; promo_desc?: string
    categories?: { name: string }
  }

  const SELECT = 'id, name, slug, logo_url, website, tagline, pricing_model, starting_price, has_free_trial, trial_duration, promo_code, promo_desc, categories(name)'
  const STATUSES = ['active', 'approved', 'claimed', 'verified']

  // Query 1: ALL deals (for consistent stats across tabs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allToolsRaw } = await (supabase
    .from('ai_tools')
    .select(SELECT)
    .in('status', STATUSES)
    .or('promo_code.neq.,has_free_trial.eq.true,pricing_model.eq.free,pricing_model.eq.freemium,pricing_model.eq.free_trial')
    .order('upvotes', { ascending: false })
    .limit(200)) as any

  const allDeals = (allToolsRaw ?? []) as DealTool[]

  // Stats from ALL deals (never changes with tab)
  const promoCount = allDeals.filter(t => t.promo_code).length
  const trialCount = allDeals.filter(t => t.has_free_trial).length
  const freeCount = allDeals.filter(t => t.pricing_model === 'free').length
  const freemiumCount = allDeals.filter(t => t.pricing_model === 'freemium').length

  // Query 2: filtered deals for display
  let deals: DealTool[]
  if (activeType === 'all') {
    deals = allDeals
  } else if (activeType === 'promo_code') {
    deals = allDeals.filter(t => t.promo_code)
  } else if (activeType === 'free_trial') {
    deals = allDeals.filter(t => t.has_free_trial)
  } else if (activeType === 'free') {
    deals = allDeals.filter(t => t.pricing_model === 'free')
  } else if (activeType === 'freemium') {
    deals = allDeals.filter(t => t.pricing_model === 'freemium')
  } else {
    deals = allDeals
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
          style={{ borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" />
          {allDeals.length} deals available{activeType !== 'all' ? ` · showing ${deals.length}` : ''}
        </div>
        <h1 className="text-4xl font-black text-white">AI Deals & Free Tools</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Promo codes, free trials, and free AI tools — save money on the best AI tools.
        </p>
      </div>

      {/* Type filter tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {DEAL_TABS.map(dt => {
          const active = dt.key === activeType
          return (
            <a key={dt.key} href={`/deals${dt.key === 'all' ? '' : `?type=${dt.key}`}`}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
              style={{
                borderColor: active ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
                background: active ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? '#e94560' : '#94a3b8',
              }}>
              {dt.icon}{dt.label}
            </a>
          )
        })}
      </div>

      {/* Stats bar */}
      <div className="mb-8 flex flex-wrap justify-center gap-6 text-center">
        {[
          { n: allDeals.length, l: 'Total Deals' },
          { n: promoCount, l: 'Promo Codes' },
          { n: trialCount, l: 'Free Trials' },
          { n: freeCount + freemiumCount, l: 'Free / Freemium' },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border px-6 py-3 text-center" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-2xl font-black text-white">{s.n}</div>
            <div className="text-xs" style={{ color: '#64748b' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map(tool => (
          <DealCard key={tool.id} tool={tool} />
        ))}
      </div>

      {deals.length === 0 && (
        <div className="rounded-2xl border border-brand-border py-20 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-4xl">🎁</p>
          <p className="mt-3 font-semibold text-white">No deals in this category yet</p>
          <p className="mt-1 text-sm text-slate-500">Check back soon — new deals are added as tool owners claim their listings.</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-14 rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.05)' }}>
        <h2 className="text-xl font-bold text-white">Have a deal to share?</h2>
        <p className="mt-2 text-sm text-slate-400">Claim your listing and add your promo code — it&apos;s free.</p>
        <a href="/submit" className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: '#e94560' }}>
          Submit Your AI Tool
        </a>
      </div>
    </div>
  )
}

// ── Deal Card (server component) ──

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  free:       { label: 'Free',       cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  freemium:   { label: 'Freemium',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  free_trial: { label: 'Free Trial', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  subscription: { label: 'Subscription', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  pay_per_use: { label: 'Pay per Use', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  one_time:   { label: 'One-Time',   cls: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  enterprise: { label: 'Enterprise', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
}

function DealCard({ tool }: { tool: {
  id: string; name: string; slug: string; logo_url?: string; website?: string
  tagline?: string; pricing_model?: string; starting_price?: string
  has_free_trial: boolean; trial_duration?: string
  promo_code?: string; promo_desc?: string
  categories?: { name: string }
} }) {
  const badge = TYPE_BADGE[tool.pricing_model ?? ''] ?? TYPE_BADGE.free
  const hasPromo = tool.promo_code && tool.promo_code.length > 0

  return (
    <div className="group relative rounded-2xl border overflow-hidden transition-all hover:border-brand-red/30 hover:shadow-card-hover"
      style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-red to-red-400" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/tools/${tool.slug}`}
              className="text-base font-bold text-white hover:text-brand-red transition-colors line-clamp-1">
              {tool.name}
            </Link>
            {tool.categories?.name && (
              <p className="text-xs text-slate-500 mt-0.5">{tool.categories.name}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Tagline */}
        {tool.tagline && (
          <p className="mt-3 text-sm text-slate-400 leading-relaxed line-clamp-2">{tool.tagline}</p>
        )}

        {/* Deal highlights */}
        <div className="mt-4 space-y-2">
          {hasPromo && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed px-3 py-2"
                style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.05)' }}>
                <Tag className="h-4 w-4 shrink-0" style={{ color: '#e94560' }} />
                <code className="flex-1 text-sm font-bold tracking-wider" style={{ color: '#e94560' }}>{tool.promo_code}</code>
              </div>
              <CopyCodeButton code={tool.promo_code!} />
            </div>
          )}

          {tool.promo_desc && (
            <p className="text-xs text-slate-400 italic">{tool.promo_desc}</p>
          )}

          {tool.has_free_trial && (
            <div className="flex items-center gap-2 text-sm text-violet-400">
              <Zap className="h-3.5 w-3.5" />
              Free trial{tool.trial_duration ? ` — ${tool.trial_duration}` : ''}
            </div>
          )}

          {tool.starting_price && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Percent className="h-3.5 w-3.5 text-slate-500" />
              Starting at {tool.starting_price}
            </div>
          )}

          {tool.pricing_model === 'free' && !hasPromo && !tool.has_free_trial && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" />
              Completely free to use
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <Link href={`/tools/${tool.slug}`}
            className="text-xs text-slate-500 hover:text-white transition">
            View details →
          </Link>
          {tool.website && (
            <a href={tool.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ExternalLink className="h-3.5 w-3.5" /> Visit
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
