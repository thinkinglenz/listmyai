import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, Sparkles } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'AI Tool Alternatives — Find Better Options for Every Tool',
  description: 'Explore alternatives to every AI tool in our directory. Compare features, pricing, and reviews to find the best option for your needs.',
  openGraph: {
    title: 'AI Tool Alternatives | ListmyAI',
    description: 'Find better alternatives to any AI tool. Compare 19,000+ options across 20+ categories.',
    url: 'https://listmyai.com/alternatives',
  },
  alternates: { canonical: 'https://listmyai.com/alternatives' },
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function AlternativesIndex() {
  const sb = getSupabase()
  let tools: { slug: string; name: string; tagline: string | null; upvotes: number }[] = []
  if (sb) {
    const { data } = await sb
      .from('ai_tools')
      .select('slug, name, tagline, upvotes')
      .eq('status', 'active')
      .order('upvotes', { ascending: false })
      .limit(100)
    tools = data ?? []
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" /> {tools.length}+ Tools
        </div>
        <h1 className="text-4xl font-black text-white">AI Tool Alternatives</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Looking for a better option? Browse alternatives to every AI tool in our directory.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(tool => (
          <Link key={tool.slug} href={`/alternatives/${tool.slug}`}
            className="group flex items-center justify-between rounded-xl border px-5 py-3.5 transition hover:bg-white/[0.03]"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <div className="min-w-0">
              <p className="font-semibold text-white group-hover:text-red-400 transition-colors">{tool.name} Alternatives</p>
              {tool.tagline && <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{tool.tagline}</p>}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-red-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
