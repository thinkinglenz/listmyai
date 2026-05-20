import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('seo_articles')
    .select('title, excerpt, cover_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return { title: 'Article not found — ListmyAI' }
  return {
    title: `${data.title} — ListmyAI Blog`,
    description: data.excerpt ?? undefined,
    openGraph: {
      title: data.title,
      description: data.excerpt ?? undefined,
      images: data.cover_image ? [data.cover_image] : [],
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('seo_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!article) notFound()

  // Fetch 3 related articles for sidebar
  const { data: related } = await supabase
    .from('seo_articles')
    .select('slug, title, published_at, reading_time')
    .eq('status', 'published')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Back nav */}
      <div className="border-b" style={{ borderColor: '#1e2a3a' }}>
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <Link href="/" className="text-sm font-bold" style={{ color: '#e94560' }}>ListmyAI</Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          {/* Main article */}
          <article>
            {/* Category badge */}
            {article.category && (
              <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
                {article.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl font-black text-white leading-tight sm:text-4xl mb-4">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-slate-500">
              {article.author && <span className="font-medium text-slate-400">{article.author}</span>}
              {article.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(article.published_at)}
                </span>
              )}
              {article.reading_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {article.reading_time} min read
                </span>
              )}
            </div>

            {/* Cover image */}
            {article.cover_image && (
              <div className="mb-8 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.cover_image} alt={article.title}
                  className="w-full object-cover" />
              </div>
            )}

            {/* Excerpt */}
            {article.excerpt && (
              <p className="mb-8 text-lg text-slate-300 leading-relaxed border-l-2 pl-5"
                style={{ borderColor: '#e94560' }}>
                {article.excerpt}
              </p>
            )}

            {/* Body content */}
            {article.content ? (
              <div
                className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-p:text-slate-400 prose-p:leading-relaxed
                  prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white
                  prose-code:text-red-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10
                  prose-blockquote:border-red-500/50 prose-blockquote:text-slate-400
                  prose-ul:text-slate-400 prose-ol:text-slate-400
                  prose-hr:border-white/10"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="text-slate-500 italic">Article content coming soon.</p>
            )}

            {/* CTA footer */}
            <div className="mt-12 rounded-2xl border p-6 text-center"
              style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.05)' }}>
              <p className="font-bold text-white mb-1">Find the right AI tool for you</p>
              <p className="text-sm text-slate-500 mb-4">Take our 60-second quiz and get AI-powered recommendations</p>
              <div className="flex justify-center gap-3">
                <Link href="/find"
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: '#e94560' }}>
                  Take the Quiz →
                </Link>
                <Link href="/directory"
                  className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a' }}>
                  Browse Directory
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Related articles */}
            {related && related.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">More articles</p>
                <div className="space-y-4">
                  {related.map(r => (
                    <Link key={r.slug} href={`/blog/${r.slug}`}
                      className="group block">
                      <p className="text-sm font-semibold text-white group-hover:text-red-400 transition line-clamp-2 mb-1">
                        {r.title}
                      </p>
                      {r.published_at && (
                        <p className="text-xs text-slate-600">{formatDate(r.published_at)}</p>
                      )}
                    </Link>
                  ))}
                </div>
                <Link href="/blog"
                  className="mt-4 flex items-center gap-1 text-xs font-semibold transition hover:opacity-80"
                  style={{ color: '#e94560' }}>
                  All articles <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Find tool widget */}
            <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <p className="font-bold text-white mb-2">Not sure which AI tool to use?</p>
              <p className="text-xs text-slate-500 mb-4">Take our free quiz — get personalised recommendations in 60 seconds</p>
              <Link href="/find"
                className="block w-full rounded-xl py-2.5 text-center text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: '#e94560' }}>
                Find My Tool →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
