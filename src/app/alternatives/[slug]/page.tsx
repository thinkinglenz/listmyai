import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, ExternalLink, Star, CheckCircle2, Zap } from 'lucide-react'
import ToolCard from '@/components/listing/ToolCard'
import { AiTool, Category } from '@/types'
import { PRICING_LABELS, cn } from '@/lib/utils'

export const revalidate = 3600

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface PageProps { params: Promise<{ slug: string }> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeTool(t: any, cat?: Category): AiTool {
  return {
    id: String(t.id), slug: t.slug, name: t.name,
    tagline: t.tagline ?? '', description: t.description ?? '',
    website: t.website ?? '', logo_url: t.logo_url ?? undefined,
    category: cat, pricing_model: t.pricing_model ?? 'free',
    starting_price: t.starting_price ?? '', has_free_trial: t.has_free_trial ?? false,
    has_api: t.has_api ?? false, no_code: true, gdpr_compliant: false,
    status: t.status ?? 'active', is_featured: t.is_featured ?? false,
    is_sponsored: t.is_sponsored ?? false, upvotes: t.upvotes ?? 0,
    rating_avg: t.rating_avg ?? 0, rating_count: t.rating_count ?? 0,
    view_count: t.view_count ?? 0, click_count: t.click_count ?? 0,
    platforms: t.platforms ?? [], promo_code: t.promo_code ?? undefined,
    promo_desc: t.promo_desc ?? undefined,
    created_at: t.created_at ?? new Date().toISOString(),
    updated_at: t.updated_at ?? new Date().toISOString(),
  }
}

async function fetchToolAndAlternatives(slug: string) {
  const sb = getSupabase()
  if (!sb) return null

  const { data: t } = await sb
    .from('ai_tools')
    .select('*, categories(id, slug, name, icon, color)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!t) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRaw = Array.isArray(t.categories) ? t.categories[0] : (t.categories as any)
  const cat: Category | undefined = catRaw
    ? { id: catRaw.id, slug: catRaw.slug, name: catRaw.name, icon: catRaw.icon ?? 'Layers', color: catRaw.color ?? '#6366f1', count: 0 }
    : undefined

  const tool = shapeTool(t, cat)

  let altsQuery = sb
    .from('ai_tools')
    .select('*, categories(id, slug, name, icon, color)')
    .eq('status', 'active')
    .neq('slug', slug)
    .limit(12)

  if (t.category_id) altsQuery = altsQuery.eq('category_id', t.category_id)
  altsQuery = altsQuery.order('upvotes', { ascending: false })

  const { data: altsRaw } = await altsQuery

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alternatives: AiTool[] = (altsRaw ?? []).map((a: any) => {
    const ac = Array.isArray(a.categories) ? a.categories[0] : (a.categories as any)
    const aCat: Category | undefined = ac
      ? { id: ac.id, slug: ac.slug, name: ac.name, icon: ac.icon ?? 'Layers', color: ac.color ?? '#6366f1', count: 0 }
      : undefined
    return shapeTool(a, aCat)
  })

  return { tool, alternatives, category: cat }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchToolAndAlternatives(slug)
  if (!data) return { title: 'Alternatives Not Found | ListmyAI' }

  const { tool, alternatives } = data
  const altNames = alternatives.slice(0, 5).map(a => a.name).join(', ')
  const title = `Best ${tool.name} Alternatives in 2026 — Top ${alternatives.length} Tools`
  const description = `Looking for ${tool.name} alternatives? Compare the best options: ${altNames}. Find pricing, features, free trials, and more on ListmyAI.`

  return {
    title,
    description,
    openGraph: {
      title: `${tool.name} Alternatives — ${alternatives.length} Tools Compared`,
      description,
      url: `https://listmyai.com/alternatives/${slug}`,
      type: 'website',
      siteName: 'ListmyAI',
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://listmyai.com/alternatives/${slug}` },
  }
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params
  const data = await fetchToolAndAlternatives(slug)
  if (!data) notFound()

  const { tool, alternatives, category } = data

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${tool.name} Alternatives`,
    url: `https://listmyai.com/alternatives/${slug}`,
    description: `Best alternatives to ${tool.name}${category ? ` in the ${category.name} category` : ''}.`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: alternatives.length,
      itemListElement: alternatives.map((alt, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://listmyai.com/tools/${alt.slug}`,
        name: alt.name,
        description: alt.tagline,
      })),
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What are the best alternatives to ${tool.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The top alternatives to ${tool.name} include ${alternatives.slice(0, 5).map(a => a.name).join(', ')}. These tools offer similar functionality${category ? ` in the ${category.name} category` : ''}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${tool.name} free?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: tool.pricing_model === 'free'
            ? `Yes, ${tool.name} is free to use.`
            : tool.pricing_model === 'freemium'
              ? `${tool.name} offers a free tier with paid plans available.${tool.starting_price ? ` Paid plans start at ${tool.starting_price}.` : ''}`
              : `${tool.name} is a paid tool.${tool.starting_price ? ` Plans start at ${tool.starting_price}.` : ''}`,
        },
      },
      ...(alternatives.filter(a => a.pricing_model === 'free').length > 0 ? [{
        '@type': 'Question',
        name: `Are there free alternatives to ${tool.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, free alternatives to ${tool.name} include: ${alternatives.filter(a => a.pricing_model === 'free').map(a => a.name).join(', ')}.`,
        },
      }] : []),
    ],
  }

  const freeAlts = alternatives.filter(a => a.pricing_model === 'free' || a.pricing_model === 'freemium')
  const paidAlts = alternatives.filter(a => a.pricing_model !== 'free' && a.pricing_model !== 'freemium')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/directory" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Directory
          </Link>
          <span>/</span>
          <Link href={`/tools/${tool.slug}`} className="hover:text-white transition-colors">{tool.name}</Link>
          <span>/</span>
          <span className="text-slate-300">Alternatives</span>
        </div>

        {/* Hero */}
        <div className="mb-10 rounded-2xl border p-8" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #1e2a3a' }}>
              {tool.name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                Best {tool.name} Alternatives <span className="text-slate-500">({new Date().getFullYear()})</span>
              </h1>
              <p className="mt-2 max-w-2xl text-slate-400">
                {tool.tagline ? `${tool.name}: ${tool.tagline}. ` : ''}
                Compare {alternatives.length} similar{category ? ` ${category.name.toLowerCase()}` : ''} tools below.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/tools/${tool.slug}`}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white hover:bg-white/5"
                  style={{ borderColor: '#1e2a3a' }}>
                  View {tool.name} <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                {category && (
                  <Link href={`/directory?category=${category.slug}`}
                    className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:text-white hover:bg-white/5"
                    style={{ borderColor: `${category.color}30`, color: category.color }}>
                    Browse all {category.name}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick comparison table */}
        <div className="mb-10 overflow-x-auto rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#1e2a3a' }}>
                <th className="px-5 py-3 text-left font-semibold text-slate-400">Tool</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-400">Pricing</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-400">Free Trial</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-400">API</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-400">Rating</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-400">Upvotes</th>
              </tr>
            </thead>
            <tbody>
              {/* Original tool row */}
              <tr className="border-b" style={{ borderColor: '#1e2a3a', background: 'rgba(233,69,96,0.04)' }}>
                <td className="px-5 py-3">
                  <Link href={`/tools/${tool.slug}`} className="font-semibold text-white hover:underline">
                    {tool.name} <span className="text-xs text-slate-500">(original)</span>
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-300">{PRICING_LABELS[tool.pricing_model ?? 'free'] ?? tool.pricing_model}</td>
                <td className="px-5 py-3 text-center">{tool.has_free_trial ? <CheckCircle2 className="inline h-4 w-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}</td>
                <td className="px-5 py-3 text-center">{tool.has_api ? <CheckCircle2 className="inline h-4 w-4 text-cyan-400" /> : <span className="text-slate-600">—</span>}</td>
                <td className="px-5 py-3 text-center">{tool.rating_count > 0 ? <span className="text-amber-400">{tool.rating_avg.toFixed(1)} <Star className="inline h-3 w-3" /></span> : <span className="text-slate-600">—</span>}</td>
                <td className="px-5 py-3 text-right text-slate-300">{tool.upvotes}</td>
              </tr>
              {/* Alternatives */}
              {alternatives.slice(0, 10).map(alt => (
                <tr key={alt.id} className="border-b transition hover:bg-white/[0.02]" style={{ borderColor: '#1e2a3a' }}>
                  <td className="px-5 py-3">
                    <Link href={`/tools/${alt.slug}`} className="font-semibold text-white hover:underline">{alt.name}</Link>
                    {alt.tagline && <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{alt.tagline}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-300">{PRICING_LABELS[alt.pricing_model ?? 'free'] ?? alt.pricing_model}</td>
                  <td className="px-5 py-3 text-center">{alt.has_free_trial ? <CheckCircle2 className="inline h-4 w-4 text-emerald-400" /> : <span className="text-slate-600">—</span>}</td>
                  <td className="px-5 py-3 text-center">{alt.has_api ? <CheckCircle2 className="inline h-4 w-4 text-cyan-400" /> : <span className="text-slate-600">—</span>}</td>
                  <td className="px-5 py-3 text-center">{alt.rating_count > 0 ? <span className="text-amber-400">{alt.rating_avg.toFixed(1)} <Star className="inline h-3 w-3" /></span> : <span className="text-slate-600">—</span>}</td>
                  <td className="px-5 py-3 text-right text-slate-300">{alt.upvotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Free alternatives section */}
        {freeAlts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-white">Free Alternatives to {tool.name}</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {freeAlts.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          </section>
        )}

        {/* Paid alternatives section */}
        {paidAlts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-white">Paid Alternatives to {tool.name}</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {paidAlts.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          </section>
        )}

        {/* FAQ section */}
        <section className="mb-10 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-5 text-lg font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-semibold text-white">What are the best alternatives to {tool.name}?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                The top alternatives include {alternatives.slice(0, 5).map(a => a.name).join(', ')}.
                Each offers similar features{category ? ` in the ${category.name} space` : ''}.
              </p>
            </div>
            {freeAlts.length > 0 && (
              <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
                <p className="font-semibold text-white">Are there free alternatives to {tool.name}?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Yes — {freeAlts.map(a => a.name).join(', ')} {freeAlts.length === 1 ? 'offers' : 'offer'} free plans.
                </p>
              </div>
            )}
            <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-semibold text-white">How do I choose the right {tool.name} alternative?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Consider your budget, required features, and team size. Use the comparison table above to quickly
                compare pricing, free trials, and API availability. Click any tool name for a detailed review.
              </p>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
          <h2 className="text-lg font-bold text-white">Explore More AI Tools</h2>
          <p className="mt-2 text-sm text-slate-400">Can&apos;t find what you need? Try our AI-powered tool finder.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/find" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              <Zap className="mr-1.5 inline h-4 w-4" /> AI Tool Finder
            </Link>
            <Link href="/compare" className="rounded-xl border px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white hover:bg-white/5"
              style={{ borderColor: '#1e2a3a' }}>
              Compare Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
