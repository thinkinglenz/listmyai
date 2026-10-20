// One editorial.
//
// Article schema only, deliberately. Review schema would require a rating,
// and we do not issue one — inventing a score to win a rich snippet is the
// same class of fabrication as the review counts this site has been cleaning
// out all month.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Info } from 'lucide-react'
import { getEditorial, type Editorial } from '@/lib/editorials'
import { renderMarkdown } from '@/lib/blog/markdown'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

const BASE = 'https://listmyai.com'

async function relatedTool(toolId: string | null) {
  if (!toolId) return null
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await sb
    .from('ai_tools')
    .select('slug, name, tagline, website, categories(name, slug)')
    .eq('id', toolId)
    .maybeSingle()
  return data as
    | { slug: string; name: string; tagline: string | null; website: string | null
        categories: { name: string; slug: string } | { name: string; slug: string }[] | null }
    | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const e = await getEditorial(slug)
  if (!e) return { title: 'Editorial not found' }
  const description = e.standfirst ?? `An editorial look at ${e.title}.`
  return {
    title: e.title,
    description,
    openGraph: {
      title: e.title, description, type: 'article',
      url: `${BASE}/editorial/${slug}`,
      publishedTime: e.published_at ?? undefined,
    },
    twitter: { card: 'summary_large_image', title: e.title, description },
    alternates: { canonical: `${BASE}/editorial/${slug}` },
  }
}

export default async function EditorialPage({ params }: Props) {
  const { slug } = await params
  const e: Editorial | null = await getEditorial(slug)
  if (!e) notFound()

  const tool = await relatedTool(e.tool_id)
  const cat = Array.isArray(tool?.categories) ? tool?.categories[0] : tool?.categories

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: e.title,
    description: e.standfirst ?? undefined,
    datePublished: e.published_at ?? undefined,
    url: `${BASE}/editorial/${slug}`,
    publisher: { '@type': 'Organization', name: 'ListmyAI', url: BASE },
    // Only real outbound references, never invented ones.
    citation: (e.sources ?? []).map(s => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/editorial" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All editorials
      </Link>

      <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#e94560' }}>Editorial</p>
      <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">{e.title}</h1>
      {e.standfirst && <p className="mt-4 text-lg leading-relaxed text-slate-400">{e.standfirst}</p>}

      <p className="mt-5 text-xs text-slate-600">
        {e.published_at && new Date(e.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        {' · Written independently by ListmyAI. Not paid placement.'}
      </p>

      {tool && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border p-4"
          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div>
            <Link href={`/tools/${tool.slug}`} className="font-bold text-white hover:underline">{tool.name}</Link>
            {tool.tagline && <p className="mt-0.5 text-sm text-slate-400">{tool.tagline}</p>}
          </div>
          <div className="ml-auto flex gap-2">
            {cat && (
              <Link href={`/directory?category=${cat.slug}`}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-300"
                style={{ borderColor: '#1e2a3a' }}>{cat.name}</Link>
            )}
            {tool.website && (
              <a href={tool.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: '#e94560' }}>
                <ExternalLink className="h-3 w-3" /> Visit
              </a>
            )}
          </div>
        </div>
      )}

      <div className="prose prose-invert mt-10 max-w-none prose-headings:font-bold prose-a:text-[#e94560]"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(e.body_md) }} />

      {e.coverage_note && (
        <div className="mt-10 flex gap-3 rounded-2xl border p-5"
          style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
          <Info className="mt-0.5 h-4 w-4 flex-none text-slate-500" />
          <p className="text-sm leading-relaxed text-slate-400">{e.coverage_note}</p>
        </div>
      )}

      {e.sources?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Sources</h2>
          <ul className="space-y-2">
            {e.sources.map(s => (
              <li key={s.url} className="text-sm">
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow"
                  className="text-slate-300 hover:underline">{s.label}</a>
                {s.published && <span className="ml-2 text-slate-600">{s.published}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 border-t pt-6 text-xs leading-relaxed text-slate-600" style={{ borderColor: '#1e2a3a' }}>
        Own this product? Editorials are written independently and are not edited by the companies
        they cover, but corrections and new information are welcome — sign in to your dashboard to
        send them.
      </p>
    </article>
  )
}
