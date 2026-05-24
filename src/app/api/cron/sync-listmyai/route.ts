import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — heavy job

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Tunables ─────────────────────────────────────────────────────────────────
const SITEMAPS = [
  'https://listmyai.net/sitemap-0.xml',
  'https://listmyai.net/sitemap-1.xml',
]
const MAX_NEW_TOOLS_PER_RUN = 60          // sustainable weekly cap
const FETCH_DELAY_MS        = 200          // polite delay between page fetches
const FETCH_TIMEOUT_MS      = 12_000

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 60)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ListmyAI-Sync/1.0 (+https://listmyai.com)' },
      cache: 'no-store',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function extractToolUrls(xml: string): string[] {
  const urls: string[] = []
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const u = m[1].trim()
    if (/^https:\/\/listmyai\.net\/tool\/[^/]+$/i.test(u)) urls.push(u)
  }
  return urls
}

function extractSlug(url: string): string | null {
  const m = url.match(/\/tool\/([^/?#]+)/i)
  return m ? decodeURIComponent(m[1]) : null
}

// Parse the __NEXT_DATA__ script payload that listmyai.net inlines.
function extractNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}

// Reduce Sanity portable-text blocks to a plain-text description.
function blocksToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''
  const out: string[] = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const b = block as { _type?: string; children?: unknown; style?: string }
    if (b._type !== 'block' || !Array.isArray(b.children)) continue
    const text = (b.children as Array<{ text?: string }>)
      .map(c => (c && typeof c.text === 'string' ? c.text : ''))
      .join('')
      .trim()
    if (text) out.push(text)
  }
  return out.join('\n\n').slice(0, 4000)
}

function normalizeUrl(raw: string | null | undefined): string {
  if (!raw) return ''
  let u = String(raw).trim()
  if (!u) return ''
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u
  return u.replace(/\/+$/, '')
}

function domain(url: string): string {
  return normalizeUrl(url).replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase()
}

function inferPricing(priceField: unknown): string {
  const s = String(priceField ?? '').toLowerCase()
  if (!s) return 'freemium'
  if (s.includes('free trial')) return 'free_trial'
  if (s === 'free') return 'free'
  if (s.includes('freemium')) return 'freemium'
  if (s.includes('paid') || s.includes('subscription') || /\$\d/.test(s)) return 'subscription'
  if (s.includes('one') || s.includes('lifetime')) return 'one_time'
  if (s.includes('enterprise')) return 'enterprise'
  return 'freemium'
}

interface ParsedTool {
  source_slug: string
  name: string
  website: string
  description: string
  long_description: string
  logo_url?: string
  image_url?: string
  categories: string[]
  pricing_model: string
  starting_price?: string
}

function parseTool(html: string, sourceSlug: string): ParsedTool | null {
  const nd = extractNextData(html)
  if (!nd) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = ((nd as any)?.props?.pageProps?.tool) as Record<string, unknown> | undefined
  if (!t) return null

  const name = String(t.label ?? t.metaTitle ?? '').trim()
  const website = normalizeUrl(String(t.link ?? ''))
  if (!name || !website) return null

  const description = String(t.description ?? '').trim().slice(0, 280)
  const long = blocksToText(t.longDescription) || description
  const logo = t.logo ? String(t.logo) : undefined
  const image = t.image ? String(t.image) : undefined
  const cats = Array.isArray(t.categories) ? (t.categories as string[]).filter(Boolean) : []
  const priceStr = t.price ? String(t.price) : ''

  return {
    source_slug: sourceSlug,
    name,
    website,
    description,
    long_description: long,
    logo_url: logo,
    image_url: image,
    categories: cats,
    pricing_model: inferPricing(t.pricing ?? t.price),
    starting_price: priceStr || undefined,
  }
}

// Map a listmyai.net category string to one of our category rows.
async function resolveCategoryId(catList: { id: string; name: string; slug: string }[], names: string[]): Promise<string | null> {
  if (!names.length) return null
  for (const raw of names) {
    const n = raw.toLowerCase()
    // Try exact name/slug match
    const exact = catList.find(c => c.name?.toLowerCase() === n || c.slug?.toLowerCase() === n)
    if (exact) return exact.id
    // Try partial-word overlap
    const partial = catList.find(c =>
      c.name?.toLowerCase().includes(n) || n.includes(c.name?.toLowerCase() ?? '')
    )
    if (partial) return partial.id
  }
  return null
}

