import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, ExternalLink, Star, CheckCircle2, X, Trophy } from 'lucide-react'
import { AiTool, Category } from '@/types'
import { PRICING_LABELS, cn } from '@/lib/utils'
import ComparisonEnrichment from '@/components/compare/ComparisonEnrichment'

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
    has_api: t.has_api ?? false, no_code: t.no_code ?? true, gdpr_compliant: t.gdpr_compliant ?? false,
    status: t.status ?? 'active', is_featured: t.is_featured ?? false,
    is_sponsored: t.is_sponsored ?? false, upvotes: t.upvotes ?? 0,
    rating_avg: t.rating_avg ?? 0, rating_count: t.rating_count ?? 0,
    view_count: t.view_count ?? 0, click_count: t.click_count ?? 0,
    platforms: t.platforms ?? [], company_name: t.company_name ?? undefined,
    hq_location: t.hq_location ?? undefined, founded_year: t.founded_year ?? undefined,
    use_cases: t.use_cases ?? undefined,
    created_at: t.created_at ?? new Date().toISOString(),
    updated_at: t.updated_at ?? new Date().toISOString(),
  }
}

function parseSlugs(slug: string): [string, string] | null {
  const match = slug.match(/^(.+)-vs-(.+)$/)
  if (!match) return null
  return [match[1], match[2]]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTool(sb: any, slug: string): Promise<AiTool | null> {
  const { data } = await sb
    .from('ai_tools')
    .select('*, categories(id, slug, name, icon, color)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()
  if (!data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = data as any
  const catRaw = Array.isArray(t.categories) ? t.categories[0] : t.categories
  const cat: Category | undefined = catRaw
    ? { id: catRaw.id, slug: catRaw.slug, name: catRaw.name, icon: catRaw.icon ?? 'Layers', color: catRaw.color ?? '#6366f1', count: 0 }
    : undefined
  return shapeTool(t, cat)
}

async function fetchBothTools(slug: string) {
  const sb = getSupabase()
  if (!sb) return null
  const parsed = parseSlugs(slug)
  if (!parsed) return null

  // Try exact slugs first
  let [toolA, toolB] = await Promise.all([fetchTool(sb, parsed[0]), fetchTool(sb, parsed[1])])

  // If not found, try fuzzy match (slug might contain extra segments)
  if (!toolA || !toolB) {
    const parts = slug.split('-vs-')
    if (parts.length === 2) {
      if (!toolA) {
        const { data } = await sb.from('ai_tools').select('slug').eq('status', 'active').ilike('slug', `%${parts[0]}%`).limit(1).maybeSingle()
        if (data) toolA = await fetchTool(sb, data.slug)
      }
      if (!toolB) {
        const { data } = await sb.from('ai_tools').select('slug').eq('status', 'active').ilike('slug', `%${parts[1]}%`).limit(1).maybeSingle()
        if (data) toolB = await fetchTool(sb, data.slug)
      }
    }
  }

  if (!toolA || !toolB) return null
  return { toolA, toolB }
}

function CompareRow({ label, valA, valB, type = 'text' }: { label: string; valA: React.ReactNode; valB: React.ReactNode; type?: 'text' | 'bool' | 'number' }) {
  return (
    <tr className="border-b transition hover:bg-white/[0.02]" style={{ borderColor: '#1e2a3a' }}>
      <td className="px-5 py-3.5 text-sm font-medium text-slate-400">{label}</td>
      <td className="px-5 py-3.5 text-sm text-slate-200 text-center">{valA}</td>
      <td className="px-5 py-3.5 text-sm text-slate-200 text-center">{valB}</td>
    </tr>
  )
}

function BoolIcon({ value }: { value: boolean }) {
  return value
    ? <CheckCircle2 className="inline h-4 w-4 text-emerald-400" />
    : <X className="inline h-4 w-4 text-slate-600" />
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchBothTools(slug)
  if (!data) return { title: 'Comparison Not Found | ListmyAI' }

  const { toolA, toolB } = data
  const title = `${toolA.name} vs ${toolB.name} — Detailed Comparison (2026)`
  const description = `Compare ${toolA.name} vs ${toolB.name}: pricing, features, free trials, API access, ratings, and more. Find out which AI tool is right for you.`

  return {
    title,
    description,
    openGraph: {
      title: `${toolA.name} vs ${toolB.name} | ListmyAI`,
      description,
      url: `https://listmyai.com/compare/${slug}`,
      type: 'website',
      siteName: 'ListmyAI',
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://listmyai.com/compare/${slug}` },
  }
}

export default async function VsPage({ params }: PageProps) {
  const { slug } = await params
  const data = await fetchBothTools(slug)
  if (!data) notFound()

  const { toolA, toolB } = data

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${toolA.name} vs ${toolB.name}`,
    url: `https://listmyai.com/compare/${slug}`,
    description: `Side-by-side comparison of ${toolA.name} and ${toolB.name}.`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Directory', item: 'https://listmyai.com/directory' },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://listmyai.com/compare' },
        { '@type': 'ListItem', position: 3, name: `${toolA.name} vs ${toolB.name}`, item: `https://listmyai.com/compare/${slug}` },
      ],
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Which is better, ${toolA.name} or ${toolB.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Both ${toolA.name} and ${toolB.name} are popular${toolA.category?.name ? ` ${toolA.category.name}` : ' AI'} tools. ${toolA.name} has ${toolA.upvotes} upvotes${toolA.rating_count > 0 ? ` and a ${toolA.rating_avg.toFixed(1)}/5 rating` : ''}, while ${toolB.name} has ${toolB.upvotes} upvotes${toolB.rating_count > 0 ? ` and a ${toolB.rating_avg.toFixed(1)}/5 rating` : ''}. The best choice depends on your specific needs and budget.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${toolA.name} cheaper than ${toolB.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${toolA.name} uses a ${toolA.pricing_model} pricing model${toolA.starting_price ? ` starting at ${toolA.starting_price}` : ''}, while ${toolB.name} uses a ${toolB.pricing_model} model${toolB.starting_price ? ` starting at ${toolB.starting_price}` : ''}. Check each tool's website for the latest pricing details.`,
        },
      },
    ],
  }

  const scoreA = (toolA.upvotes * 2) + (toolA.rating_avg * 20) + (toolA.view_count * 0.1)
  const scoreB = (toolB.upvotes * 2) + (toolB.rating_avg * 20) + (toolB.view_count * 0.1)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/directory" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Directory
          </Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-white transition-colors">Compare</Link>
          <span>/</span>
          <span className="text-slate-300">{toolA.name} vs {toolB.name}</span>
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            {toolA.name} <span className="text-slate-500">vs</span> {toolB.name}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Side-by-side feature comparison to help you choose the right
            {toolA.category?.name ? ` ${toolA.category.name.toLowerCase()}` : ' AI'} tool.
          </p>
        </div>

        {/* Head-to-head cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {[toolA, toolB].map((tool, idx) => (
            <div key={tool.id} className="rounded-2xl border p-6 text-center"
              style={{
                borderColor: scoreA !== scoreB && ((idx === 0 && scoreA > scoreB) || (idx === 1 && scoreB > scoreA))
                  ? 'rgba(233,69,96,0.3)' : '#1e2a3a',
                background: scoreA !== scoreB && ((idx === 0 && scoreA > scoreB) || (idx === 1 && scoreB > scoreA))
                  ? 'rgba(233,69,96,0.04)' : '#161b27',
              }}>
              {scoreA !== scoreB && ((idx === 0 && scoreA > scoreB) || (idx === 1 && scoreB > scoreA)) && (
                <div className="mb-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'rgba(233,69,96,0.15)', color: '#e94560' }}>
                  <Trophy className="h-3 w-3" /> More Popular
                </div>
              )}
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #1e2a3a' }}>
                {tool.name[0]}
              </div>
              <h2 className="text-xl font-bold text-white">{tool.name}</h2>
              {tool.tagline && <p className="mt-1 text-sm text-slate-400 line-clamp-2">{tool.tagline}</p>}
              <div className="mt-3 flex items-center justify-center gap-3">
                {tool.rating_count > 0 && (
                  <span className="flex items-center gap-1 text-sm text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> {tool.rating_avg.toFixed(1)}
                  </span>
                )}
                <span className="text-sm text-slate-500">{tool.upvotes} upvotes</span>
              </div>
              <Link href={`/tools/${tool.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white hover:bg-white/5"
                style={{ border: '1px solid #1e2a3a' }}>
                View Details <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* AI-Enriched Content (verdict, pros/cons, FAQs) */}
        <ComparisonEnrichment slug={slug} toolAName={toolA.name} toolBName={toolB.name} />

        {/* Comparison table */}
        <div className="mb-10 overflow-x-auto rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#1e2a3a' }}>
                <th className="px-5 py-3 text-left text-sm font-semibold text-slate-400 w-1/3">Feature</th>
                <th className="px-5 py-3 text-center text-sm font-bold text-white">{toolA.name}</th>
                <th className="px-5 py-3 text-center text-sm font-bold text-white">{toolB.name}</th>
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Category"
                valA={toolA.category?.name ?? '—'}
                valB={toolB.category?.name ?? '—'} />
              <CompareRow label="Pricing Model"
                valA={PRICING_LABELS[toolA.pricing_model ?? 'free'] ?? toolA.pricing_model ?? '—'}
                valB={PRICING_LABELS[toolB.pricing_model ?? 'free'] ?? toolB.pricing_model ?? '—'} />
              <CompareRow label="Starting Price"
                valA={toolA.starting_price || 'N/A'}
                valB={toolB.starting_price || 'N/A'} />
              <CompareRow label="Free Trial"
                valA={<BoolIcon value={toolA.has_free_trial} />}
                valB={<BoolIcon value={toolB.has_free_trial} />} />
              <CompareRow label="API Available"
                valA={<BoolIcon value={toolA.has_api} />}
                valB={<BoolIcon value={toolB.has_api} />} />
              <CompareRow label="No-Code Friendly"
                valA={<BoolIcon value={toolA.no_code} />}
                valB={<BoolIcon value={toolB.no_code} />} />
              <CompareRow label="GDPR Compliant"
                valA={<BoolIcon value={toolA.gdpr_compliant} />}
                valB={<BoolIcon value={toolB.gdpr_compliant} />} />
              <CompareRow label="Rating"
                valA={toolA.rating_count > 0
                  ? <span className="text-amber-400">{toolA.rating_avg.toFixed(1)}/5 <span className="text-slate-500 text-xs">({toolA.rating_count})</span></span>
                  : <span className="text-slate-600">No ratings</span>}
                valB={toolB.rating_count > 0
                  ? <span className="text-amber-400">{toolB.rating_avg.toFixed(1)}/5 <span className="text-slate-500 text-xs">({toolB.rating_count})</span></span>
                  : <span className="text-slate-600">No ratings</span>} />
              <CompareRow label="Upvotes"
                valA={toolA.upvotes.toLocaleString()}
                valB={toolB.upvotes.toLocaleString()} />
              <CompareRow label="Platforms"
                valA={toolA.platforms?.length ? toolA.platforms.join(', ') : 'Web'}
                valB={toolB.platforms?.length ? toolB.platforms.join(', ') : 'Web'} />
              {(toolA.company_name || toolB.company_name) && (
                <CompareRow label="Company"
                  valA={toolA.company_name ?? '—'}
                  valB={toolB.company_name ?? '—'} />
              )}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <section className="mb-10 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-5 text-lg font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-semibold text-white">Which is better, {toolA.name} or {toolB.name}?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Both are strong{toolA.category?.name ? ` ${toolA.category.name.toLowerCase()}` : ' AI'} tools.
                {toolA.name} has {toolA.upvotes} upvotes, while {toolB.name} has {toolB.upvotes}.
                The best choice depends on your requirements — compare the features above to decide.
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-semibold text-white">Can I try both {toolA.name} and {toolB.name} for free?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {toolA.has_free_trial && toolB.has_free_trial
                  ? `Yes! Both ${toolA.name} and ${toolB.name} offer free trials.`
                  : toolA.has_free_trial
                    ? `${toolA.name} offers a free trial, but ${toolB.name} does not.`
                    : toolB.has_free_trial
                      ? `${toolB.name} offers a free trial, but ${toolA.name} does not.`
                      : `Neither tool currently offers a free trial. Check their websites for the latest deals.`}
              </p>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={`/alternatives/${toolA.slug}`}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white hover:bg-white/5"
            style={{ borderColor: '#1e2a3a' }}>
            {toolA.name} Alternatives
          </Link>
          <Link href={`/alternatives/${toolB.slug}`}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white hover:bg-white/5"
            style={{ borderColor: '#1e2a3a' }}>
            {toolB.name} Alternatives
          </Link>
          <Link href="/compare"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560' }}>
            Compare Other Tools
          </Link>
        </div>
      </div>
    </>
  )
}
