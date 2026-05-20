import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Two-phase scraper:
//   Phase 1 — POST { action:'getUrls', sourceUrl }  → returns URL list from sitemap
//   Phase 2 — POST { action:'scrapeUrls', urls[] }  → scrapes those pages and saves to DB
//   GET                                              → DB stats

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
}

async function safeFetch(url: string, ms = 7000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`)
    return await r.text()
  } finally {
    clearTimeout(t)
  }
}

// ── Extract meta tags ────────────────────────────────────────────────────────
function getMeta(html: string, key: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']{1,600})["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']{1,600})["'][^>]+property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']{1,600})["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']{1,600})["'][^>]+name=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function getTitle(html: string): string {
  const t = getMeta(html, 'og:title') ||
    getMeta(html, 'twitter:title') ||
    (html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1] ?? '')
  return t.replace(/\s*[|\-–—]\s*[^|\-–—]+$/, '').trim()
}

function getDesc(html: string): string {
  return (getMeta(html, 'og:description') ||
    getMeta(html, 'twitter:description') ||
    getMeta(html, 'description')).slice(0, 500)
}

function getExternalLink(html: string, pageHost: string): string {
  // Try target="_blank" links to different domains
  const re = /href=["'](https?:\/\/[^"'#?]+)["'][^>]*target=["']_blank["']/gi
  const re2 = /target=["']_blank["'][^>]*href=["'](https?:\/\/[^"'#?]+)["']/gi
  const skip = ['google', 'twitter', 'facebook', 'instagram', 'linkedin', 'youtube', pageHost]
  for (const pattern of [re, re2]) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(html)) !== null) {
      try {
        const host = new URL(m[1]).hostname
        if (!skip.some(s => host.includes(s))) return m[1].replace(/\/$/, '')
      } catch {}
    }
  }
  return ''
}

function guessCategory(text: string): string {
  const t = text.toLowerCase()
  if (/image|photo|art|dall|midjourney|stable.diff|generat.*image/i.test(t)) return 'Image Generation'
  if (/video|film|animation|clip/i.test(t)) return 'Video Generation'
  if (/audio|music|sound|voice|speech|tts/i.test(t)) return 'Audio & Music'
  if (/code|program|developer|github|debug/i.test(t)) return 'Code Assistant'
  if (/seo|marketing|ads|campaign/i.test(t)) return 'SEO & Marketing'
  if (/write|writing|copy|blog|essay|content/i.test(t)) return 'Writing & Copy'
  if (/data|analytic|chart|spreadsheet/i.test(t)) return 'Data & Analytics'
  if (/search|research|knowledge/i.test(t)) return 'AI Search'
  if (/automat|workflow|integrat/i.test(t)) return 'Automation'
  if (/education|learn|study|tutor/i.test(t)) return 'Education'
  if (/health|medical|fitness/i.test(t)) return 'Healthcare'
  if (/finance|legal|law|contract/i.test(t)) return 'Finance & Legal'
  if (/chat|assistant|bot|gpt/i.test(t)) return 'Chatbot / Assistant'
  return 'Other'
}

function slugify(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60)
}

// ── Parse sitemap XML for URLs ────────────────────────────────────────────────
function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = []
  const re = /<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim())
  return urls
}

// Per-site tool URL patterns
function isToolPage(url: string, host: string): boolean {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname !== host) return false
    if (hostname.includes('theresanaiforthat')) return /^\/ai\/[^/]+\/?$/.test(pathname)
    if (hostname.includes('futurepedia'))       return /^\/tool\/[^/]+\/?$/.test(pathname)
    if (hostname.includes('futuretools'))       return /^\/tools\/[^/]+\/?$/.test(pathname)
    if (hostname.includes('toolify'))           return /^\/(en\/)?tool\/[^/]+\/?$/.test(pathname)
    if (hostname.includes('aitoptools'))        return /^\/tools\/[^/]+\/?$/.test(pathname)
    if (hostname.includes('topai'))             return /^\/[a-z0-9-]+\/?$/.test(pathname) && pathname.length > 2
    return /\/(tool|ai|app)s?\/[^/]+\/?$/.test(pathname)
  } catch { return false }
}

// ── Phase 1: get tool URLs from a source ─────────────────────────────────────
async function getToolUrls(sourceUrl: string): Promise<{ urls: string[]; error?: string }> {
  const host = new URL(sourceUrl).hostname
  try {
    const xml = await safeFetch(sourceUrl, 10000)
    let urls = extractSitemapUrls(xml)

    // Sitemap index? Follow child sitemaps
    const childSitemaps = urls.filter(u => u.includes('sitemap') && (u.endsWith('.xml') || u.includes('sitemap')))
    if (childSitemaps.length > 0 && urls.filter(u => isToolPage(u, host)).length === 0) {
      const toolUrls: string[] = []
      for (const child of childSitemaps.slice(0, 5)) {
        try {
          const childXml = await safeFetch(child, 8000)
          toolUrls.push(...extractSitemapUrls(childXml))
        } catch {}
      }
      urls = toolUrls
    }

    const filtered = urls.filter(u => isToolPage(u, host))
    return { urls: filtered }
  } catch (e) {
    return { urls: [], error: String(e) }
  }
}

// ── Phase 2: scrape a batch of tool pages ────────────────────────────────────
async function scrapeAndSave(urls: string[]): Promise<{ imported: number; skipped: number; errors: string[] }> {
  // Load existing websites for dedup
  const { data: existing } = await supabase.from('ai_tools').select('website')
  const knownSites = new Set<string>(
    (existing ?? []).map((r: { website: string }) =>
      (r.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    )
  )

  let imported = 0, skipped = 0
  const errors: string[] = []

  // Process in chunks of 5
  for (let i = 0; i < urls.length; i += 5) {
    const chunk = urls.slice(i, i + 5)
    const results = await Promise.allSettled(chunk.map(async (url) => {
      const html = await safeFetch(url, 6000)
      const name = getTitle(html)
      if (!name || name.length < 2) throw new Error('No title found')
      const description = getDesc(html)
      const website = getExternalLink(html, new URL(url).hostname) || url
      const category = guessCategory(name + ' ' + description)
      const tagline = description.split(/[.!?]/)[0].slice(0, 120) || name
      return { name, description, website, category, tagline }
    }))

    for (const result of results) {
      if (result.status === 'rejected') {
        errors.push(String(result.reason))
        continue
      }
      const tool = result.value
      const norm = tool.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
      if (knownSites.has(norm)) { skipped++; continue }

      // Look up category
      const { data: cat } = await supabase
        .from('categories').select('id')
        .ilike('name', `%${tool.category.split(' ')[0]}%`)
        .maybeSingle()

      const { error: insErr } = await supabase.from('ai_tools').insert({
        slug: `${slugify(tool.name)}-${Date.now()}`,
        name: tool.name,
        tagline: tool.tagline,
        description: tool.description,
        website: tool.website,
        category_id: cat?.id ?? null,
        status: 'active',
        claimed: false,
        is_auto_enrolled: true,
        is_featured: false,
        is_sponsored: false,
        upvotes: 0, rating_avg: 0, rating_count: 0, view_count: 0, click_count: 0,
      })

      if (insErr) {
        if (insErr.code === '23505') { skipped++; continue }
        errors.push(`${tool.name}: ${insErr.message}`)
      } else {
        imported++
        knownSites.add(norm)
      }
    }

    // Be polite between chunks
    if (i + 5 < urls.length) await new Promise(r => setTimeout(r, 300))
  }

  return { imported, skipped, errors }
}

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, sourceUrl, urls, offset = 0, limit = 20 } = body

    // Phase 1: get URL list from sitemap
    if (action === 'getUrls') {
      if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 })
      const result = await getToolUrls(sourceUrl)
      return NextResponse.json({
        urls: result.urls.slice(offset, offset + limit),
        total: result.urls.length,
        allUrls: result.urls, // send all so client can paginate
        error: result.error,
      })
    }

    // Phase 2: scrape a batch of URLs
    if (action === 'scrapeUrls') {
      if (!Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json({ error: 'urls array required' }, { status: 400 })
      }
      const result = await scrapeAndSave(urls.slice(0, 20)) // max 20 per call
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    // Always return JSON — never a bare 500
    return NextResponse.json({ error: `Scraper error: ${String(err)}` }, { status: 500 })
  }
}

// ── GET: DB stats ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const [{ count: total }, { count: pending }, { count: autoEnrolled }] = await Promise.all([
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }),
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('is_auto_enrolled', true),
    ])
    return NextResponse.json({ total, pending, autoEnrolled })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
