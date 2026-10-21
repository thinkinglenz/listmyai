// Sitemap data and XML rendering, shared by the index and the chunk routes.
//
// Why this exists at all: the single /sitemap.xml had grown to 42,668 URLs at
// 7.2MB against Google's hard limit of 50,000 URLs per file. Past that Google
// rejects the file outright — not the extra URLs, the whole thing — so the
// site would have silently lost all of its indexing in one step. A second,
// closer ceiling sat in the old file as `MAX_TOOLS = 22_000`: beyond that,
// new listings stopped being advertised with no error anywhere.
//
// /sitemap.xml stays the same URL and becomes a sitemap index pointing at
// chunks. That matters: it is the URL in robots.txt and the one already
// submitted in Search Console. Next's own generateSitemaps would have moved
// everything to /sitemap/0.xml instead, breaking both.
import { createClient } from '@supabase/supabase-js'
import { LIVE_PAGES } from '@/lib/seo/best-pages'
import { publishedEditorialSlugs } from '@/lib/editorials'

export const BASE_URL = 'https://listmyai.com'

/** URLs per chunk. Google allows 50,000; we use a fifth of that so a file
 *  stays small enough to open and diagnose, and so one bad section cannot
 *  take a whole chunk over the limit. */
export const CHUNK = 10_000

/** Supabase returns at most 1,000 rows per request whatever .limit() says. */
const PAGE = 1000

export interface Entry {
  loc: string
  lastmod?: Date | string | null
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
}

export interface ToolRow {
  slug: string
  updated_at: string | null
  created_at: string
  category_id: string | null
  upvotes: number | null
  view_count: number | null
  description: string | null
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Only these five characters are special in XML, and an unescaped & in a
 *  slug produces a file strict parsers reject outright. */
function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function renderUrlset(entries: Entry[]): string {
  const body = entries.map(e => {
    const lastmod = iso(e.lastmod)
    return [
      '  <url>',
      `    <loc>${esc(e.loc)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority !== undefined ? `    <priority>${e.priority}</priority>` : null,
      '  </url>',
    ].filter(Boolean).join('\n')
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function renderIndex(files: string[]): string {
  const now = new Date().toISOString()
  const body = files.map(f =>
    `  <sitemap>\n    <loc>${esc(`${BASE_URL}/sitemaps/${f}`)}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

/** Headers shared by every sitemap response. A day at the edge means a
 *  crawler walking all the chunks costs the database nothing — the same
 *  lesson that /tools.json learned after the egress cap took the site down. */
export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
}

export async function countActiveTools(): Promise<number> {
  const { count, error } = await db()
    .from('ai_tools')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw new Error(`sitemap: could not count tools — ${error.message}`)
  return count ?? 0
}

/**
 * One slice of the catalogue, in a stable order.
 *
 * Ordering by created_at alone is not stable: tools created in the same second
 * can swap places between requests, so a row could appear in two chunks or in
 * none. The id tiebreak makes the slicing deterministic.
 */
export async function fetchTools(
  offset: number,
  limit: number,
  /** The slice chunks render only a URL and a date. Pulling `description` for
   *  them as well would read ~60,000 descriptions a day to render nothing —
   *  the same needless egress that emptied the quota and took the whole site
   *  down on 2026-10-11. Only the comparison chunk needs the wide row. */
  shape: 'slim' | 'full' = 'slim',
): Promise<ToolRow[]> {
  const columns = shape === 'full'
    ? 'slug, updated_at, created_at, category_id, upvotes, view_count, description'
    : 'slug, updated_at, created_at'

  const rows: ToolRow[] = []
  for (let taken = 0; taken < limit; taken += PAGE) {
    const from = offset + taken
    const to = Math.min(from + PAGE, offset + limit) - 1
    const { data, error } = await db()
      .from('ai_tools')
      .select(columns)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to)
    if (error) throw new Error(`sitemap: could not read tools — ${error.message}`)
    if (!data || data.length === 0) break
    rows.push(...(data as unknown as ToolRow[]))
    if (data.length < to - from + 1) break
  }
  return rows
}

/** Every active tool. Only the comparison chunk needs this. */
export async function fetchAllTools(): Promise<ToolRow[]> {
  const total = await countActiveTools()
  return fetchTools(0, total, 'full')
}

export function toolEntries(tools: ToolRow[], prefix: 'tools' | 'alternatives'): Entry[] {
  return tools.map(t => ({
    loc: `${BASE_URL}/${prefix}/${t.slug}`,
    lastmod: t.updated_at ?? t.created_at,
    changefreq: 'weekly' as const,
    priority: prefix === 'tools' ? 0.7 : 0.6,
  }))
}

/**
 * Comparison pages.
 *
 * Pairing every tool with every other in its category is O(n^2): 1,000 tools
 * produced 61,277 URLs on their own. That volume of near-identical generated
 * pages is also exactly what Google's scaled content abuse policy targets, so
 * only the strongest tools in each category get paired. Every comparison page
 * still works and stays reachable by links; this only decides what is put in
 * front of Google.
 */
const COMPARABLE_PER_CATEGORY = 15 // 15 tools -> 105 pairs per category

export function compareEntries(tools: ToolRow[]): Entry[] {
  const byCategory = new Map<string | null, ToolRow[]>()
  for (const t of tools) {
    const key = t.category_id ?? null
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key)!.push(t)
  }

  // A comparison is only worth showing when both sides have something to
  // compare, so rank on real interest and require a description.
  const score = (t: ToolRow) => (t.upvotes ?? 0) * 10 + (t.view_count ?? 0)

  const out: Entry[] = []
  byCategory.forEach(categoryTools => {
    const ranked = categoryTools
      .filter(t => (t.description ?? '').trim().length > 60)
      .sort((a, b) => score(b) - score(a))
      .slice(0, COMPARABLE_PER_CATEGORY)

    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        out.push({
          loc: `${BASE_URL}/compare/${ranked[i].slug}-vs-${ranked[j].slug}`,
          lastmod: new Date(Math.max(
            new Date(ranked[i].updated_at ?? ranked[i].created_at).getTime(),
            new Date(ranked[j].updated_at ?? ranked[j].created_at).getTime()
          )),
          changefreq: 'weekly' as const,
          priority: 0.5,
        })
      }
    }
  })
  return out
}

