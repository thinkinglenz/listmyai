import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { TrendingUp, Zap, Sparkles } from 'lucide-react'
import TrendingList, { type TrendingTool } from '@/components/listing/TrendingList'

export const dynamic = 'force-dynamic'
export const revalidate = 1800 // 30 min

export const metadata: Metadata = {
  title: 'Top Trending AI Tools',
  description: 'A simple, transparent list of the top trending AI tools right now — ranked by community signal, with pricing, category, and direct links. Updated weekly.',
  openGraph: {
    title: 'Top Trending AI Tools — ListmyAI',
    description: 'A simple, transparent leaderboard of the most popular AI tools. No fluff. Updated weekly.',
    url: 'https://listmyai.com/trending',
  },
  alternates: { canonical: 'https://listmyai.com/trending' },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function TrendingPage() {
  const { data: toolsRaw } = await supabase
    .from('ai_tools')
    .select('id, slug, name, tagline, website, logo_url, pricing_model, starting_price, has_free_trial, promo_code, upvotes, rating_avg, rating_count, is_featured, categories(name)')
    .in('status', ['active', 'approved', 'claimed', 'verified'])
    .order('is_featured', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('rating_avg', { ascending: false })
    .limit(100)

  const tools = (toolsRaw ?? []) as TrendingTool[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" /> Refreshed weekly
        </div>
        <h1 className="text-4xl font-black text-white sm:text-5xl">Top Trending AI Tools</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          A simple, transparent list of the AI tools getting the most attention right now —
          ranked by community signal, with pricing, category, and direct links.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Ranked by community upvotes</span>
        <span className="text-slate-700">·</span>
        <span>Updated weekly from public AI directories</span>
      </div>

      {/* List */}
      {tools.length > 0 ? (
        <TrendingList tools={tools} />
      ) : (
        <div className="rounded-2xl border py-20 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
          <p className="text-4xl">📋</p>
          <p className="mt-3 font-semibold text-white">No trending tools yet</p>
          <p className="mt-1 text-sm text-slate-500">Check back soon.</p>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-10 rounded-2xl border p-6 text-center"
        style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#e94560' }}>
          <Zap className="h-3.5 w-3.5" /> Submit your AI tool
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Want your tool on this list? Submit your listing — it&apos;s free for the first 6 months.
        </p>
        <Link href="/submit"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#e94560' }}>
          Submit Your Tool
        </Link>
      </div>
    </div>
  )
}
