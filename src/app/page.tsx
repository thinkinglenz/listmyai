import Link from 'next/link'
import { ArrowRight, Zap, Star, TrendingUp, CheckCircle2, Sparkles, SlidersHorizontal, BarChart2, List } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import CategoryGrid from '@/components/listing/CategoryGrid'
import ToolCard from '@/components/listing/ToolCard'
import { AiTool, Category } from '@/types'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function HomePage() {
  const supabase = getSupabase()

  // ── Fetch real data ─────────────────────────────────────────────────────────
  let categories: Category[] = []
  let featuredTools: AiTool[] = []
  let recentTools: AiTool[] = []
  let totalCount = 0

  if (supabase) {
    // Categories with tool counts
    const { data: cats } = await supabase
      .from('categories')
      .select('id, slug, name, icon, color')
      .order('name')

    if (cats) {
      // Get counts per category
      const { data: toolRows } = await supabase
        .from('ai_tools')
        .select('category_id')
        .eq('status', 'active')

      const countMap = new Map<string, number>()
      for (const t of toolRows ?? []) {
        const cid = String(t.category_id)
        countMap.set(cid, (countMap.get(cid) ?? 0) + 1)
      }

      categories = cats.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon ?? 'Layers',
        color: c.color ?? '#6366f1',
        count: countMap.get(String(c.id)) ?? 0,
      })).filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
    }

    // Total tools count
    const { count } = await supabase
      .from('ai_tools')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    totalCount = count ?? 0

    // Featured / top tools (by upvotes, then rating)
    const { data: featured } = await supabase
      .from('ai_tools')
      .select('id, slug, name, tagline, website, pricing_model, starting_price, has_free_trial, has_api, status, is_featured, is_sponsored, upvotes, rating_avg, rating_count, view_count, click_count, platforms, promo_code, promo_desc, created_at, updated_at, category_id, claimed, submitted_by')
      .eq('status', 'active')
      .order('upvotes', { ascending: false })
      .limit(6)

    if (featured) {
      const catMap = new Map<string, Category>()
      for (const c of categories) catMap.set(String(c.id), c)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      featuredTools = featured.map((t: any) => ({
        id: String(t.id),
        slug: t.slug,
        name: t.name,
        tagline: t.tagline ?? '',
        website: t.website ?? '',
        category: catMap.get(String(t.category_id)),
        pricing_model: t.pricing_model ?? 'free',
        starting_price: t.starting_price ?? '',
        has_free_trial: t.has_free_trial ?? false,
        has_api: t.has_api ?? false,
        no_code: true,
        gdpr_compliant: false,
        status: t.status ?? 'active',
        claimed: t.claimed ?? false,
        submitted_by: t.submitted_by ?? undefined,
        is_featured: t.is_featured ?? false,
        is_sponsored: t.is_sponsored ?? false,
        upvotes: t.upvotes ?? 0,
        rating_avg: t.rating_avg ?? 0,
        rating_count: t.rating_count ?? 0,
        view_count: t.view_count ?? 0,
        click_count: t.click_count ?? 0,
        platforms: t.platforms ?? [],
        promo_code: t.promo_code ?? undefined,
        promo_desc: t.promo_desc ?? undefined,
        created_at: t.created_at ?? new Date().toISOString(),
        updated_at: t.updated_at ?? new Date().toISOString(),
      }))
    }

    // Recently added tools
    const { data: recent } = await supabase
      .from('ai_tools')
      .select('id, slug, name, tagline, website, pricing_model, starting_price, has_free_trial, has_api, status, is_featured, is_sponsored, upvotes, rating_avg, rating_count, view_count, click_count, platforms, promo_code, promo_desc, created_at, updated_at, category_id, claimed, submitted_by')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recent) {
      const catMap = new Map<string, Category>()
      for (const c of categories) catMap.set(String(c.id), c)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentTools = recent.map((t: any) => ({
        id: String(t.id),
        slug: t.slug,
        name: t.name,
        tagline: t.tagline ?? '',
        website: t.website ?? '',
        category: catMap.get(String(t.category_id)),
        pricing_model: t.pricing_model ?? 'free',
        starting_price: t.starting_price ?? '',
        has_free_trial: t.has_free_trial ?? false,
        has_api: t.has_api ?? false,
        no_code: true,
        gdpr_compliant: false,
        status: t.status ?? 'active',
        claimed: t.claimed ?? false,
        submitted_by: t.submitted_by ?? undefined,
        is_featured: t.is_featured ?? false,
        is_sponsored: t.is_sponsored ?? false,
        upvotes: t.upvotes ?? 0,
        rating_avg: t.rating_avg ?? 0,
        rating_count: t.rating_count ?? 0,
        view_count: t.view_count ?? 0,
        click_count: t.click_count ?? 0,
        platforms: t.platforms ?? [],
        promo_code: t.promo_code ?? undefined,
        promo_desc: t.promo_desc ?? undefined,
        created_at: t.created_at ?? new Date().toISOString(),
        updated_at: t.updated_at ?? new Date().toISOString(),
      }))
    }
  }

  const toolLabel = totalCount > 0 ? `${totalCount}+` : '400+'

  const STATS = [
    { value: toolLabel, label: 'AI Tools Listed' },
    { value: `${categories.length}`, label: 'Categories' },
    { value: 'Free', label: 'First 6 Months' },
    { value: '24h', label: 'New Tools Daily' },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{background:'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)'}}>
        <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.12) 0%,transparent 70%)'}} />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" style={{background:'rgba(233,69,96,0.07)'}} />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm" style={{borderColor:'rgba(233,69,96,0.25)',background:'rgba(233,69,96,0.1)',color:'#e94560'}}>
            <Sparkles className="h-3.5 w-3.5" />
            {toolLabel} AI tools — growing daily
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover the Best{' '}
            <span style={{background:'linear-gradient(90deg,#e94560,#f87171)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              AI Tools
            </span>
            {' '}& Deals
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed" style={{color:'#94a3b8'}}>
            The AI tools directory — browse {toolLabel} AI products, compare pricing,
            find free trials, and grab exclusive promo codes. All in one place.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar large placeholder="Search AI tools, categories, use cases…" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs" style={{color:'#475569'}}>Popular:</span>
            {['Image Generation','Code Assistant','Writing','Automation','Chatbot'].map(s => (
              <Link key={s} href={`/directory?q=${encodeURIComponent(s)}`}
                className="rounded-full px-3 py-1 text-xs transition hover:text-white"
                style={{border:'1px solid #1e2a3a',background:'rgba(255,255,255,0.03)',color:'#94a3b8'}}>
                {s}
              </Link>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{border:'1px solid #1e2a3a',background:'rgba(255,255,255,0.03)'}}>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="mt-1 text-xs" style={{color:'#64748b'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="border-b" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ borderColor: '#1e2a3a' }}>
            {[
              {
                icon: SlidersHorizontal, color: '#6366f1',
                title: 'Find the right AI tool',
                desc: 'Answer 5 quick questions — our recommendation engine returns personalised tool picks for your exact use case.',
                cta: 'Start matching', href: '/find',
              },
              {
                icon: BarChart2, color: '#10b981',
                title: 'Compare side by side',
                desc: 'Instantly compare any two AI tools across features, pricing, and fit — powered by live ListmyAI data.',
                cta: 'Compare tools', href: '/compare',
              },
              {
                icon: List, color: '#e94560',
                title: 'List your AI tool',
                desc: 'Get your tool in front of thousands of users actively searching for AI solutions. First 6 months free.',
                cta: 'Submit a listing', href: '/submit',
              },
            ].map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="flex flex-col gap-4 px-6 py-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${f.color}18` }}>
                    <Icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
                  </div>
                  <Link href={f.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:gap-2.5"
                    style={{ color: f.color }}>
                    {f.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
                <p className="mt-1 text-sm" style={{color:'#64748b'}}>Find AI tools for every use case</p>
              </div>
              <Link href="/directory" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
                All categories <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <CategoryGrid categories={categories} />
          </section>
        )}

        {/* Featured Tools */}
        {featuredTools.length > 0 && (
          <section className="py-4">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm" style={{color:'#e94560'}}>
                  <Zap className="h-4 w-4" /> Featured
                </div>
                <h2 className="text-2xl font-bold text-white">Top AI Tools Right Now</h2>
              </div>
              <Link href="/directory?sort=popular" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </section>
        )}

        {/* Recently Added */}
        {recentTools.length > 0 && (
          <section className="py-4 pb-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm" style={{color:'#f59e0b'}}>
                  <TrendingUp className="h-4 w-4" /> Trending
                </div>
                <h2 className="text-2xl font-bold text-white">Recently Added</h2>
              </div>
              <Link href="/directory?sort=newest" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
                See newest <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentTools.map(tool => <ToolCard key={tool.id} tool={tool} variant="list" />)}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mb-20 overflow-hidden rounded-3xl relative" style={{background:'linear-gradient(135deg,#0f172a,#0f1e35,#0f172a)',border:'1px solid #1e2a3a'}}>
          <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.1) 0%,transparent 70%)'}} />
          <div className="relative px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{background:'rgba(233,69,96,0.12)',border:'1px solid rgba(233,69,96,0.2)'}}>
              <Star className="h-7 w-7" style={{color:'#e94560'}} />
            </div>
            <h2 className="text-3xl font-black text-white">List Your AI Tool — Free for 6 Months</h2>
            <p className="mx-auto mt-3 max-w-xl" style={{color:'#94a3b8'}}>
              Get your AI product in front of thousands of buyers and researchers.
              Submit your listing today — first 6 months completely free.
            </p>
            <ul className="mx-auto mt-5 mb-8 flex max-w-lg flex-wrap justify-center gap-3 text-sm" style={{color:'#cbd5e1'}}>
              {['No credit card required','Live in minutes','Add promo codes & deals','Verified badge available'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{color:'#e94560'}} />{f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/submit"
                className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{background:'#e94560',boxShadow:'0 0 24px rgba(233,69,96,0.3)'}}>
                Submit Your AI Tool <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/directory"
                className="rounded-xl px-8 py-3.5 text-sm transition hover:text-white"
                style={{border:'1px solid #1e2a3a',color:'#94a3b8'}}>
                Browse the Directory
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
