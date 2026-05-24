import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, Calendar, Tag, BookOpen, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export const metadata: Metadata = {
  title: 'AI Blog — Latest News, Tutorials & Tool Deep-Dives',
  description: 'Daily blog covering the latest AI news, tool deep-dives, comparisons, tutorials, and prompt engineering tips. Fresh AI content published every day.',
  openGraph: {
    title: 'ListmyAI Blog — Latest AI News & Tool Deep-Dives',
    description: 'Fresh AI news, deep-dives, and tutorials — published daily.',
    url: 'https://listmyai.com/blog',
  },
  alternates: { canonical: 'https://listmyai.com/blog' },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  hero_image_url: string | null
  hero_image_alt: string | null
  tags: string[] | null
  published_at: string
  is_auto_generated: boolean
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function BlogIndex() {
  const { data: postsRaw } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, hero_image_url, hero_image_alt, tags, published_at, is_auto_generated')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(60)

  const posts = (postsRaw ?? []) as Post[]
  const [hero, ...rest] = posts

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ListmyAI Blog',
    url: 'https://listmyai.com/blog',
    description: 'Daily AI news, tool deep-dives, and tutorials from the ListmyAI directory.',
    blogPost: posts.slice(0, 10).map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `https://listmyai.com/blog/${p.slug}`,
      datePublished: p.published_at,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
            <BookOpen className="h-3.5 w-3.5" /> AI is constantly evolving
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Latest Blogs</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Daily AI news, tool deep-dives, tutorials, and comparisons — covering the most important
            developments in the AI ecosystem.
          </p>
        </div>

        {posts.length === 0 && (
          <div className="rounded-2xl border py-20 text-center"
            style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
            <p className="text-4xl">📝</p>
            <p className="mt-3 font-semibold text-white">No posts yet</p>
            <p className="mt-1 text-sm text-slate-500">The first post will land soon. Check back tomorrow.</p>
          </div>
        )}

        {hero && (
          <Link href={`/blog/${hero.slug}`}
            className="group mb-10 block overflow-hidden rounded-3xl border transition hover:border-red-500/40"
            style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-auto">
                {hero.hero_image_url ? (
                  <Image src={hero.hero_image_url} alt={hero.hero_image_alt || hero.title}
                    fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1f2937,#0d1117)' }}>
                    <Sparkles className="h-16 w-16 text-slate-700" />
                  </div>
                )}
                <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  <Sparkles className="h-3 w-3" style={{ color: '#e94560' }} /> Latest
                </div>
              </div>
              <div className="flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(hero.published_at)}</span>
                    {hero.tags && hero.tags.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {hero.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white transition-colors group-hover:text-red-400 sm:text-3xl">
                    {hero.title}
                  </h2>
                  {hero.excerpt && (
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-400">{hero.excerpt}</p>
                  )}
                </div>
                <div className="mt-6 inline-flex items-center gap-1 text-sm font-bold transition group-hover:gap-2" style={{ color: '#e94560' }}>
                  Read article <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map(p => (
              <Link key={p.id} href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border transition hover:border-red-500/40"
                style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
                <div className="relative h-44">
                  {p.hero_image_url ? (
                    <Image src={p.hero_image_url} alt={p.hero_image_alt || p.title}
                      fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#1e2a3a,#0d1117)' }}>
                      <Sparkles className="h-10 w-10 text-slate-700" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3" /> {fmtDate(p.published_at)}
                  </div>
                  <h3 className="line-clamp-2 font-bold text-white transition-colors group-hover:text-red-400">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{p.excerpt}</p>
                  )}
                  <div className="mt-auto pt-3 text-xs font-semibold transition group-hover:underline" style={{ color: '#e94560' }}>
                    Read more →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
