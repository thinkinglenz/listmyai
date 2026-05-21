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

// ── Extract tool name from URL slug (fallback when page is JS-rendered) ──────
function nameFromSlug(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const slug = pathname.split('/').filter(Boolean).pop() ?? ''
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim()
  } catch { return '' }
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
      let name = '', description = '', website = ''
      try {
        const html = await safeFetch(url, 6000)
        name = getTitle(html)
        description = getDesc(html)
        website = getExternalLink(html, new URL(url).hostname)
      } catch {}

      // Fallback: derive name from URL slug if page failed or returned no title
      if (!name || name.length < 2) name = nameFromSlug(url)
      if (!name || name.length < 2) throw new Error(`No title: ${url}`)

      // If no external website found, use the listing URL itself
      if (!website) website = url

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

// ── GitHub Awesome-List Parser ───────────────────────────────────────────────

/** Known awesome-list repos with AI tools */
const AWESOME_LISTS = [
  { name: 'awesome-ai-tools (mahseema)', url: 'https://raw.githubusercontent.com/mahseema/awesome-ai-tools/main/README.md' },
  { name: 'ai-collection', url: 'https://raw.githubusercontent.com/ai-collection/ai-collection/main/README.md' },
  { name: 'awesome-generative-ai', url: 'https://raw.githubusercontent.com/steven2358/awesome-generative-ai/master/README.md' },
  { name: 'awesome-chatgpt', url: 'https://raw.githubusercontent.com/OpenMindClub/awesome-chatgpt/main/README.md' },
  { name: 'awesome-ai-apps', url: 'https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md' },
]

interface ParsedTool {
  name: string
  website: string
  description: string
  category: string
}

/**
 * Parse markdown content from an awesome-list and extract tool entries.
 * Handles patterns like:
 *   - [Tool Name](https://url) - Description
 *   - [Tool Name](https://url) — Description
 *   - | [Tool Name](url) | Description | Category |
 *   - **[Tool Name](url)** - Description
 */