const USE_CASE_SLUGS = [
  'writing', 'image-generation', 'video-creation', 'coding', 'chatbots',
  'marketing', 'music-audio', 'design', 'productivity', 'research',
  'education', 'email-marketing', 'customer-support', 'data-analysis',
  'presentation', 'summarization', 'translation', 'legal',
]

/**
 * Everything that is not a tool, an alternatives page or a comparison: the
 * blog, editorials, keyword guides, static pages, categories, use cases.
 *
 * These lead the index on purpose. Crawlers work through an index top-down,
 * and in the old single file the blog sat last of 42,668 URLs, so it was
 * never reached. Now it is in the first, smallest file.
 */
export async function coreEntries(): Promise<Entry[]> {
  const sb = db()

  const [postsRes, categoriesRes, editorials] = await Promise.all([
    sb.from('blog_posts').select('slug, updated_at')
      .eq('status', 'published').order('published_at', { ascending: false }).limit(1000),
    sb.from('categories').select('slug'),
    publishedEditorialSlugs(),
  ])

  // Fail loudly. Swallowing the error here would serve a valid sitemap with
  // the blog quietly missing from it, and nothing would ever report that.
  if (postsRes.error) throw new Error(`sitemap: could not read blog posts — ${postsRes.error.message}`)
  if (categoriesRes.error) throw new Error(`sitemap: could not read categories — ${categoriesRes.error.message}`)
  const posts = postsRes.data
  const categories = categoriesRes.data

  const now = new Date()
  const stat = (path: string, changefreq: Entry['changefreq'], priority: number): Entry =>
    ({ loc: `${BASE_URL}${path}`, lastmod: now, changefreq, priority })

  return [
    stat('/editorial', 'daily', 0.8),
    ...editorials.map(e => ({
      loc: `${BASE_URL}/editorial/${e.slug}`,
      lastmod: e.published_at ?? now,
      changefreq: 'monthly' as const,
      priority: 0.8,
    })),
    // The blog is the growth surface, so it outranks everything but the home page.
    ...(posts ?? []).map(p => ({
      loc: `${BASE_URL}/blog/${p.slug}`,
      lastmod: p.updated_at ?? now,
      changefreq: 'daily' as const,
      priority: 0.9,
    })),
    stat('/best', 'weekly', 0.9),
    // Keyword guides are released in batches (LIVE_COUNT); only live ones here.
    ...LIVE_PAGES.map(p => ({
      loc: `${BASE_URL}/best/${p.slug}`,
      lastmod: now, changefreq: 'daily' as const, priority: 0.9,
    })),
    stat('/', 'daily', 1.0),
    stat('/directory', 'daily', 0.9),
    stat('/trending', 'daily', 0.8),
    stat('/deals', 'daily', 0.8),
    stat('/blog', 'daily', 0.8),
    stat('/categories', 'weekly', 0.7),
    stat('/compare', 'weekly', 0.7),
    stat('/find', 'monthly', 0.6),
    stat('/submit', 'monthly', 0.5),
    stat('/pricing', 'monthly', 0.5),
    stat('/courses', 'weekly', 0.5),
    stat('/terms', 'yearly', 0.2),
    stat('/privacy-policy', 'yearly', 0.2),
    stat('/disclaimer', 'yearly', 0.2),
    stat('/dmca', 'yearly', 0.2),
    stat('/refund-policy', 'yearly', 0.2),
    stat('/alternatives', 'daily', 0.8),
    stat('/use-case', 'weekly', 0.8),
    ...(categories ?? []).map(c => ({
      loc: `${BASE_URL}/directory?category=${c.slug}`,
      lastmod: now, changefreq: 'weekly' as const, priority: 0.6,
    })),
    ...USE_CASE_SLUGS.map(slug => ({
      loc: `${BASE_URL}/use-case/${slug}`,
      lastmod: now, changefreq: 'weekly' as const, priority: 0.7,
    })),
  ]
}

/** The chunk filenames the index advertises, derived from the live count so
 *  the index can never point at a chunk that has nothing in it. */
export function chunkFiles(toolCount: number): string[] {
  const n = Math.max(1, Math.ceil(toolCount / CHUNK))
  return [
    'core.xml',
    ...Array.from({ length: n }, (_, i) => `tools-${i + 1}.xml`),
    ...Array.from({ length: n }, (_, i) => `alternatives-${i + 1}.xml`),
    'compare.xml',
  ]
}