// ── Main sync routine ───────────────────────────────────────────────────────
async function runSync() {
  const startedAt = Date.now()
  const stats = { sitemap_urls: 0, considered: 0, skipped_existing: 0, inserted: 0, errors: 0 }
  const errorSamples: string[] = []
  const insertedDetails: { name: string; slug: string; website: string }[] = []

  // 1. Pull both sitemaps
  const allUrls = new Set<string>()
  for (const sm of SITEMAPS) {
    const xml = await fetchText(sm)
    if (!xml) continue
    for (const u of extractToolUrls(xml)) allUrls.add(u)
  }
  stats.sitemap_urls = allUrls.size

  // 2. Load categories once
  const { data: cats } = await supabase.from('categories').select('id, name, slug')
  const catList = (cats ?? []) as { id: string; name: string; slug: string }[]

  // 3. Load every slug + website we already have so we can dedupe in-memory.
  //    The slug pattern for listmyai imports is `lmai-${sourceSlug}`.
  const existingSlugs = new Set<string>()
  const existingDomains = new Set<string>()
  {
    let from = 0
    const PAGE = 1000
    while (true) {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('slug, website')
        .range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      for (const r of data) {
        if (r.slug) existingSlugs.add(String(r.slug).toLowerCase())
        if (r.website) existingDomains.add(domain(String(r.website)))
      }
      if (data.length < PAGE) break
      from += PAGE
    }
  }

  // 4. Iterate URLs, fetch each new one, insert. Cap to MAX_NEW_TOOLS_PER_RUN.
  const urlList = Array.from(allUrls)
  for (const url of urlList) {
    if (stats.inserted >= MAX_NEW_TOOLS_PER_RUN) break
    stats.considered++

    const srcSlug = extractSlug(url)
    if (!srcSlug) continue

    const ourSlug = `lmai-${slugify(srcSlug)}`.slice(0, 60)
    if (existingSlugs.has(ourSlug)) { stats.skipped_existing++; continue }

    // Fetch + parse
    await sleep(FETCH_DELAY_MS)
    const html = await fetchText(url)
    if (!html) { stats.errors++; if (errorSamples.length < 5) errorSamples.push(`fetch failed: ${url}`); continue }

    const parsed = parseTool(html, srcSlug)
    if (!parsed) { stats.errors++; if (errorSamples.length < 5) errorSamples.push(`parse failed: ${url}`); continue }

    // Dedupe by external website domain too
    const d = domain(parsed.website)
    if (d && existingDomains.has(d)) { stats.skipped_existing++; continue }

    const categoryId = await resolveCategoryId(catList, parsed.categories)

    // Build insert row, defensively dropping fields that may not exist on the table.
    const baseRow: Record<string, unknown> = {
      slug: ourSlug,
      name: parsed.name,
      tagline: (parsed.description || parsed.name).slice(0, 180),
      description: parsed.long_description || parsed.description,
      website: parsed.website,
      pricing_model: parsed.pricing_model,
      has_free_trial: parsed.pricing_model === 'free_trial' || parsed.pricing_model === 'freemium',
      has_api: false,
      is_featured: false,
      is_sponsored: false,
      is_auto_enrolled: true,
      claimed: false,
      status: 'active',
      upvotes: 0,
      rating_avg: 0,
      rating_count: 0,
      view_count: 0,
      click_count: 0,
    }
    if (categoryId) baseRow.category_id = categoryId
    if (parsed.logo_url) baseRow.logo_url = parsed.logo_url
    if (parsed.image_url) baseRow.image_url = parsed.image_url
    if (parsed.starting_price) baseRow.starting_price = parsed.starting_price

    // Insert with graceful fallbacks for constraint violations.
    let insertOk = false
    const tryInsert = async (row: Record<string, unknown>) => {
      const { error } = await supabase.from('ai_tools').insert(row)
      return error
    }

    let err = await tryInsert(baseRow)
    if (err) {
      const msg = err.message || ''
      // Unique slug clash → append short hash
      if (err.code === '23505') {
        const row2 = { ...baseRow, slug: `${baseRow.slug}-${Date.now().toString(36).slice(-4)}` }
        err = await tryInsert(row2)
      } else if (msg.includes('pricing_model') || msg.includes('check constraint')) {
        const row2 = { ...baseRow }
        delete row2.pricing_model
        err = await tryInsert(row2)
      } else if (msg.includes('image_url') || msg.includes('column')) {
        const row2 = { ...baseRow }
        delete row2.image_url
        err = await tryInsert(row2)
      }
    }

    if (err) {
      stats.errors++
      if (errorSamples.length < 5) errorSamples.push(`${parsed.name}: ${err.message}`)
      continue
    }

    insertOk = true
    if (insertOk) {
      stats.inserted++
      existingSlugs.add(ourSlug)
      if (d) existingDomains.add(d)
      insertedDetails.push({ name: parsed.name, slug: ourSlug, website: parsed.website })
    }
  }

  return {
    ok: true,
    ms: Date.now() - startedAt,
    ...stats,
    inserted_sample: insertedDetails.slice(0, 20),
    error_samples: errorSamples,
  }
}

// ── Auth (Vercel cron or manual) ─────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true

  // Allow manual trigger via existing admin import secret
  const querySecret = req.nextUrl.searchParams.get('secret')
  if (querySecret === 'listmyai_import_2026') return true

  return false
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await runSync()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
