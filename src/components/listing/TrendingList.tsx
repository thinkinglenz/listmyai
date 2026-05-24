import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Tag, BadgeCheck } from 'lucide-react'

export type TrendingTool = {
  id: string
  slug: string
  name: string
  tagline: string | null
  website: string | null
  logo_url: string | null
  pricing_model: string | null
  starting_price: string | null
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

function catName(c: TrendingTool['categories']): string | null {
  if (!c) return null
  if (Array.isArray(c)) return c[0]?.name ?? null
  return c.name ?? null
}

export default function TrendingList({ tools }: { tools: TrendingTool[] }) {
  return (
    <ol className="overflow-hidden rounded-2xl border"
      style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
      {tools.map((t, i) => {
        const cat = catName(t.categories)
        const pmKey = (t.pricing_model ?? 'freemium').toLowerCase()
        const pmLabel = PRICING_LABEL[pmKey] ?? t.pricing_model ?? ''
        const pmTone = PRICING_TONE[pmKey] ?? PRICING_TONE.freemium
        const upvotes = t.upvotes ?? 0
        const rating = t.rating_avg ?? 0
        const rc = t.rating_count ?? 0
        return (
          <li key={t.id}
            className="border-b transition last:border-b-0 hover:bg-white/[0.02]"
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
                  <Image src={t.logo_url} alt="" width={40} height={40}
                    className="h-10 w-10 object-contain p-1" unoptimized />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center text-base font-black text-slate-500">
                    {t.name?.[0] ?? '?'}
                  </div>
                )}
              </div>

              {/* Name + tagline */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/tools/${t.slug}`}
                    className="truncate font-bold text-white hover:text-red-400">
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
  )
}
