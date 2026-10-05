// Machine-readable export of the directory.
//
// Lives at the site root rather than under /api/ on purpose: robots.txt
// disallows /api/, so a dataset served from there would be invisible to the
// crawlers it exists for. Same reasoning as rss.xml.
//
// Paginated rather than a single dump. A full dump is one request away from
// being a competitor's seed database; pages plus a stated licence make citing
// easier than copying, which is the trade we want. Nothing here is private —
// every field already renders on the public listing page.
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://listmyai.com'
const PAGE_SIZE = 200
const MAX_PAGE_SIZE = 500

// Listings change daily at most; agents re-fetching should hit the CDN.
export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Row {
  slug: string
  name: string
  tagline: string | null
  description: string | null
  website: string | null
  pricing_model: string | null
  starting_price: string | null
  has_free_trial: boolean | null
  has_api: boolean | null
  updated_at: string | null
  created_at: string | null
  categories: { name: string } | { name: string }[] | null
}

function categoryName(c: Row['categories']): string | null {
  if (!c) return null
  return Array.isArray(c) ? (c[0]?.name ?? null) : c.name
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE), 10) || PAGE_SIZE)
  )
  const from = (page - 1) * limit

  const { data, count, error } = await supabase
    .from('ai_tools')
    .select(
      'slug, name, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api, updated_at, created_at, categories(name)',
      { count: 'exact' }
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) {
    return Response.json({ error: 'Could not read the directory' }, { status: 503 })
  }

  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? rows.length
  const pages = Math.max(1, Math.ceil(total / limit))

  return Response.json(
    {
      // Stated up front so an agent quoting this knows what it owes us.
      license: 'CC BY 4.0 — free to use with attribution to ListmyAI (https://listmyai.com)',
      source: BASE_URL,
      documentation: `${BASE_URL}/llms.txt`,
      generated_at: new Date().toISOString(),
      total,
      page,
      per_page: limit,
      pages,
      next: page < pages ? `${BASE_URL}/tools.json?page=${page + 1}&limit=${limit}` : null,
      tools: rows.map(t => ({
        name: t.name,
        slug: t.slug,
        url: `${BASE_URL}/tools/${t.slug}`,
        website: t.website,
        category: categoryName(t.categories),
        tagline: t.tagline,
        description: t.description,
        pricing_model: t.pricing_model,
        starting_price: t.starting_price,
        has_free_trial: !!t.has_free_trial,
        has_api: !!t.has_api,
        updated_at: t.updated_at ?? t.created_at,
      })),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        // Agents calling from a browser context would otherwise be blocked.
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
