import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface Article {
  id: number
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  reading_time: number | null
  category: string | null
  author: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function BlogPage() {
  const supabase = getSupabase()

  let posts: Article[] = []
  let error: { message: string } | null = null

  if (supabase) {
    const res = await supabase
      .from('seo_articles')
      .select('id, slug, title, excerpt, cover_image, published_at, reading_time, category, author')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50)
    posts = res.data ?? []
    error = res.error
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Hero */}
      <div className="border-b" style={{ borderColor: '#1e2a3a', background: 'linear-gradient(135deg,#0f172a 0%,#0d1b2e 100%)' }}>
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
            <BookOpen className="h-3.5 w-3.5" /> AI Insights & Guides
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">ListmyAI Blog</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-400">
            In-depth guides, comparisons, and news about the best AI tools — curated for builders and creators.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            Could not load articles: {error.message}
          </div>
        )}

        {posts.length === 0 && !error && (
          <div className="rounded-2xl border p-16 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-3xl mb-3">✍️</p>
            <p className="font-bold text-white text-lg">Blog coming soon</p>
            <p className="mt-2 text-sm text-slate-500">
              We&apos;re working on in-depth AI tool guides and comparisons. Check back soon!
            </p>
            <Link href="/directory"
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Browse AI Tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {posts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group rounded-2xl border overflow-hidden transition hover:border-red-500/30"
                style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                {/* Cover image */}
                {post.cover_image ? (
                  <div className="aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.cover_image} alt={post.title}
                      className="h-full w-full object-cover transition group-hover:scale-105 duration-500" />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${i % 2 === 0 ? '#1e2a3a,#0f172a' : '#0f172a,#1e2a3a'})` }}>
                    <BookOpen className="h-10 w-10 text-slate-700" />
                  </div>
                )}

                <div className="p-5">
                  {post.category && (
                    <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560' }}>
                      {post.category}
                    </span>
                  )}
                  <h2 className="font-bold text-white leading-snug mb-2 group-hover:text-red-400 transition line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(post.published_at)}
                      </span>
                    )}
                    {post.reading_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.reading_time} min read
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
