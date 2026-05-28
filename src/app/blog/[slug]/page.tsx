import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { Calendar, Tag, ArrowLeft, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { renderMarkdown } from '@/lib/blog/markdown'
import FaqAccordion from '@/components/blog/FaqAccordion'
import ShareButtons from '@/components/blog/ShareButtons'
import SponsoredSlot from '@/components/blog/SponsoredSlot'
import CommentSection from '@/components/blog/CommentSection'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Faq { q: string; a: string }
interface ExtRef { label: string; url: string }
interface RelatedTool { id: string; slug: string; name: string; tagline: string | null; logo_url: string | null }

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_md: string
  hero_image_url: string | null
  hero_image_alt: string | null
  video_url: string | null
  faqs: Faq[] | null
  tags: string[] | null
  related_tool_ids: string[] | null
  external_refs: ExtRef[] | null
  sponsorship: {
    name: string
    logo_url?: string
    cta_url?: string
    blurb?: string
    image_url?: string
    video_url?: string
  } | null
  meta_title: string | null
  meta_description: string | null
  published_at: string
  is_auto_generated: boolean
  view_count: number
}

interface Props { params: Promise<{ slug: string }> }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Embed YouTube / Vimeo / generic iframe
function VideoEmbed({ url }: { url: string }) {
  let src = url
  // Convert YouTube watch links → embed
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) src = `https://www.youtube-nocookie.com/embed/${yt[1]}`
  // Convert Vimeo links → embed
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) src = `https://player.vimeo.com/video/${vi[1]}`

  return (
    <div className="my-8 aspect-video overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a' }}>
      <iframe
        src={src}
        title="Embedded video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase
    .from('blog_posts')
    .select('title, meta_title, meta_description, excerpt, hero_image_url, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return { title: 'Article not found — ListmyAI Blog' }

  const title = data.meta_title ?? `${data.title} — ListmyAI Blog`
  const description = data.meta_description ?? data.excerpt ?? undefined

  return {
    title,
    description,
    openGraph: {
      title: data.meta_title ?? data.title,
      description,
      url: `https://listmyai.com/blog/${slug}`,
      type: 'article',
      publishedTime: data.published_at,
      images: data.hero_image_url ? [{ url: data.hero_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.meta_title ?? data.title,
      description,
      images: data.hero_image_url ? [data.hero_image_url] : [],
    },
    alternates: { canonical: `https://listmyai.com/blog/${slug}` },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  // Fetch post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!post) notFound()

  const p = post as Post

  // Increment view count (fire-and-forget, no await so it doesn't block render)
  supabase.rpc('increment_blog_view', { p_slug: slug }).then(() => {})

  // Fetch related tools by ID if any
  let relatedTools: RelatedTool[] = []
  if (p.related_tool_ids && p.related_tool_ids.length > 0) {
    const { data: tools } = await supabase
      .from('ai_tools')
      .select('id, slug, name, tagline, logo_url')
      .in('id', p.related_tool_ids.slice(0, 6))
      .in('status', ['active', 'approved', 'claimed', 'verified'])
    relatedTools = (tools ?? []) as RelatedTool[]
  }

  // Fetch 4 recent posts for sidebar (excluding current)
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('slug, title, published_at, hero_image_url')
    .eq('status', 'published')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(4)

  const postUrl = `https://listmyai.com/blog/${slug}`
  const bodyHtml = renderMarkdown(p.body_md)
  const faqs: Faq[] = Array.isArray(p.faqs) ? p.faqs : []
  const externalRefs: ExtRef[] = Array.isArray(p.external_refs) ? p.external_refs : []

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.excerpt ?? undefined,
    image: p.hero_image_url ?? undefined,
    datePublished: p.published_at,
    dateModified: p.published_at,
    author: { '@type': 'Organization', name: 'ListmyAI', url: 'https://listmyai.com' },
    publisher: {
      '@type': 'Organization',
      name: 'ListmyAI',
      logo: { '@type': 'ImageObject', url: 'https://listmyai.com/og-image.png' },
    },
    url: postUrl,
    mainEntityOfPage: postUrl,
  }

  const faqLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://listmyai.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://listmyai.com/blog' },
      { '@type': 'ListItem', position: 3, name: p.title, item: postUrl },
    ],
  }

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen" style={{ background: '#0d1117' }}>
        {/* Back nav */}
        <div className="border-b" style={{ borderColor: '#1e2a3a' }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/blog"
              className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> All articles
            </Link>
            <Link href="/" className="text-sm font-bold" style={{ color: '#e94560' }}>ListmyAI</Link>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-4 pt-4 text-xs text-slate-600">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-slate-400 transition">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-slate-400 transition">Blog</Link></li>
              <li>/</li>
              <li className="truncate max-w-[200px] text-slate-500" aria-current="page">{p.title}</li>
            </ol>
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            {/* ── Main article ──────────────────────────────────────────── */}
            <article>
              {/* Tags */}
              {p.tags && p.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {p.tags.map(tag => (
                    <span key={tag}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
                      <Tag className="h-3 w-3" /> {tag}
                    </span>
                  ))}
                  {p.is_auto_generated && (
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>
                      <Sparkles className="h-3 w-3" /> AI-curated
                    </span>
                  )}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{p.title}</h1>

              {/* Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {fmtDate(p.published_at)}
                </span>
                {p.view_count > 0 && (
                  <span className="text-slate-600">· {p.view_count.toLocaleString()} views</span>
                )}
              </div>

              {/* Excerpt */}
              {p.excerpt && (
                <p className="mt-5 border-l-2 pl-4 text-base leading-relaxed text-slate-300"
                  style={{ borderColor: '#e94560' }}>
                  {p.excerpt}
                </p>
              )}

              {/* Hero image */}
              {p.hero_image_url && (
                <div className="relative mt-6 h-64 overflow-hidden rounded-2xl sm:h-80 lg:h-96">
                  <Image
                    src={p.hero_image_url}
                    alt={p.hero_image_alt ?? p.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
              )}

              {/* Video embed */}
              {p.video_url && <VideoEmbed url={p.video_url} />}

              {/* Sponsored slot — top (before body) */}
              <SponsoredSlot sponsorship={p.sponsorship} />

              {/* Body */}
              <div
                className="mt-6"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />

              {/* Share buttons */}
              <ShareButtons url={postUrl} title={p.title} />

              {/* Related tools — internal backlinks */}
              {relatedTools.length > 0 && (
                <section className="my-10" aria-labelledby="related-tools-heading">
                  <h2 id="related-tools-heading"
                    className="mb-4 text-xl font-black text-white">
                    AI Tools Mentioned in This Article
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {relatedTools.map(tool => (
                      <Link key={tool.id} href={`/tool/${tool.slug}`}
                        className="group flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition hover:border-red-500/40"
                        style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
                        {tool.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tool.logo_url} alt={tool.name}
                            className="h-9 w-9 flex-shrink-0 rounded-lg object-contain" />
                        ) : (
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ background: '#1e2a3a' }}>
                            {tool.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white transition-colors group-hover:text-red-400 truncate">
                            {tool.name}
                          </p>
                          {tool.tagline && (
                            <p className="text-xs text-slate-500 truncate">{tool.tagline}</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-700 transition group-hover:text-red-400" />
                      </Link>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    Explore more at{' '}
                    <Link href="/directory" className="underline transition hover:text-slate-400">
                      the full AI tools directory →
                    </Link>
                  </p>
                </section>
              )}

              {/* FAQ accordion */}
              {faqs.length > 0 && <FaqAccordion faqs={faqs} />}

              {/* External references */}
              {externalRefs.length > 0 && (
                <section className="my-10">
                  <h2 className="mb-3 text-lg font-bold text-white">Sources & Further Reading</h2>
                  <ul className="space-y-2">
                    {externalRefs.map((ref, i) => (
                      <li key={i}>
                        <a href={ref.url} target="_blank" rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-sm font-medium transition hover:underline"
                          style={{ color: '#e94560' }}>
                          <ExternalLink className="h-3.5 w-3.5" /> {ref.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Sponsored slot — bottom (mid/end of article) */}
              <SponsoredSlot sponsorship={p.sponsorship} />

              {/* CTA */}
              <div className="my-10 rounded-2xl border p-6 text-center"
                style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.05)' }}>
                <p className="font-bold text-white">Find the right AI tool for you</p>
                <p className="mt-1 text-sm text-slate-500 mb-4">
                  Browse 1,000+ AI tools in the ListmyAI directory
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/directory"
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{ background: '#e94560' }}>
                    Browse Directory
                  </Link>
                  <Link href="/trending"
                    className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
                    style={{ borderColor: '#1e2a3a' }}>
                    Top Trending Tools
                  </Link>
                </div>
              </div>

              {/* Comments */}
              <CommentSection postId={p.id} />
            </article>

            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside className="space-y-6">
              {/* Recent posts */}
              {recentPosts && recentPosts.length > 0 && (
                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">More articles</p>
                  <div className="space-y-4">
                    {(recentPosts as { slug: string; title: string; published_at: string; hero_image_url: string | null }[]).map(r => (
                      <Link key={r.slug} href={`/blog/${r.slug}`} className="group flex gap-3">
                        {r.hero_image_url ? (
                          <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image src={r.hero_image_url} alt={r.title} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ background: '#1e2a3a' }}>
                            <Sparkles className="h-5 w-5 text-slate-700" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-red-400">
                            {r.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
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

              {/* Tags cloud */}
              {p.tags && p.tags.length > 0 && (
                <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map(tag => (
                      <span key={tag}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Directory CTA */}
              <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <p className="font-bold text-white mb-2">Not sure which AI tool to use?</p>
                <p className="text-xs text-slate-500 mb-4">
                  Browse 1,000+ tools in our free AI directory, updated daily.
                </p>
                <Link href="/directory"
                  className="block w-full rounded-xl py-2.5 text-center text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: '#e94560' }}>
                  Explore Tools →
                </Link>
              </div>

              {/* Advertise CTA */}
              <div className="rounded-2xl border p-5 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Want to sponsor a post?</p>
                <a href="mailto:listmyai@gmail.com?subject=Sponsored+Blog+Post"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline"
                  style={{ color: '#e94560' }}>
                  listmyai@gmail.com →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