function parseAwesomeList(markdown: string): ParsedTool[] {
  const tools: ParsedTool[] = []
  const seen = new Set<string>()
  const lines = markdown.split('\n')

  // Track the current section heading for category hints
  let currentSection = ''

  for (const line of lines) {
    // Track section headings
    const headingMatch = line.match(/^#{1,4}\s+(.+)/)
    if (headingMatch) {
      currentSection = headingMatch[1].replace(/[*_`]/g, '').trim()
      continue
    }

    // Pattern: markdown link with description
    // Matches: - [Name](url) - desc  |  * [Name](url) — desc  |  - **[Name](url)** - desc
    const linkPattern = /\[([^\]]{2,80})\]\((https?:\/\/[^\s)]+)\)\]?\*{0,2}\s*[-–—:|]\s*(.+)/
    const m = line.match(linkPattern)
    if (!m) continue

    const rawName = m[1].replace(/[*_`]/g, '').trim()
    let url = m[2].replace(/\/$/, '').trim()
    const desc = m[3]
      .replace(/\|.*$/, '')     // strip table columns after first
      .replace(/<!--.*?-->/, '') // strip HTML comments
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500)

    // Skip non-tool links (GitHub repos, docs, papers, etc.)
    if (!rawName || rawName.length < 2) continue
    if (/^(http|ftp|mailto)/i.test(rawName)) continue
    if (url.includes('github.com') && !url.includes('github.io')) continue
    if (url.includes('arxiv.org') || url.includes('wikipedia.org')) continue
    if (url.includes('youtube.com') || url.includes('twitter.com')) continue

    // Normalise URL
    try { url = new URL(url).origin + new URL(url).pathname.replace(/\/$/, '') } catch { continue }

    const normHost = url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    if (seen.has(normHost)) continue
    seen.add(normHost)

    const combinedText = `${rawName} ${desc} ${currentSection}`
    const category = guessCategory(combinedText)

    tools.push({ name: rawName, website: url, description: desc, category })
  }

  return tools
}

/** Import parsed tools into DB, deduplicating against existing websites */
async function importParsedTools(tools: ParsedTool[]): Promise<{
  imported: number; skipped: number; errors: string[]; total: number
}> {
  // Load existing websites for dedup
  const { data: existing } = await supabase.from('ai_tools').select('website')
  const knownSites = new Set<string>(
    (existing ?? []).map((r: { website: string }) =>
      (r.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    )
  )

  let imported = 0, skipped = 0
  const errors: string[] = []

  // Process in chunks of 10
  for (let i = 0; i < tools.length; i += 10) {
    const chunk = tools.slice(i, i + 10)

    for (const tool of chunk) {
      const norm = tool.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
      if (knownSites.has(norm)) { skipped++; continue }

      const tagline = tool.description.split(/[.!?]/)[0].slice(0, 120) || tool.name
      const slug = `${slugify(tool.name)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

      // Look up category
      const { data: cat } = await supabase
        .from('categories').select('id')
        .ilike('name', `%${tool.category.split(' ')[0]}%`)
        .maybeSingle()

      const { error: insErr } = await supabase.from('ai_tools').insert({
        slug,
        name: tool.name,
        tagline,
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

    // Brief pause between chunks
    if (i + 10 < tools.length) await new Promise(r => setTimeout(r, 100))
  }

  return { imported, skipped, errors, total: tools.length }
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

    // GitHub Awesome-List: list available repos
    if (action === 'listGithubLists') {
      return NextResponse.json({ lists: AWESOME_LISTS })
    }

    // GitHub Awesome-List: preview (parse without importing)
    if (action === 'previewGithubList') {
      const listUrl = body.listUrl
      if (!listUrl) return NextResponse.json({ error: 'listUrl required' }, { status: 400 })
      const markdown = await safeFetch(listUrl, 15000)
      const parsed = parseAwesomeList(markdown)
      return NextResponse.json({ tools: parsed, total: parsed.length })
    }

    // GitHub Awesome-List: import parsed tools
    if (action === 'importGithubList') {
      const listUrl = body.listUrl
      if (!listUrl) return NextResponse.json({ error: 'listUrl required' }, { status: 400 })
      const maxImport = body.maxImport ?? 200
      const markdown = await safeFetch(listUrl, 15000)
      const parsed = parseAwesomeList(markdown).slice(0, maxImport)
      if (parsed.length === 0) {
        return NextResponse.json({ imported: 0, skipped: 0, errors: ['No tools found in this list'], total: 0 })
      }
      const result = await importParsedTools(parsed)
      return NextResponse.json(result)
    }

    // GitHub Awesome-List: import from custom markdown URL
    if (action === 'importCustomList') {
      const listUrl = body.listUrl
      if (!listUrl) return NextResponse.json({ error: 'listUrl required' }, { status: 400 })
      const maxImport = body.maxImport ?? 200
      const markdown = await safeFetch(listUrl, 15000)
      const parsed = parseAwesomeList(markdown).slice(0, maxImport)
      if (parsed.length === 0) {
        return NextResponse.json({ imported: 0, skipped: 0, errors: ['No tools found — check the URL returns raw markdown with [Name](url) links'], total: 0 })
      }
      const result = await importParsedTools(parsed)
      return NextResponse.json(result)
    }

    // ── Import deals: add promo codes to existing or new tools ────────────────
    if (action === 'importDeals') {
      interface DealInput {
        name: string
        promo_code?: string
        promo_desc?: string
        pricing_model?: string
        starting_price?: string
        has_free_trial?: boolean
        description?: string
        website?: string
      }
      const deals: DealInput[] = body.deals
      if (!Array.isArray(deals) || deals.length === 0) {
        return NextResponse.json({ error: 'deals array required' }, { status: 400 })
      }

      let updated = 0, created = 0, errors = 0
      const details: { name: string; action: string; error?: string }[] = []

      for (const deal of deals) {
        try {
          // Try to find existing tool by name (case-insensitive)
          const { data: existing } = await supabase
            .from('ai_tools')
            .select('id, name, promo_code')
            .ilike('name', deal.name)
            .maybeSingle()

          if (existing) {
            // Update existing tool with deal info
            const updates: Record<string, unknown> = {}
            if (deal.promo_code) updates.promo_code = deal.promo_code
            if (deal.promo_desc) updates.promo_desc = deal.promo_desc
            if (deal.pricing_model) updates.pricing_model = deal.pricing_model
            if (deal.starting_price) updates.starting_price = deal.starting_price
            if (deal.has_free_trial) updates.has_free_trial = true

            if (Object.keys(updates).length > 0) {
              const { error: upErr } = await supabase.from('ai_tools').update(updates).eq('id', existing.id)
              if (upErr) {
                // Try without pricing_model if constraint fails
                if (upErr.message?.includes('check constraint') || upErr.message?.includes('pricing_model')) {
                  delete updates.pricing_model
                  await supabase.from('ai_tools').update(updates).eq('id', existing.id)
                } else {
                  details.push({ name: deal.name, action: 'error', error: upErr.message })
                  errors++
                  continue
                }
              }
            }
            details.push({ name: deal.name, action: 'updated' })
            updated++
          } else {
            // Create new tool with deal info
            const category = guessCategory(`${deal.name} ${deal.description ?? ''} ${deal.promo_desc ?? ''}`)
            const { data: cat } = await supabase
              .from('categories').select('id')
              .ilike('name', `%${category.split(' ')[0]}%`)
              .maybeSingle()

            const slug = `${slugify(deal.name)}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
            const tagline = (deal.description ?? deal.promo_desc ?? deal.name).split(/[.!?]/)[0].slice(0, 120)

            const row: Record<string, unknown> = {
              slug,
              name: deal.name,
              tagline,
              description: deal.description ?? deal.promo_desc ?? '',
              website: deal.website ?? '',
              category_id: cat?.id ?? null,
              status: 'active',
              claimed: false,
              is_auto_enrolled: true,
              is_featured: false,
              is_sponsored: false,
              upvotes: 0, rating_avg: 0, rating_count: 0, view_count: 0, click_count: 0,
            }
            if (deal.promo_code) row.promo_code = deal.promo_code
            if (deal.promo_desc) row.promo_desc = deal.promo_desc
            if (deal.pricing_model) row.pricing_model = deal.pricing_model
            if (deal.starting_price) row.starting_price = deal.starting_price
            if (deal.has_free_trial) row.has_free_trial = true

            const { error: insErr } = await supabase.from('ai_tools').insert(row)
            if (insErr) {
              // Retry without pricing_model if constraint fails
              if (insErr.message?.includes('check constraint') || insErr.message?.includes('pricing_model')) {
                delete row.pricing_model
                const { error: retryErr } = await supabase.from('ai_tools').insert(row)
                if (retryErr) {
                  details.push({ name: deal.name, action: 'error', error: retryErr.message })
                  errors++
                  continue
                }
              } else {
                details.push({ name: deal.name, action: 'error', error: insErr.message })
                errors++
                continue
              }
            }
            details.push({ name: deal.name, action: 'created' })
            created++
          }
        } catch (err) {
          details.push({ name: deal.name, action: 'error', error: String(err) })
          errors++
        }
      }

      return NextResponse.json({ updated, created, errors, total: deals.length, details })
    }

    // ── Cleanup: find & remove junk entries ───────────────────────────────────
    if (action === 'findJunk') {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('id, name, slug, website, status, created_at')
        .eq('is_auto_enrolled', true)
        .order('created_at', { ascending: false })
        .limit(2000)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const junk = (data ?? []).filter((t: Record<string, unknown>) => {
        const n = ((t.name as string) || '').trim()
        const w = ((t.website as string) || '').trim()

        // 1. Name is a single generic word (image, photo, video, audio, file, icon, logo, etc.)
        if (/^(image|img|photo|pic|video|audio|file|doc|icon|logo|banner|thumb|thumbnail|avatar|cover|hero|bg|background|button|badge|screenshot|preview|demo|test|sample|example|placeholder|untitled|undefined|null|none|n\/a)$/i.test(n)) return true

        // 2. Name looks like a filename or asset path (has extensions)
        if (/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|mp4|mp3|css|js|json|xml|html|woff|ttf|eot)$/i.test(n)) return true

        // 3. Name is just numbers or number-heavy slugs
        if (/^\d+$/.test(n)) return true
        if (/^[a-z]{1,6}[-_]\d{8,}/i.test(n)) return true  // e.g. "image-1779383919384"

        // 4. Name is very short (1-2 chars) or empty
        if (n.length <= 2) return true

        // 5. Website points to CDN/asset URLs (not real tool websites)
        if (/assets[-.]|cdn\.|cloudfront|amazonaws\.com\/|storage\.googleapis|\.s3\.|blob\.core|wp-content\/uploads|static\.|media\./i.test(w)) return true

        // 6. Website is just a fragment or malformed
        if (w && !w.startsWith('http')) return true
        if (/\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|mp4|css|js)(\?|$)/i.test(w)) return true

        // 7. Name contains only special chars or is a hash
        if (/^[^a-zA-Z]*$/.test(n)) return true
        if (/^[a-f0-9]{16,}$/i.test(n)) return true  // hex hash

        // 8. Name matches common junk patterns from scrapers
        if (/^(p-\d+|hero-|cta-|nav-|footer-|header-|sidebar-|modal-|popup-)/i.test(n)) return true

        return false
      })

      return NextResponse.json({
        total: data?.length ?? 0,
        junkCount: junk.length,
        junk: junk.map((t: Record<string, unknown>) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          website: t.website,
        })),
      })
    }

    if (action === 'deleteJunk') {
      const ids: number[] = body.ids
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids array required' }, { status: 400 })
      }

      // Safety: max 500 at a time, only delete auto-enrolled (scraped) tools
      const batch = ids.slice(0, 500)
      const { error, count } = await supabase
        .from('ai_tools')
        .delete({ count: 'exact' })
        .in('id', batch)
        .eq('is_auto_enrolled', true)  // safety: never delete user-submitted tools

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ deleted: count ?? 0, requested: batch.length })
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
