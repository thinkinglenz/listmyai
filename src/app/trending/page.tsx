import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { TrendingUp, ExternalLink, Tag, Zap, BadgeCheck, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 1800 // 30 min

export const metadata: Metadata = {
  title: 'Top Trending AI Tools',
  description: 'A simple, transparent list of the top trending AI tools right now — ranked by community signal, with pricing, category, and direct links. Updated weekly.',
  openGraph: {
    title: 'Top Trending AI Tools — ListmyAI',
    description: 'A simple, transparent leaderboard of the most popular AI tools. No fluff. Updated weekly.',
    url: 'https://listmyai.com/trending',
  },
  alternates: { canonical: 'https://listmyai.com/trending' },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Tool = {
  id: string
  slug: string
  name: string
  tagline: string | null
  website: string | null
  logo_url: string | null
  pricing_model: string | null
  starting_price: string | null
  has_free_trial: boolean | null
  promo_code: string | null
  upvotes: number | null
  rating_avg: number | null
  rating_count: number | null
  is_featured: boolean | null
  categories?: { name: string } | { name: string }[] | null
}

const PRICING_LABEL: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  free_trial: 'Free trial',
  subscription: 'Paid',
  pay_per_use: 'Pay per use',
  one_time: 'One-time',
  enterprise: 'Enterprise',
}

const PRICING_TONE: Record<string, string> = {
  free: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  freemium: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  free_trial: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  subscription: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  pay_per_use: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  one_time: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  enterprise: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
}

function catName(c: Tool['categories']): string | null {
  if (!c) return null
  if (Array.isArray(c)) return c[0]?.name ?? null
  return c.name ?? null
}

export default async function TrendingPage() {
  const { data: toolsRaw } = await supabase
    .from('ai_tools')
    .select('id, slug, name, tagline, website, logo_url, pricing_model, starting_price, has_free_trial, promo_code, upvotes, rating_avg, rating_count, is_featured, categories(name)')
    .in('status', ['active', 'approved', 'claimed', 'verified'])
    .order('is_featured', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('rating_avg', { ascending: false })
    .limit(100)

  const tools = (toolsRaw ?? []) as Tool[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" /> Refreshed weekly
        </div>
        <h1 className="text-4xl font-black text-white sm:text-5xl">Top Trending AI Tools</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          A simple, transparent list of the AI tools getting the most attention right now —
          ranked by community signal, with pricing, category, and direct links.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Ranked by community upvotes</span>
        <span className="text-slate-700">·</span>
        <span>Updated weekly from public AI directories</span>
      </div>

      {/* List */}
      <ol className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
        {tools.map((t, i) => {
          const cat = catName(t.categories)
          const pmKey = (t.pricing_model ?? 'freemium').toLowerCase()
          const pmLabel = PRICING_LABEL[pmKey] ?? t.pricing_model ?? ''
          const pmTone = PRICING_TONE[pmKey] ?? PRICING_TONE.freemium
          const upvotes = t.upvotes ?? 0
          const rating = t.rating_avg ?? 0
          const rc = t.rating_count ?? 0
          return (
            <li key={t.id} className="border-b last:border-b-0 transition hover:bg-white/[0.02]"
              style={{ borderColor: '#1e2a3a' }}>
              <div className="flex items-center gap-4 px-4 py-3 sm:px-5">
                {/* Rank */}
                <div className="flex w-8 shrink-0 items-center justify-center font-black tabular-nums"
                  style={{ color: i < 3 ? '#e94560' : '#475569', fontSize: i < 3 ? '1.25rem' : '0.95rem' }}>
                  {i + 1}
                </div>

                {/* Logo */}
                <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-lg sm:block"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {t.logo_url ? (
                    <Image src={t.logo_url} alt="" width={40} height={40} className="h-10 w-10 object-contain p-1" unoptimized />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center text-base font-black text-slate-500">
                      {t.name?.[0] ?? '?'}
                    </div>
                  )}
                </div>

                {/* Name + tagline */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/tools/${t.slug}`} className="truncate font-bold text-white hover:text-red-400">
                      {t.name}
                    </Link>
                    {t.is_featured && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        <BadgeCheck className="h-2.5 w-2.5" /> Featured
                      </span>
                    )}
                  </div>
                  {t.tagline && (
                    <p className="truncate text-xs text-slate-400">{t.tagline}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:hidden">
                    {cat && <span>{cat}</span>}
                    <span className={`rounded-full border px-1.5 py-0.5 ${pmTone}`}>{pmLabel}</span>
                    {t.starting_price && <span>· from {t.starting_price}</span>}
                  </div>
                </div>

                {/* Meta — desktop */}
                <div className="hidden items-center gap-3 sm:flex">
                  {cat && (
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-400"
                      style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
                      {cat}
                    </span>
                  )}
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${pmTone}`}>
                    {pmLabel}
                  </span>
                  {t.starting_price && (
                    <span className="text-xs text-slate-500">from {t.starting_price}</span>
                  )}
                  {t.promo_code && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/5 px-2 py-0.5 text-[11px] font-mono font-bold text-pink-300">
                      <Tag className="h-2.5 w-2.5" /> {t.promo_code}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="hidden w-16 shrink-0 text-right md:block">
                  {upvotes > 0 ? (
                    <>
                      <div className="text-sm font-bold text-white tabular-nums">{upvotes}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">upvotes</div>
                    </>
                  ) : rc > 0 ? (
                    <>
                      <div className="text-sm font-bold text-white tabular-nums">{rating.toFixed(1)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">{rc} reviews</div>
                    </>
                  ) : (
                    <div className="text-[10px] uppercase tracking-wider text-slate-700">new</div>
                  )}
                </div>

                {/* Action */}
                {t.website ? (
                  <a href={t.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/5"
                    style={{ borderColor: '#1e2a3a' }}>
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link href={`/tools/${t.slug}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/5"
                    style={{ borderColor: '#1e2a3a' }}>
                    Details
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {tools.length === 0 && (
        <div className="rounded-2xl border py-20 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
          <p className="text-4xl">📋</p>
          <p className="mt-3 font-semibold text-white">No trending tools yet</p>
          <p className="mt-1 text-sm text-slate-500">Check back soon.</p>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-10 rounded-2xl border p-6 text-center" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#e94560' }}>
          <Zap className="h-3.5 w-3.5" /> Submit your AI tool
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Want your tool on this list? Submit your listing — it&apos;s free for the first 6 months.
        </p>
        <Link href="/submit" className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#e94560' }}>
          Submit Your Tool
        </Link>
      </div>
    </div>
  )
}
