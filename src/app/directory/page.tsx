import { Suspense } from 'react'
import SearchBar from '@/components/search/SearchBar'
import FilterSidebar from '@/components/search/FilterSidebar'
import ToolCard from '@/components/listing/ToolCard'
import { AiTool, Category } from '@/types'
import { LayoutGrid } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

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

  const categories: Category[] = (categoriesRaw ?? []).map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon ?? 'Layers',
    color: c.color ?? '#6366f1',
    count: 0,
  }))

  // Build category lookup map (id → Category)
  const catMap = new Map<string, Category>()
  for (const c of categories) catMap.set(String(c.id), c)

  // ── Build tools query ─────────────────────────────────────────────────────
  let query = supabase
    .from('ai_tools')
    .select(`
      id, slug, name, tagline, website,
      pricing_model, starting_price, has_free_trial, has_api,
      status, is_featured, is_sponsored,
      upvotes, rating_avg, rating_count,
      view_count, click_count, category_id,
      platforms, promo_code, promo_desc,
      created_at, updated_at, claimed, submitted_by
    `)
    .eq('status', 'active')

  if (q) {
    query = query.or(`name.ilike.%${q}%,tagline.ilike.%${q}%`)
  }

  if (category) {
    const { data: catRow } = await supabase
      .from('categories').select('id').eq('slug', category).maybeSingle()
    if (catRow) query = query.eq('category_id', catRow.id)
    else query = query.eq('category_id', '00000000-0000-0000-0000-000000000000')
  }

  if (pricing) query = query.eq('pricing_model', pricing)
  if (trial)   query = query.eq('has_free_trial', true)
  if (api)     query = query.eq('has_api', true)

  if (sort === 'popular') query = query.order('upvotes', { ascending: false })
  else if (sort === 'rating') query = query.order('rating_avg', { ascending: false })
  else if (sort === 'name') query = query.order('name', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  query = query.limit(200)

  const { data: toolsRaw, error } = await query

  // ── Shape data to match AiTool type ───────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: AiTool[] = (toolsRaw ?? []).map((t: any) => {
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
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">AI Tools Directory</h1>
        <p className="mt-1 text-slate-400">
          Discover and compare the best AI tools — updated daily
        </p>
        <div className="mt-4 max-w-xl">
          <Suspense>
            <SearchBar defaultValue={q} />
          </Suspense>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Database error: {error.message}. Showing available data.
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar */}
        <Suspense>
          <FilterSidebar categories={categories} />
        </Suspense>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">{tools.length}</span> tools
              {q && <span> for &ldquo;<span className="text-red-400">{q}</span>&rdquo;</span>}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
              <button className="rounded-md p-1.5 bg-white/5 text-white">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {tools.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-2xl">🤔</p>
              <p className="mt-2 font-semibold text-white">No tools found</p>
              <p className="mt-1 text-sm text-slate-500">
                {q || category || pricing
                  ? 'Try adjusting your filters or search terms'
                  : 'The database is empty. Add tools via the admin scraper or submit form.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
