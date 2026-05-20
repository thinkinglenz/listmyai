import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60 // Vercel Pro: up to 60s per invocation

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Browser-like headers to avoid 403s ───────────────────────────────────────
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// ── Fetch helper ──────────────────────────────────────────────────────────────
async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

// ── Meta tag extraction ───────────────────────────────────────────────────────
function meta(html: string, prop: string): string {
  // Try property="..." then name="..."
  for (const attr of ['property', 'name']) {
    const m = html.match(
      new RegExp(`<meta[^>]+${attr}=["']${prop}["'][^>]+content=["']([^"']{1,500})["']`, 'i')
    ) || html.match(
      new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+${attr}=["']${prop}["']`, 'i')
    )
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractTitle(html: string): string {
  return (
    meta(html, 'og:title') ||
    meta(html, 'twitter:title') ||
    html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ||
    ''
  ).replace(/\s*[-|–]\s*.+$/, '').trim() // strip " - Site Name" suffix
}

function extractDescription(html: string): string {
  return (
    meta(html, 'og:description') ||
    meta(html, 'twitter:description') ||
    meta(html, 'description') ||
    ''
  ).slice(0, 500)
}

function extractWebsite(html: string, pageUrl: string): string {
  const pageHost = new URL(pageUrl).hostname

  // Look for "Visit Site" / "Go to Website" external links
  const visitPatterns = [
    /<a[^>]+href=["'](https?:\/\/(?!www\.google|twitter|facebook|linkedin)[^"']+)["'][^>]*>(?:[^<]*(?:visit|go to|open|launch|website|site|tool)[^<]*)<\/a>/gi,
    /<a[^>]+(?:rel=["'][^"']*(?:nofollow|noopener)[^"']*["']|target=["']_blank["'])[^>]+href=["'](https?:\/\/[^"']+)["']/gi,
  ]

  for (const pattern of visitPatterns) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(html)) !== null) {
      const href = m[1]
      try {
        const host = new URL(href).hostname
        if (host !== pageHost && !host.includes('google') && !host.includes('twitter') && !host.includes('facebook')) {
          return href.split('?')[0].replace(/\/$/, '')
        }
      } catch {}
    }
  }

  // Fall back to og:url if it's a different domain
  const ogUrl = meta(html, 'og:url')
  if (ogUrl) {
    try {
      if (new URL(ogUrl).hostname !== pageHost) return ogUrl
    } catch {}
  }

  return ''
}

function inferCategory(name: string, description: string): string {
  const text = (name + ' ' + description).toLowerCase()
  const rules: [RegExp, string][] = [
    [/image|photo|art|design|generat|diffusion|midjourney|stable|dall/i, 'Image Generation'],
    [/video|film|movie|animation|clip|render/i, 'Video Generation'],
    [/audio|music|sound|voice|speech|tts|transcri/i, 'Audio & Music'],
    [/code|program|developer|github|debug|sql|api/i, 'Code Assistant'],
    [/write|writing|copy|blog|essay|content|seo|email draft/i, 'Writing & Copy'],
    [/seo|marketing|ads|campaign|social media/i, 'SEO & Marketing'],
    [/data|analytic|insight|chart|spreadsheet/i, 'Data & Analytics'],
    [/search|research|knowledge|question/i, 'AI Search'],
    [/automat|workflow|zapier|integrat/i, 'Automation'],
    [/education|learn|study|tutor|course/i, 'Education'],
    [/health|medical|fitness|mental/i, 'Healthcare'],
    [/finance|legal|contract|law|accounting/i, 'Finance & Legal'],
    [/chat|assistant|conversati|gpt|bot/i, 'Chatbot / Assistant'],
  ]
  for (const [re, cat] of rules) if (re.test(text)) return cat
  return 'Other'
}

function makeSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

// ── Sitemap parser ────────────────────────────────────────────────────────────
function parseSitemap(xml: string): string[] {
  const urls: string[] = []
  for (const m of xml.matchAll(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi)) {
    urls.push(m[1].trim())
  }
  // Also handle sitemap index (sitemap of sitemaps)
  return urls
}

// ── Per-site URL filters ──────────────────────────────────────────────────────
function isToolUrl(url: string, sourceHost: string): boolean {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname !== sourceHost) return false

    // Site-specific patterns
    if (hostname.includes('theresanaiforthat')) return pathname.startsWith('/ai/')
    if (hostname.includes('futurepedia')) return pathname.startsWith('/tool/')
    if (hostname.includes('toolify')) return /^\/(en\/)?tool\//.test(pathname)
    if (hostname.includes('aitoptools')) return pathname.startsWith('/tools/')
    if (hostname.includes('topai.tools')) return /^\/[^/]+\/?$/.test(pathname) && pathname !== '/'
    if (hostname.includes('futuretools')) return pathname.startsWith('/tools/')
    if (hostname.includes('aisuperstar')) return pathname.startsWith('/tools/')

    // Generic: any path with /tool/ or /ai/ or /app/
    return /\/(tool|ai|app|product)s?\//i.test(pathname)
  } catch {
    return false
  }
}

