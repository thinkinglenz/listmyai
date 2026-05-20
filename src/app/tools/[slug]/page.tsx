import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ExternalLink, Globe, CheckCircle2, Shield, AlertCircle,
  Star, Code2, Smartphone, Monitor,
  ArrowLeft, Share2, Flag, Zap, Building2, MapPin, Calendar, Copy,
} from 'lucide-react'
import PromoCard from '@/components/promo/PromoCard'
import ToolCard from '@/components/listing/ToolCard'
import ClaimModal from '@/components/listing/ClaimModal'
import RatingWidget from '@/components/listing/RatingWidget'
import UpvoteButton from '@/components/listing/UpvoteButton'
import { AiTool, Category, Promotion } from '@/types'
import { PRICING_LABELS, PRICING_COLORS, PLATFORM_LABELS, formatCount, cn } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeTool(t: any, cat?: Category): AiTool {
  return {
    id: String(t.id),
    slug: t.slug,
    name: t.name,
    tagline: t.tagline ?? '',
    description: t.description ?? '',
    website: t.website ?? '',
    pricing_url: t.pricing_url ?? undefined,
    category: cat,
    pricing_model: t.pricing_model ?? 'free',
    starting_price: t.starting_price ?? '',
    has_free_trial: t.has_free_trial ?? false,
    trial_duration: t.trial_duration ?? undefined,
    promo_code: t.promo_code ?? undefined,
    promo_desc: t.promo_desc ?? undefined,
    has_api: t.has_api ?? false,
    api_docs_url: t.api_docs_url ?? undefined,
    no_code: t.no_code ?? true,
    gdpr_compliant: t.gdpr_compliant ?? false,
    platforms: t.platforms ?? [],
    company_name: t.company_name ?? undefined,
    founded_year: t.founded_year ?? undefined,
    hq_location: t.hq_location ?? undefined,
    use_cases: t.use_cases ?? undefined,
    alternatives: t.alternatives ?? [],
    status: t.status ?? 'active',
    is_featured: t.is_featured ?? false,
    is_sponsored: t.is_sponsored ?? false,
    upvotes: t.upvotes ?? 0,
    rating_avg: t.rating_avg ?? 0,
    rating_count: t.rating_count ?? 0,
    view_count: t.view_count ?? 0,
    click_count: t.click_count ?? 0,
    created_at: t.created_at ?? new Date().toISOString(),
    updated_at: t.updated_at ?? new Date().toISOString(),
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Append ?ref=listmyai to every outbound link */
function outbound(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('ref', 'listmyai')
    return u.toString()
  } catch { return url }
}

// ── Status badge config ───────────────────────────────────────────────────────

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactElement; cls: string }> = {
  verified: { label:'Verified',  icon:<CheckCircle2 className="h-4 w-4" />, cls:'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  claimed:  { label:'Claimed',   icon:<Shield className="h-4 w-4" />,       cls:'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  pending:  { label:'Pending',   icon:<AlertCircle className="h-4 w-4" />,  cls:'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  auto:     { label:'Unclaimed', icon:<AlertCircle className="h-4 w-4" />,  cls:'text-amber-400 bg-amber-500/10 border-amber-500/25' },
}

// ── SEO ───────────────────────────────────────────────────────────────────────

interface PageProps { params: Promise<{ slug: string }> }

async function fetchTool(slug: string): Promise<AiTool | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data: t } = await sb
    .from('ai_tools')
    .select('*, categories(id, slug, name, icon, color)')
    .eq('slug', slug)
    .maybeSingle()
  if (!t) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRaw = Array.isArray(t.categories) ? t.categories[0] : (t.categories as any)
  const cat: Category | undefined = catRaw ? {
    id: catRaw.id, slug: catRaw.slug, name: catRaw.name,
    icon: catRaw.icon ?? 'Layers', color: catRaw.color ?? '#6366f1', count: 0,
  } : undefined
  return shapeTool(t, cat)
}

async function fetchRelated(categoryId: string | null, excludeSlug: string): Promise<AiTool[]> {
  const sb = getSupabase()
  if (!sb) return []
  let q = sb.from('ai_tools')
    .select('id, slug, name, tagline, website, pricing_model, starting_price, has_free_trial, has_api, no_code, gdpr_compliant, status, is_featured, is_sponsored, upvotes, rating_avg, rating_count, view_count, click_count, created_at, updated_at')
    .eq('status', 'active')
    .neq('slug', excludeSlug)
    .limit(3)
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data } = await q
  return (data ?? []).map(t => shapeTool(t))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tool = await fetchTool(slug)
  if (!tool) return { title: 'Tool Not Found | ListmyAI' }

  const title = `${tool.name} — ${tool.tagline} | ListmyAI`
  const description = `${tool.name}: ${tool.tagline}. ${tool.pricing_model === 'free' ? 'Free' : tool.starting_price ?? 'See pricing'}. ${tool.has_free_trial ? 'Free trial available. ' : ''}Discover deals, reviews, and alternatives on ListmyAI.`

  return {
    title,
    description,
    keywords: [tool.name, tool.category?.name ?? '', 'AI tool', 'artificial intelligence', tool.company_name ?? '', 'review', 'pricing', 'alternative'].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://listmyai.com/tools/${slug}`,
      siteName: 'ListmyAI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: `https://listmyai.com/tools/${slug}` },
  }
}

