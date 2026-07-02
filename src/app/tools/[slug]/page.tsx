import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ExternalLink, Globe, CheckCircle2, Shield, AlertCircle,
  Star, Code2, Smartphone, Monitor,
  ArrowLeft, Flag, Zap, Building2, MapPin, Calendar, Copy, Mail,
} from 'lucide-react'
import PromoCard from '@/components/promo/PromoCard'
import ToolCard from '@/components/listing/ToolCard'
import ClaimModal from '@/components/listing/ClaimModal'
import RatingWidget from '@/components/listing/RatingWidget'
import UpvoteButton from '@/components/listing/UpvoteButton'
import { AiTool, Category, Promotion } from '@/types'
import { PRICING_LABELS, PRICING_COLORS, PLATFORM_LABELS, formatCount, cn } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Strip markdown artifacts from scraped data
function cleanText(s: string): string {
  return s
    .replace(/`#\w+`/g, '')             // `#free`, `#paid`, etc.
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
    .replace(/`([^`]+)`/g, '$1')        // `code` → code
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeTool(t: any, cat?: Category): AiTool {
  return {
    id: String(t.id),
    slug: t.slug,
    name: t.name,
    tagline: cleanText(t.tagline ?? ''),
    description: cleanText(t.description ?? ''),
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
    company_description: cleanText(t.company_description ?? ''),
    founded_year: t.founded_year ?? undefined,
    hq_location: t.hq_location ?? undefined,
    use_cases: t.use_cases ?? undefined,
    alternatives: t.alternatives ?? [],
    target_audience: t.target_audience ?? undefined,
    integrations: t.integrations ?? undefined,
    team_size: t.team_size ?? undefined,
    video_url: t.video_url ?? undefined,
    demo_url: t.demo_url ?? undefined,
    contact_email: t.contact_email ?? undefined,
    contact_name: t.contact_name ?? undefined,
    contact_phone: t.contact_phone ?? undefined,
    support_url: t.support_url ?? undefined,
    twitter_url: t.twitter_url ?? undefined,
    linkedin_url: t.linkedin_url ?? undefined,
    github_url: t.github_url ?? undefined,
    discord_url: t.discord_url ?? undefined,
    youtube_url: t.youtube_url ?? undefined,
    facebook_url: t.facebook_url ?? undefined,
    instagram_url: t.instagram_url ?? undefined,
    tiktok_url: t.tiktok_url ?? undefined,
    product_hunt_url: t.product_hunt_url ?? undefined,
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

// Extended return type that includes claim status from DB
type AiToolWithClaim = AiTool & { _claimed?: boolean; _claimed_by?: string; _submitted_by?: string }

async function fetchTool(slug: string): Promise<AiToolWithClaim | null> {
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
  const tool = shapeTool(t, cat) as AiToolWithClaim
  // Carry over claim fields from raw DB row
  tool._claimed = !!(t as Record<string, unknown>).claimed
  tool._claimed_by = (t as Record<string, unknown>).claimed_by as string | undefined
  tool._submitted_by = (t as Record<string, unknown>).submitted_by as string | undefined
  return tool
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
import ContactForm from '@/components/listing/ContactForm'
import WebsitePreview from '@/components/listing/WebsitePreview'
import ToolShareButtons from '@/components/listing/ToolShareButtons'
import ToolPageTracker from '@/components/listing/ToolPageTracker'

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const tool = await fetchTool(slug)
  if (!tool) notFound()

  const related = await fetchRelated(tool.category ? String(tool.category.id) : null, slug)

  // User-submitted or claimed tools show "Claimed" badge; scraped tools show their DB status
  const statusKey = (tool._claimed || tool._submitted_by) ? 'claimed' : tool.status
  const status = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.auto
  const promos: Promotion[] = []
  const useCases = tool.use_cases?.split('\n').filter(Boolean) ?? []
  const pricing = tool.pricing_model
  const faqs = buildFAQs(tool)
  const jsonLd = buildJsonLd(tool, faqs)
  // Show claim banner only for scraped/imported tools that nobody has claimed or submitted
  const isUnclaimed = !tool._claimed && !tool._claimed_by && !tool._submitted_by && tool.status !== 'claimed' && tool.status !== 'verified'

  return (
    <>
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* View + outbound click tracking */}
      <ToolPageTracker slug={tool.slug} />

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
            toolId={tool.id}
            toolName={tool.name}
            toolSlug={tool.slug}
            toolWebsite={tool.website}
          />
        )}

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">

          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-2">

            {/* Hero card */}
            <div className="rounded-2xl border p-4 sm:p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white sm:h-16 sm:w-16 sm:rounded-2xl sm:text-2xl"
                  style={{background:'rgba(255,255,255,0.08)',border:'1px solid #1e2a3a'}}>
                  {tool.name[0]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-white sm:text-2xl">{tool.name}</h1>
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
              <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
                <a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
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
                <ToolShareButtons slug={tool.slug} name={tool.name} tagline={tool.tagline ?? ''} />
              </div>

              {/* Rating summary */}
              {tool.rating_count > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4" style={{borderColor:'#1e2a3a'}}>
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

            {/* Demo button */}
            {tool.demo_url && (
              <a href={outbound(tool.demo_url)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
                style={{borderColor:'rgba(16,185,129,0.2)',background:'rgba(16,185,129,0.04)',color:'#10b981'}}>
                <Monitor className="h-5 w-5" /> Try Live Demo <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            {/* Video embed */}
            {tool.video_url && (() => {
              const ytMatch = tool.video_url!.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
              const vimeoMatch = tool.video_url!.match(/vimeo\.com\/(\d+)/)
              const embedUrl = ytMatch ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}` : vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}` : null
              if (!embedUrl) return null
              return (
                <div className="rounded-2xl border overflow-hidden" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                  <div className="aspect-video">
                    <iframe src={embedUrl} title={`${tool.name} demo video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen className="h-full w-full" />
                  </div>
                </div>
              )
            })()}

            {/* Website Preview — clean, no browser chrome */}
            <WebsitePreview website={tool.website} toolName={tool.name} outboundUrl={outbound(tool.website)} />

            {/* About — merged description + solution provider */}
            <div className="rounded-2xl border p-4 sm:p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white"
                  style={{background:'rgba(233,69,96,0.12)',border:'1px solid rgba(233,69,96,0.25)'}}>
                  {tool.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">About {tool.name}</h2>
                  {tool.company_name && <p className="text-sm text-slate-500">by {tool.company_name}</p>}
                </div>
              </div>

              {/* Tool description */}
              <div className="space-y-3 text-sm leading-relaxed text-slate-300">
                {tool.description?.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>

              {/* Company description — richer about content */}
              {tool.company_description && (
                <div className="mt-5 pt-5 space-y-3 text-sm leading-relaxed text-slate-300" style={{borderTop:'1px solid #1e2a3a'}}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">About the Company</p>
                  {tool.company_description.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
                </div>
              )}

              {/* Company details grid */}
              {(tool.company_name || tool.hq_location || tool.founded_year) && (
                <div className="grid gap-3 sm:grid-cols-2 mt-5 pt-5" style={{borderTop:'1px solid #1e2a3a'}}>
                  {tool.company_name && (
                    <div className="rounded-xl border px-4 py-3" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
                      <p className="text-xs text-slate-500 mb-0.5">Company</p>
                      <p className="text-sm font-medium text-white">{tool.company_name}</p>
                    </div>
                  )}
                  {tool.hq_location && (
                    <div className="rounded-xl border px-4 py-3" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
                      <p className="text-xs text-slate-500 mb-0.5">Headquarters</p>
                      <p className="text-sm font-medium text-white">{tool.hq_location}</p>
                    </div>
                  )}
                  {tool.founded_year && (
                    <div className="rounded-xl border px-4 py-3" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
                      <p className="text-xs text-slate-500 mb-0.5">Founded</p>
                      <p className="text-sm font-medium text-white">{tool.founded_year}</p>
                    </div>
                  )}
                  <div className="rounded-xl border px-4 py-3" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
                    <p className="text-xs text-slate-500 mb-0.5">Website</p>
                    <a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline" style={{color:'#e94560'}}>
                      {new URL(tool.website).hostname}
                    </a>
                  </div>
                </div>
              )}

              {/* Provider contact links */}
              {(tool.contact_email || tool.twitter_url || tool.linkedin_url || tool.github_url || tool.support_url) && (
                <div className="pt-4 mt-4" style={{borderTop:'1px solid #1e2a3a'}}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Contact the Provider</p>
                  <div className="flex flex-wrap gap-2">
                    {tool.contact_email && (
                      <a href={`mailto:${tool.contact_email}`}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <Mail className="h-3.5 w-3.5 text-slate-500" /> Email
                      </a>
                    )}
                    {tool.twitter_url && (
                      <a href={tool.twitter_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter / X
                      </a>
                    )}
                    {tool.linkedin_url && (
                      <a href={tool.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                      </a>
                    )}
                    {tool.github_url && (
                      <a href={tool.github_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        GitHub
                      </a>
                    )}
                    {tool.facebook_url && (
                      <a href={tool.facebook_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <Globe className="h-3.5 w-3.5 text-slate-500" /> Facebook
                      </a>
                    )}
                    {tool.instagram_url && (
                      <a href={tool.instagram_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <Globe className="h-3.5 w-3.5 text-slate-500" /> Instagram
                      </a>
                    )}
                    {tool.tiktok_url && (
                      <a href={tool.tiktok_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <Globe className="h-3.5 w-3.5 text-slate-500" /> TikTok
                      </a>
                    )}
                    {tool.product_hunt_url && (
                      <a href={tool.product_hunt_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <Globe className="h-3.5 w-3.5 text-slate-500" /> Product Hunt
                      </a>
                    )}
                    {tool.support_url && (
                      <a href={outbound(tool.support_url)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
                        style={{borderColor:'#1e2a3a'}}>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" /> Support
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Target audience */}
            {tool.target_audience && (
              <div className="rounded-2xl border p-4 sm:p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h2 className="mb-3 text-lg font-bold text-white">Who Is {tool.name} For?</h2>
                <p className="text-sm leading-relaxed text-slate-300">{tool.target_audience}</p>
              </div>
            )}

            {/* Use cases */}
            {useCases.length > 0 && (
              <div className="rounded-2xl border p-4 sm:p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
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
              <div className="rounded-2xl border p-4 sm:p-6" style={{borderColor:'rgba(233,69,96,0.2)',background:'rgba(233,69,96,0.04)'}}>
                <h2 className="mb-4 text-lg font-bold text-white">🎁 Active Deals & Promotions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {promos.map(p => <PromoCard key={p.id} promo={{...p, tool:{ id:tool.id, name:tool.name, slug:tool.slug, category:tool.category }}} />)}
                </div>
              </div>
            )}

            {/* Ratings & Reviews */}
            <RatingWidget toolId={tool.id} toolName={tool.name} ratingAvg={tool.rating_avg} ratingCount={tool.rating_count} />

            {/* FAQ — SEO + AI optimised */}
            <div className="rounded-2xl border p-4 sm:p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
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

            {/* Contact Form */}
            <ContactForm toolName={tool.name} toolSlug={tool.slug} />

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
          <div className="min-w-0 space-y-5">

            {/* Quick facts */}
            <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Quick Facts</h3>
              <div className="space-y-3">
                {[
                  { icon:<Globe className="h-4 w-4" />,      label:'Website',  val:<a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{color:'#e94560'}}>{new URL(tool.website).hostname}</a> },
                  { icon:<Building2 className="h-4 w-4" />,  label:'Company',  val:tool.company_name },
                  { icon:<MapPin className="h-4 w-4" />,     label:'Location', val:tool.hq_location },
                  { icon:<Calendar className="h-4 w-4" />,   label:'Founded',  val:tool.founded_year },
                  { icon:<Globe className="h-4 w-4" />,      label:'Team',     val:tool.team_size },
                  { icon:<Globe className="h-4 w-4" />,      label:'Pricing',  val:tool.starting_price },
                ].filter(r => r.val).map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500">{row.icon}{row.label}</span>
                    <span className="text-right text-slate-300">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Social */}
            {(tool.contact_email || tool.support_url || tool.twitter_url || tool.linkedin_url || tool.github_url || tool.discord_url || tool.youtube_url || tool.facebook_url || tool.instagram_url || tool.tiktok_url || tool.product_hunt_url) && (
              <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Contact & Social</h3>
                <div className="space-y-2.5">
                  {tool.contact_email && (
                    <a href={`mailto:${tool.contact_email}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <Mail className="h-4 w-4 text-slate-500" /> {tool.contact_email}
                    </a>
                  )}
                  {tool.support_url && (
                    <a href={outbound(tool.support_url)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <ExternalLink className="h-4 w-4 text-slate-500" /> Support / Help Center
                    </a>
                  )}
                  {tool.twitter_url && (
                    <a href={tool.twitter_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      Twitter / X
                    </a>
                  )}
                  {tool.linkedin_url && (
                    <a href={tool.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {tool.github_url && (
                    <a href={tool.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      GitHub
                    </a>
                  )}
                  {tool.discord_url && (
                    <a href={tool.discord_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
                      Discord Community
                    </a>
                  )}
                  {tool.youtube_url && (
                    <a href={tool.youtube_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon fill="#161b27" points="9.545,15.568 15.818,12 9.545,8.432"/></svg>
                      YouTube
                    </a>
                  )}
                  {tool.facebook_url && (
                    <a href={tool.facebook_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <Globe className="h-4 w-4 text-slate-500" /> Facebook
                    </a>
                  )}
                  {tool.instagram_url && (
                    <a href={tool.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <Globe className="h-4 w-4 text-slate-500" /> Instagram
                    </a>
                  )}
                  {tool.tiktok_url && (
                    <a href={tool.tiktok_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <Globe className="h-4 w-4 text-slate-500" /> TikTok
                    </a>
                  )}
                  {tool.product_hunt_url && (
                    <a href={tool.product_hunt_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      style={{border:'1px solid #1e2a3a'}}>
                      <Globe className="h-4 w-4 text-slate-500" /> Product Hunt
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Integrations */}
            {tool.integrations && (
              <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Integrations</h3>
                <p className="text-sm text-slate-300">{tool.integrations}</p>
              </div>
            )}

            {/* Platforms */}
            {tool.platforms && tool.platforms.length > 0 && (
              <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
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
              <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'rgba(16,185,129,0.2)',background:'rgba(16,185,129,0.04)'}}>
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
              <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
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

            {/* Alternatives page link */}
            <Link href={`/alternatives/${tool.slug}`}
              className="block rounded-2xl border p-5 transition hover:border-red-500/30"
              style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h3 className="text-sm font-bold text-white">Looking for {tool.name} alternatives?</h3>
              <p className="mt-1 text-xs text-slate-500">
                Compare similar tools, pricing, and features side by side.
              </p>
              <span className="mt-2 inline-block text-xs font-semibold" style={{color:'#e94560'}}>
                View all alternatives →
              </span>
            </Link>

            {/* API */}
            {tool.has_api && (
              <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:'rgba(6,182,212,0.2)',background:'rgba(6,182,212,0.04)'}}>
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