// ── Scrape one tool page ──────────────────────────────────────────────────────
async function scrapeToolPage(url: string): Promise<{
  name: string; description: string; website: string; category: string; tagline: string
} | null> {
  try {
    const html = await fetchText(url)
    const name = extractTitle(html)
    if (!name || name.length < 2) return null

    const description = extractDescription(html)
    const website = extractWebsite(html, url)
    const category = inferCategory(name, description)
    const tagline = description.split('.')[0].slice(0, 100)

    return { name, description, website: website || url, category, tagline }
  } catch {
    return null
  }
}

// ── Check which websites already exist ───────────────────────────────────────
async function getExistingWebsites(): Promise<Set<string>> {
  const { data } = await supabase.from('ai_tools').select('website')
  const set = new Set<string>()
  for (const row of data ?? []) {
    if (row.website) set.add(row.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase())
  }
  return set
}

// ── Look up or create category ────────────────────────────────────────────────
async function getCategoryId(name: string): Promise<number | null> {
  const { data } = await supabase.from('categories').select('id').ilike('name', `%${name.split(' ')[0]}%`).single()
  return data?.id ?? null
}

// ── Main POST handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { sourceUrl, offset = 0, limit = 20 } = await req.json()

  if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 })

  let sourceHost: string
  try {
    sourceHost = new URL(sourceUrl).hostname
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Step 1 — get the sitemap / listing page and extract tool URLs
  let toolUrls: string[] = []
  try {
    const isSitemap = sourceUrl.includes('sitemap') || sourceUrl.endsWith('.xml')

    if (isSitemap) {
      const xml = await fetchText(sourceUrl)
      const allUrls = parseSitemap(xml)

      // If it's a sitemap index (points to other sitemaps), follow them
      if (allUrls.some(u => u.includes('sitemap'))) {
        const subSitemaps = allUrls.filter(u => u.includes('sitemap'))
        for (const surl of subSitemaps.slice(0, 3)) {
          const subXml = await fetchText(surl)
          toolUrls.push(...parseSitemap(subXml))
        }
      } else {
        toolUrls = allUrls
      }

      // Filter to tool pages only
      toolUrls = toolUrls.filter(u => isToolUrl(u, sourceHost))
    } else {
      // It's a listing page — try to find the sitemap automatically
      const guessedSitemap = `https://${sourceHost}/sitemap.xml`
      try {
        const xml = await fetchText(guessedSitemap)
        const allUrls = parseSitemap(xml)
        toolUrls = allUrls.filter(u => isToolUrl(u, sourceHost))
      } catch {
        // Couldn't find sitemap — scrape the listing page for links
        const html = await fetchText(sourceUrl)
        const linkRe = /href=["'](https?:\/\/[^"']+|\/[^"']+)["']/gi
        let m: RegExpExecArray | null
        while ((m = linkRe.exec(html)) !== null) {
          try {
            const abs = new URL(m[1], sourceUrl).href
            if (isToolUrl(abs, sourceHost)) toolUrls.push(abs)
          } catch {}
        }
        toolUrls = [...new Set(toolUrls)]
      }
    }
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch source: ${String(err)}` }, { status: 500 })
  }

  const totalFound = toolUrls.length
  const batch = toolUrls.slice(offset, offset + limit)

  if (batch.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [], total: totalFound, hasMore: false })
  }

  // Step 2 — get existing websites to avoid duplicates
  const existingWebsites = await getExistingWebsites()

  // Step 3 — scrape each tool page (in parallel, max 5 at a time)
  const CHUNK = 5
  const results: Array<{ name: string; description: string; website: string; category: string; tagline: string } | null> = []
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK)
    const chunkResults = await Promise.all(chunk.map(u => scrapeToolPage(u)))
    results.push(...chunkResults)
    // Small delay to be polite
    if (i + CHUNK < batch.length) await new Promise(r => setTimeout(r, 500))
  }

  // Step 4 — save new tools to Supabase
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const tool of results) {
    if (!tool) { errors.push('Failed to parse page'); continue }

    // Normalise website for dedup check
    const normWebsite = tool.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    if (existingWebsites.has(normWebsite)) { skipped++; continue }

    const slug = makeSlug(tool.name)
    const catId = await getCategoryId(tool.category)

    const { error } = await supabase.from('ai_tools').insert({
      slug: `${slug}-${Date.now()}`, // ensure uniqueness
      name: tool.name,
      tagline: tool.tagline || tool.name,
      description: tool.description,
      website: tool.website,
      category_id: catId,
      status: 'pending',
      is_auto_enrolled: true,
      is_featured: false,
      is_sponsored: false,
      upvotes: 0,
      rating_avg: 0,
      rating_count: 0,
      view_count: 0,
      click_count: 0,
    })

    if (error) {
      if (error.code === '23505') { skipped++; continue } // duplicate slug
      errors.push(`${tool.name}: ${error.message}`)
    } else {
      imported++
      existingWebsites.add(normWebsite) // prevent within-batch dupes
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    errors,
    total: totalFound,
    hasMore: offset + limit < totalFound,
    nextOffset: offset + limit,
  })
}

// ── GET — returns live stats ──────────────────────────────────────────────────
export async function GET() {
  const { count: total } = await supabase.from('ai_tools').select('*', { count: 'exact', head: true })
  const { count: pending } = await supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  const { count: autoEnrolled } = await supabase.from('ai_tools').select('*', { count: 'exact', head: true }).eq('is_auto_enrolled', true)
  return NextResponse.json({ total, pending, autoEnrolled })
}
