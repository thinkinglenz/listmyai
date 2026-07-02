import { Suspense } from 'react'
import type { Metadata } from 'next'
import SearchBar from '@/components/search/SearchBar'
import FilterSidebar from '@/components/search/FilterSidebar'
import ToolCard from '@/components/listing/ToolCard'
import { AiTool, Category } from '@/types'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Browse All AI Tools — Directory',
  description: 'Browse and filter 19,000+ AI tools by category, pricing, and features. Find the perfect AI chatbot, image generator, code assistant, writing tool, or automation platform for your needs.',
  openGraph: {
    title: 'AI Tools Directory — Browse 19,000+ Tools by Category',
    description: 'Filter AI tools by category, pricing model, and features. Compare chatbots, image generators, code assistants, and more.',
    url: 'https://listmyai.com/directory',
  },
  alternates: { canonical: 'https://listmyai.com/directory' },
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface Props {
  searchParams: Promise<{ q?: string; category?: string; pricing?: string; sort?: string; trial?: string; api?: string; promo?: string }>
}

export const dynamic = 'force-dynamic'

export default async function DirectoryPage({ searchParams }: Props) {
  const sp = await searchParams
  const q        = sp.q?.toLowerCase() ?? ''
  const category = sp.category ?? ''
  const pricing  = sp.pricing ?? ''
  const sort     = sp.sort ?? 'popular'
  const trial    = sp.trial === '1'
  const api      = sp.api === '1'

  const supabase = getSupabase()
  if (!supabase) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="text-slate-400">Loading directory…</p>
      </div>
    )
  }

  // ── Fetch categories ──────────────────────────────────────────────────────
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, slug, name, icon, color')
    .order('name')

  // Count tools per category using parallel lightweight count queries
  const countResults = await Promise.all(
    (categoriesRaw ?? []).map(c =>
      supabase
        .from('ai_tools')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('category_id', c.id)
        .then(r => ({ id: c.id, count: r.count ?? 0 }))
    )
  )
  const countMap = new Map<string, number>()
  for (const r of countResults) countMap.set(String(r.id), r.count)

  // Get total tool count
  const { count: totalCount } = await supabase
    .from('ai_tools')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  const categories: Category[] = (categoriesRaw ?? []).map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon ?? 'Layers',
    color: c.color ?? '#6366f1',
    count: countMap.get(String(c.id)) ?? 0,
  }))

  // Build category lookup map (id → Category)
  const catMap = new Map<string, Category>()
  for (const c of categories) catMap.set(String(c.id), c)

  // ── Resolve category filter once (used by both organic + sponsored) ──────
  let filterCatId: string | null = null
  if (category) {
    const { data: catRow } = await supabase
      .from('categories').select('id').eq('slug', category).maybeSingle()
    filterCatId = catRow ? String(catRow.id) : '00000000-0000-0000-0000-000000000000'
  }

  const TOOL_COLS = `
      id, slug, name, tagline, website,
      pricing_model, starting_price, has_free_trial, has_api,
      status, is_featured, is_sponsored,
      upvotes, rating_avg, rating_count,
      view_count, click_count, category_id,
      platforms, promo_code, promo_desc,
      created_at, updated_at, claimed, submitted_by
    `

  // Applies the user's active filters to any tools query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyFilters(qb: any) {
    if (q) qb = qb.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`)
    if (filterCatId) qb = qb.eq('category_id', filterCatId)
    if (pricing) qb = qb.eq('pricing_model', pricing)
    if (trial)   qb = qb.eq('has_free_trial', true)
    if (api)     qb = qb.eq('has_api', true)
    return qb
  }

  // ── Organic results ───────────────────────────────────────────────────────
  let query = applyFilters(
    supabase.from('ai_tools').select(TOOL_COLS).eq('status', 'active')
  )

  if (sort === 'popular') query = query.order('upvotes', { ascending: false })
  else if (sort === 'rating') query = query.order('rating_avg', { ascending: false })
  else if (sort === 'name') query = query.order('name', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  query = query.limit(200)

  // ── Sponsored slots (Amazon-style): relevant paid listings pinned on top ──
  const sponsoredQuery = applyFilters(
    supabase.from('ai_tools').select(TOOL_COLS).eq('status', 'active').eq('is_sponsored', true)
  ).order('upvotes', { ascending: false }).limit(2)

  const [{ data: toolsRaw, error }, { data: sponsoredRaw }] = await Promise.all([query, sponsoredQuery])

  // ── Shape data to match AiTool type ───────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape = (t: any): AiTool => {
    const cat = catMap.get(String(t.category_id))
    return {
      id: String(t.id),
      slug: t.slug,
      name: t.name,
      tagline: t.tagline ?? '',
      website: t.website ?? '',
      category: cat ? {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon ?? 'Layers',
        color: cat.color ?? '#6366f1',
        count: 0,
      } : undefined,
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
    }
  }

  // Sponsored slots first (tagged), then organic results without duplicates
  const sponsored: AiTool[] = (sponsoredRaw ?? []).map(shape)
  const sponsoredIds = new Set(sponsored.map(t => t.id))
  const organic: AiTool[] = (toolsRaw ?? []).map(shape).filter((t: AiTool) => !sponsoredIds.has(t.id))
  const tools: AiTool[] = [...sponsored, ...organic]

  const activeCatName = categories.find(c => c.slug === category)?.name

  const directoryLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category ? `${activeCatName ?? 'AI'} Tools` : 'AI Tools Directory',
    url: `https://listmyai.com/directory${category ? `?category=${category}` : ''}`,
    description: 'Browse and compare AI tools by category, pricing, and features.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tools.length,
      itemListElement: tools.slice(0, 20).map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://listmyai.com/tools/${t.slug}`,
        name: t.name,
      })),
    },
  }

  const displayCount = q || category || pricing || trial || api ? tools.length : (totalCount ?? tools.length)

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryLd) }} />
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      {/* ── Header — compact on mobile ─────────────────────────────────── */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          {activeCatName ? `${activeCatName} Tools` : 'AI Tools Directory'}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 sm:mt-1 sm:text-base">
          {activeCatName
            ? `Browse the best ${activeCatName.toLowerCase()} AI tools`
            : 'Discover and compare the best AI tools — updated daily'}
        </p>
        <div className="mt-3 sm:mt-4 sm:max-w-xl">
          <Suspense>
            <SearchBar defaultValue={q} />
          </Suspense>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Database error: {error.message}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        {/* Sidebar — filter chips on mobile, sidebar on desktop */}
        <Suspense>
          <FilterSidebar categories={categories} />
        </Suspense>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {/* Results count */}
          <div className="mb-3 sm:mb-5">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">{displayCount.toLocaleString()}</span> tools
              {q && <span> matching &ldquo;<span className="text-brand-red">{q}</span>&rdquo;</span>}
              {activeCatName && !q && <span> in <span className="text-brand-red">{activeCatName}</span></span>}
            </p>
          </div>

          {tools.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center sm:px-12">
              <p className="text-2xl">🤔</p>
              <p className="mt-2 font-semibold text-white">No tools found</p>
              <p className="mt-1 text-sm text-slate-500">
                {q || category || pricing
                  ? 'Try adjusting your filters or search terms'
                  : 'The database is empty. Add tools via the admin scraper or submit form.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: compact list cards | Desktop: grid cards */}
              {/* Mobile list (hidden on sm+) */}
              <div className="flex flex-col gap-2.5 sm:hidden">
                {tools.map(tool => <ToolCard key={tool.id} tool={tool} variant="list" />)}
              </div>
              {/* Desktop grid (hidden on mobile) */}
              <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-3">
                {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