// ── FAQ generator ─────────────────────────────────────────────────────────────

function buildFAQs(tool: AiTool) {
  const faqs: { q: string; a: string }[] = []

  // Only include FAQs where we have real data to back the answer
  faqs.push({
    q: `Is ${tool.name} free?`,
    a: tool.pricing_model === 'free'
      ? `Yes, ${tool.name} is completely free to use.`
      : tool.pricing_model === 'freemium'
        ? `${tool.name} has a free tier.${tool.starting_price ? ` Paid plans start at ${tool.starting_price}.` : ' Paid plans are available for advanced features.'}`
        : `${tool.name} is a paid tool.${tool.starting_price ? ` Plans start at ${tool.starting_price}.` : ' Visit the website for current pricing.'}`
  })

  if (tool.has_free_trial) {
    faqs.push({
      q: `Does ${tool.name} have a free trial?`,
      a: tool.trial_duration ? `Yes — ${tool.trial_duration}.` : `Yes, ${tool.name} offers a free trial. Check the website for current trial terms.`
    })
  }

  if (tool.has_api) {
    faqs.push({
      q: `Does ${tool.name} have an API?`,
      a: `Yes, ${tool.name} provides a developer API${tool.api_docs_url ? `. Documentation: ${tool.api_docs_url}` : '.'}`
    })
  }

  if (tool.use_cases) {
    faqs.push({
      q: `What is ${tool.name} used for?`,
      a: `${tool.name} is commonly used for: ${tool.use_cases.split('\n').filter(Boolean).join(', ')}.`
    })
  } else if (tool.category?.name) {
    faqs.push({
      q: `What is ${tool.name} used for?`,
      a: `${tool.name} is an AI tool in the ${tool.category.name} category. Visit their website for detailed use cases.`
    })
  }

  if (tool.company_name) {
    faqs.push({
      q: `Who makes ${tool.name}?`,
      a: `${tool.name} is developed by ${tool.company_name}${tool.hq_location ? `, headquartered in ${tool.hq_location}` : ''}.`
    })
  }

  if (tool.alternatives?.length) {
    faqs.push({
      q: `What are the best alternatives to ${tool.name}?`,
      a: `Popular alternatives to ${tool.name} include: ${tool.alternatives.join(', ')}.`
    })
  }

  return faqs
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function buildJsonLd(tool: AiTool, faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.tagline,
        url: tool.website,
        applicationCategory: 'AIApplication',
        operatingSystem: tool.platforms?.join(', ') ?? 'Web',
        offers: {
          '@type': 'Offer',
          price: tool.pricing_model === 'free' ? '0' : undefined,
          priceCurrency: 'USD',
          description: tool.starting_price,
        },
        ...(tool.rating_count > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tool.rating_avg.toFixed(1),
            reviewCount: tool.rating_count,
            bestRating: '5',
            worstRating: '1',
          },
        } : {}),
        author: { '@type': 'Organization', name: tool.company_name ?? tool.name },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Directory', item: 'https://listmyai.com/directory' },
          ...(tool.category ? [{ '@type': 'ListItem', position: 2, name: tool.category.name, item: `https://listmyai.com/directory?category=${tool.category.slug}` }] : []),
          { '@type': 'ListItem', position: tool.category ? 3 : 2, name: tool.name, item: `https://listmyai.com/tools/${tool.slug}` },
        ],
      },
    ],
  }
}

// ── ClaimBanner — rendered server-side, wraps client ClaimModal ───────────────

import ClaimBanner from '@/components/listing/ClaimBanner'

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const tool = await fetchTool(slug)
  if (!tool) notFound()

  const related = await fetchRelated(tool.category ? String(tool.category.id) : null, slug)

  const status = STATUS_CONFIG[tool.status] ?? STATUS_CONFIG.auto
  const promos: Promotion[] = []
  const useCases = tool.use_cases?.split('\n').filter(Boolean) ?? []
  const pricing = tool.pricing_model
  const faqs = buildFAQs(tool)
  const jsonLd = buildJsonLd(tool, faqs)
  const isUnclaimed = tool.status === 'auto'

  return (
    <>
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/directory" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Directory
          </Link>
          <span>/</span>
          {tool.category && (
            <>
              <Link href={`/directory?category=${tool.category.slug}`} className="hover:text-white transition-colors">
                {tool.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-300">{tool.name}</span>
        </div>

        {/* Claim banner for unclaimed tools */}
        {isUnclaimed && (
          <ClaimBanner
            toolName={tool.name}
            toolSlug={tool.slug}
            toolWebsite={tool.website}
          />
        )}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Hero card */}
            <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
                  style={{background:'rgba(255,255,255,0.08)',border:'1px solid #1e2a3a'}}>
                  {tool.name[0]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-white">{tool.name}</h1>
                    {tool.is_featured && (
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.25)',color:'#f59e0b'}}>
                        <Zap className="h-3 w-3" /> Featured
                      </span>
                    )}
                    <span className={cn('flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', status.cls)}>
                      {status.icon}{status.label}
                    </span>
                  </div>

                  <p className="mt-1 text-slate-300">{tool.tagline}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {tool.category && (
                      <span className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{background:`${tool.category.color}20`,color:tool.category.color,border:`1px solid ${tool.category.color}30`}}>
                        {tool.category.name}
                      </span>
                    )}
                    {pricing && (
                      <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', PRICING_COLORS[pricing])}>
                        {PRICING_LABELS[pricing]}
                      </span>
                    )}
                    {tool.has_free_trial && (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{background:'rgba(16,185,129,0.1)',color:'#10b981',border:'1px solid rgba(16,185,129,0.2)'}}>
                        ✓ Free Trial
                      </span>
                    )}
                    {tool.has_api && (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{background:'rgba(6,182,212,0.1)',color:'#06b6d4',border:'1px solid rgba(6,182,212,0.2)'}}>
                        <Code2 className="inline h-3 w-3 mr-1" />API
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  style={{background:'#e94560',boxShadow:'0 0 20px rgba(233,69,96,0.25)'}}>
                  <ExternalLink className="h-4 w-4" />
                  Visit {tool.name}
                </a>
                {tool.pricing_url && (
                  <a href={outbound(tool.pricing_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
                    style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.03)'}}>
                    <Globe className="h-4 w-4" /> Pricing
                  </a>
                )}
                <UpvoteButton toolId={tool.id} toolName={tool.name} initialCount={tool.upvotes} />
                <button className="ml-auto flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm text-slate-500 transition hover:text-slate-300"
                  style={{borderColor:'#1e2a3a',background:'transparent'}}>
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Rating summary */}
              {tool.rating_count > 0 && (
                <div className="mt-4 flex items-center gap-3 border-t pt-4" style={{borderColor:'#1e2a3a'}}>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn('h-4 w-4', s <= Math.round(tool.rating_avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-700')} />
                    ))}
                  </div>
                  <span className="font-bold text-white">{tool.rating_avg.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">({tool.rating_count.toLocaleString()} ratings from ListmyAI users)</span>
                  <span className="ml-auto text-sm text-slate-500">{formatCount(tool.view_count)} views</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h2 className="mb-4 text-lg font-bold text-white">About {tool.name}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-300">
                {tool.description?.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>

            {/* Use cases */}
            {useCases.length > 0 && (
              <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h2 className="mb-4 text-lg font-bold text-white">Key Use Cases</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {useCases.map(uc => (
                    <div key={uc} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300"
                      style={{background:'rgba(255,255,255,0.03)',border:'1px solid #1e2a3a'}}>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{color:'#e94560'}} />
                      {uc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promotions */}
            {promos.length > 0 && (
              <div className="rounded-2xl border p-6" style={{borderColor:'rgba(233,69,96,0.2)',background:'rgba(233,69,96,0.04)'}}>
                <h2 className="mb-4 text-lg font-bold text-white">🎁 Active Deals & Promotions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {promos.map(p => <PromoCard key={p.id} promo={{...p, tool:{ id:tool.id, name:tool.name, slug:tool.slug, category:tool.category }}} />)}
                </div>
              </div>
            )}

            {/* Ratings & Reviews */}
            <RatingWidget toolId={tool.id} toolName={tool.name} ratingAvg={tool.rating_avg} ratingCount={tool.rating_count} />

            {/* FAQ — SEO + AI optimised */}
            <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h2 className="mb-5 text-lg font-bold text-white">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map(({ q, a }) => (
                  <div key={q} className="rounded-xl border p-4" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
                    <p className="font-semibold text-white">{q}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl p-4 text-xs leading-relaxed text-slate-500"
              style={{border:'1px solid #1e2a3a',background:'rgba(255,255,255,0.02)'}}>
              <strong className="text-slate-400">Disclaimer:</strong> All product names, logos, and trademarks are the property of {tool.company_name ?? tool.name}.
              ListmyAI is an independent directory and is not affiliated with, endorsed by, or sponsored by {tool.company_name ?? tool.name}.
              Information is for general informational purposes only and may not reflect the latest changes to pricing or features.
              {isUnclaimed && (
                <span className="block mt-1">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  This listing was auto-compiled from public sources and has not yet been claimed by the tool owner.
                </span>
              )}
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Quick facts */}
            <div className="rounded-2xl border p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Quick Facts</h3>
              <div className="space-y-3">
                {[
                  { icon:<Globe className="h-4 w-4" />,      label:'Website',  val:<a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{color:'#e94560'}}>{new URL(tool.website).hostname}</a> },
                  { icon:<Building2 className="h-4 w-4" />,  label:'Company',  val:tool.company_name },
                  { icon:<MapPin className="h-4 w-4" />,     label:'Location', val:tool.hq_location },
                  { icon:<Calendar className="h-4 w-4" />,   label:'Founded',  val:tool.founded_year },
                  { icon:<Globe className="h-4 w-4" />,      label:'Pricing',  val:tool.starting_price },
                ].filter(r => r.val).map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500">{row.icon}{row.label}</span>
                    <span className="text-right text-slate-300">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platforms */}
            {tool.platforms && tool.platforms.length > 0 && (
              <div className="rounded-2xl border p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Available On</h3>
                <div className="flex flex-wrap gap-2">
                  {tool.platforms.map(p => (
                    <span key={p} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300"
                      style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.03)'}}>
                      {p === 'vscode' ? <Monitor className="h-3 w-3" /> : p === 'ios' || p === 'android' ? <Smartphone className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      {PLATFORM_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trial */}
            {tool.has_free_trial && (
              <div className="rounded-2xl border p-5" style={{borderColor:'rgba(16,185,129,0.2)',background:'rgba(16,185,129,0.04)'}}>
                <h3 className="mb-2 text-sm font-bold text-emerald-400">✓ Free Trial Available</h3>
                <p className="text-sm text-slate-400">{tool.trial_duration ?? 'Free trial available — check website for details.'}</p>
                <a href={outbound(tool.pricing_url ?? tool.website)} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:opacity-90"
                  style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.2)'}}>
                  Start Free Trial <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Alternatives */}
            {tool.alternatives && tool.alternatives.length > 0 && (
              <div className="rounded-2xl border p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Similar Tools</h3>
                <div className="space-y-1">
                  {tool.alternatives.map(alt => (
                    <Link key={alt} href={`/directory?q=${encodeURIComponent(alt)}`}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                      → {alt}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* API */}
            {tool.has_api && (
              <div className="rounded-2xl border p-5" style={{borderColor:'rgba(6,182,212,0.2)',background:'rgba(6,182,212,0.04)'}}>
                <h3 className="mb-2 text-sm font-bold" style={{color:'#06b6d4'}}>⚡ API Available</h3>
                <p className="text-sm text-slate-400">{tool.name} provides a developer API for integration into your own products.</p>
                {tool.api_docs_url && (
                  <a href={outbound(tool.api_docs_url)} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:opacity-90"
                    style={{background:'rgba(6,182,212,0.12)',color:'#06b6d4',border:'1px solid rgba(6,182,212,0.2)'}}>
                    API Docs <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Backlink request (shown to all — subtle) */}
            <div className="rounded-2xl border p-4" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <p className="text-xs font-semibold text-slate-400 mb-2">🔗 Using {tool.name}?</p>
              <p className="text-xs text-slate-600 mb-2">Link back to this listing and help others discover it.</p>
              <BacklinkCopy slug={tool.slug} />
            </div>

            {/* Report */}
            <div className="text-center">
              <Link href="/dmca" className="flex items-center justify-center gap-1.5 text-xs text-slate-600 transition hover:text-slate-400">
                <Flag className="h-3.5 w-3.5" /> Report inaccurate info
              </Link>
            </div>
          </div>
        </div>

        {/* Related tools */}
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-white">You might also like</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map(t => <ToolCard key={t.id} tool={t} />)}
          </div>
        </section>
      </div>
    </>
  )
}

// ── Small client component — backlink copy button ─────────────────────────────
function BacklinkCopy({ slug }: { slug: string }) {
  return <BacklinkCopyClient slug={slug} />
}

import BacklinkCopyClient from '@/components/listing/BacklinkCopyClient'
