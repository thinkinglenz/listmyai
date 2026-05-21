import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH_SIZE = 5  // Process 5 tools in parallel
const FETCH_TIMEOUT = 6000  // 6s max per website fetch
const ABOUT_TIMEOUT = 5000  // 5s max per about page

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Extract meta tags from HTML
function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {}

  // OG tags
  const ogRegex = /<meta\s+(?:property|name)=["'](og:|twitter:)?([^"']+)["']\s+content=["']([^"']*)["']/gi
  let match
  while ((match = ogRegex.exec(html)) !== null) {
    meta[`${match[1] || ''}${match[2]}`] = match[3].trim()
  }

  // Also try reverse order: content before property
  const ogRegex2 = /<meta\s+content=["']([^"']*)["']\s+(?:property|name)=["'](og:|twitter:)?([^"']+)["']/gi
  while ((match = ogRegex2.exec(html)) !== null) {
    meta[`${match[2] || ''}${match[3]}`] = match[1].trim()
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) meta['title'] = titleMatch[1].trim()

  // Description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)
  if (descMatch) meta['description'] = descMatch[1].trim()

  return meta
}

// Valid pricing models matching the DB check constraint (lowercase with underscores)
const VALID_PRICING = ['free', 'freemium', 'free_trial', 'subscription', 'pay_per_use', 'one_time', 'enterprise'] as const

// Detect pricing info from page text
function detectPricing(html: string): { pricing_model: string | null; starting_price: string | null; has_free_trial: boolean } {
  const text = html.toLowerCase()
  let pricing_model: string | null = null
  let starting_price: string | null = null
  let has_free_trial = false

  // Free trial detection
  if (/free.?trial|try.?free|start.?free|get started free/i.test(text)) {
    has_free_trial = true
  }

  // Pricing model detection — values match DB constraint exactly
  if (/completely free|100% free|free and open|open.?source/i.test(text) && !/free trial|freemium/i.test(text)) {
    pricing_model = 'free'
  } else if (/freemium|free.?plan.*(?:paid|pro|premium)|free.?tier.*(?:pro|premium)/i.test(text)) {
    pricing_model = 'freemium'
  } else if (/enterprise.?pricing|contact.?(?:us|sales).*pric|custom.?pricing|request.?(?:a )?demo/i.test(text)) {
    pricing_model = 'enterprise'
  } else if (/one.?time.*(?:purchase|payment|fee)|lifetime.*(?:deal|access|license)|pay.?once/i.test(text)) {
    pricing_model = 'one_time'
  } else if (/\$\d+.*?\/\s*mo|per.?month|\$\d+.*?month|billed.*?(?:monthly|annually)|subscription/i.test(text)) {
    pricing_model = 'subscription'
  } else if (/pay.?per.?use|pay.?as.?you.?go|per.?(?:api.?)?call|usage.?based|credit.?based/i.test(text)) {
    pricing_model = 'pay_per_use'
  } else if (has_free_trial) {
    pricing_model = 'free_trial'
  }

  // Validate against allowed values
  if (pricing_model && !VALID_PRICING.includes(pricing_model as typeof VALID_PRICING[number])) {
    pricing_model = null
  }

  // Try to extract starting price
  const priceMatch = text.match(/(?:starting|from|plans? (?:start|begin))\s*(?:at|from)?\s*\$(\d+(?:\.\d{2})?)/i)
    || text.match(/\$(\d+(?:\.\d{2})?)\s*\/?\s*(?:mo|month)/i)
  if (priceMatch) {
    starting_price = `$${priceMatch[1]}/mo`
  }

  return { pricing_model, starting_price, has_free_trial }
}

// Extract contact & social links from HTML
function detectContact(html: string, websiteUrl: string): Record<string, string> {
  const result: Record<string, string> = {}

  // Twitter / X
  const twitterMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+)["']/i)
  if (twitterMatch) result.twitter_url = twitterMatch[1]

  // LinkedIn
  const linkedinMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+(?:\/?)?)["']/i)
  if (linkedinMatch) result.linkedin_url = linkedinMatch[1]

  // GitHub
  const githubMatch = html.match(/href=["'](https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)["']/i)
  if (githubMatch) result.github_url = githubMatch[1]

  // Discord
  const discordMatch = html.match(/href=["'](https?:\/\/(?:www\.)?discord\.(?:gg|com\/invite)\/[a-zA-Z0-9_-]+)["']/i)
  if (discordMatch) result.discord_url = discordMatch[1]

  // YouTube
  const youtubeMatch = html.match(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/)[a-zA-Z0-9_-]+)["']/i)
  if (youtubeMatch) result.youtube_url = youtubeMatch[1]

  // Contact email (look for mailto: links, skip generic ones)
  const emailMatches = html.match(/href=["']mailto:([^"'?]+)/gi)
  if (emailMatches) {
    for (const m of emailMatches) {
      const email = m.replace(/href=["']mailto:/i, '').toLowerCase()
      // Skip noreply, unsubscribe, etc.
      if (!/noreply|no-reply|unsubscribe|bounce|mailer-daemon|postmaster/i.test(email) && email.includes('@')) {
        result.contact_email = email
        break
      }
    }
  }

  // Support URL (look for /support, /help, /contact links on same domain)
  try {
    const domain = new URL(websiteUrl).hostname.replace(/^www\./, '')
    const supportMatch = html.match(new RegExp(`href=["'](https?://[^"']*${domain.replace('.', '\\.')}[^"']*(?:/(?:support|help|contact|docs)[^"']*))["']`, 'i'))
    if (supportMatch) result.support_url = supportMatch[1]
  } catch { /* ignore */ }

  return result
}

// Scrape company description from about/company page
async function scrapeAboutPage(baseUrl: string, homepageHtml: string): Promise<string> {
  try {
    const base = new URL(baseUrl)

    // Find about page link from homepage
    const aboutLinkMatch = homepageHtml.match(/href=["']([^"']*(?:\/about|\/about-us|\/company|\/who-we-are|\/our-story)[^"']*)["']/i)
    let aboutUrl: string | null = null

    if (aboutLinkMatch) {
      try {
        aboutUrl = new URL(aboutLinkMatch[1], base.origin).toString()
      } catch { /* ignore */ }
    }

    // Fallback: try common about page paths
    if (!aboutUrl) {
      const paths = ['/about', '/about-us', '/company']
      for (const path of paths) {
        try {
          const testUrl = new URL(path, base.origin).toString()
          const testRes = await fetch(testUrl, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(ABOUT_TIMEOUT) })
          if (testRes.ok) { aboutUrl = testUrl; break }
        } catch { /* continue */ }
      }
    }

    if (!aboutUrl) return ''

    const aboutRes = await fetch(aboutUrl, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(ABOUT_TIMEOUT) })
    if (!aboutRes.ok) return ''

    const aboutHtml = await aboutRes.text()

    // Extract text from main content area
    // Remove scripts, styles, nav, header, footer
    const cleaned = aboutHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')

    // Try to find main content
    const mainMatch = cleaned.match(/<(?:main|article|section)[^>]*class="[^"]*(?:about|content|main)[^"]*"[^>]*>([\s\S]*?)<\/(?:main|article|section)>/i)
      || cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      || cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

    const contentHtml = mainMatch ? mainMatch[1] : cleaned

    // Extract paragraphs
    const paragraphs: string[] = []
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let pMatch
    while ((pMatch = pRegex.exec(contentHtml)) !== null) {
      const text = pMatch[1]
        .replace(/<[^>]+>/g, '') // strip inner HTML tags
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      // Only keep substantial paragraphs
      if (text.length > 40 && text.length < 500 && !/cookie|privacy|subscribe|sign up|log in/i.test(text)) {
        paragraphs.push(text)
      }
    }

    // Take first 3-4 meaningful paragraphs
    return paragraphs.slice(0, 4).join('\n\n')
  } catch {
    return ''
  }
}

// Detect features from page
function detectFeatures(html: string): { has_api: boolean; no_code: boolean; gdpr_compliant: boolean } {
  const text = html.toLowerCase()
  return {
    has_api: /\bapi\b.*(?:access|endpoint|key|integrat|document)|rest.?api|graphql|api.?reference|developer.?docs/i.test(text),
    no_code: /no.?code|drag.?and.?drop|visual.?builder|without.?coding|no programming/i.test(text),
    gdpr_compliant: /gdpr|data.?protection|privacy.?shield|soc.?2|hipaa|complian/i.test(text),
  }
}

// Enrich a single tool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichTool(tool: any): Promise<{ slug: string; updated: boolean; fields: string[]; error?: string }> {
  const url = tool.website
  if (!url || !url.startsWith('http')) {
    return { slug: tool.slug, updated: false, fields: [], error: 'No valid URL' }
  }

  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      redirect: 'follow',
    })

    if (!res.ok) {
      return { slug: tool.slug, updated: false, fields: [], error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const meta = extractMeta(html)
    const pricing = detectPricing(html)
    const features = detectFeatures(html)
    const contact = detectContact(html, url)

    // Try to scrape company description from /about page
    let companyDesc = ''
    if (!tool.company_description) {
      companyDesc = await scrapeAboutPage(url, html)
    }

    // Build update object — only fill in missing/empty fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {}
    const fields: string[] = []

    // Helper: strip markdown artifacts from scraped text
    const cleanText = (s: string) => s
      .replace(/`#\w+`/g, '')             // `#free`, `#paid`, etc.
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
      .replace(/`([^`]+)`/g, '$1')        // `code` → code
      .replace(/\s{2,}/g, ' ')
      .trim()

    // Description: enrich if empty or very short
    const ogDesc = meta['og:description'] || meta['twitter:description'] || meta['description'] || ''
    if ((!tool.description || tool.description.length < 30) && ogDesc.length > 30) {
      updates.description = cleanText(ogDesc).slice(0, 800)
      fields.push('description')
    }
    // Also clean existing descriptions with markdown artifacts
    if (tool.description && /`#\w+`/.test(tool.description)) {
      updates.description = cleanText(tool.description)
      if (!fields.includes('description')) fields.push('description')
    }

    // Tagline: if empty, same as name, or has markdown artifacts
    if ((!tool.tagline || tool.tagline === tool.name) && ogDesc) {
      const tagline = cleanText(ogDesc).split(/[.!?]/)[0]?.trim()
      if (tagline && tagline.length >= 10 && tagline.length <= 150) {
        updates.tagline = tagline
        fields.push('tagline')
      }
    }
    // Clean existing taglines with markdown artifacts
    if (tool.tagline && /`#\w+`/.test(tool.tagline)) {
      updates.tagline = cleanText(tool.tagline)
      if (!fields.includes('tagline')) fields.push('tagline')
    }

    // Logo / image
    const ogImage = meta['og:image'] || meta['twitter:image'] || ''
    if (!tool.logo_url && ogImage && ogImage.startsWith('http')) {
      updates.logo_url = ogImage
      fields.push('logo_url')
    }

    // Pricing — only fill if currently empty AND value is in the allowed list
    if (!tool.pricing_model && pricing.pricing_model && VALID_PRICING.includes(pricing.pricing_model as typeof VALID_PRICING[number])) {
      updates.pricing_model = pricing.pricing_model
      fields.push('pricing_model')
    }
    if (!tool.starting_price && pricing.starting_price) {
      updates.starting_price = pricing.starting_price
      fields.push('starting_price')
    }
    if (!tool.has_free_trial && pricing.has_free_trial) {
      updates.has_free_trial = true
      fields.push('has_free_trial')
    }

    // Features — only set if not already true
    if (!tool.has_api && features.has_api) {
      updates.has_api = true
      fields.push('has_api')
    }
    if (!tool.no_code && features.no_code) {
      updates.no_code = true
      fields.push('no_code')
    }
    if (!tool.gdpr_compliant && features.gdpr_compliant) {
      updates.gdpr_compliant = true
      fields.push('gdpr_compliant')
    }

    // Company description from about page
    if (!tool.company_description && companyDesc.length > 50) {
      updates.company_description = companyDesc.slice(0, 1500)
      fields.push('company_description')
    }

    // Contact / social — only fill in missing fields
    const contactFields = ['contact_email', 'support_url', 'twitter_url', 'linkedin_url', 'github_url', 'discord_url', 'youtube_url'] as const
    for (const field of contactFields) {
      if (!tool[field] && contact[field]) {
        updates[field] = contact[field]
        fields.push(field)
      }
    }

    if (Object.keys(updates).length === 0) {
      return { slug: tool.slug, updated: false, fields: [] }
    }

    const supabase = getSupabase()
    const { error } = await supabase.from('ai_tools').update(updates).eq('id', tool.id)

    if (error) {
      // If a column doesn't exist or constraint fails, strip problematic fields
      const safeUpdates = { ...updates }
      if (error.message.includes('logo_url')) delete safeUpdates.logo_url
      if (error.message.includes('no_code')) delete safeUpdates.no_code
      if (error.message.includes('gdpr_compliant')) delete safeUpdates.gdpr_compliant
      if (error.message.includes('has_free_trial')) delete safeUpdates.has_free_trial
      if (error.message.includes('has_api')) delete safeUpdates.has_api
      // Strip contact fields if columns don't exist yet
      if (error.message.includes('company_description')) delete safeUpdates.company_description
      for (const cf of ['contact_email','support_url','twitter_url','linkedin_url','github_url','discord_url','youtube_url']) {
        if (error.message.includes(cf)) delete safeUpdates[cf]
      }
      // Any check constraint → strip pricing_model as it's the most likely culprit
      if (error.message.includes('pricing_model') || error.message.includes('check constraint')) {
        delete safeUpdates.pricing_model
        delete safeUpdates.starting_price
      }

      if (Object.keys(safeUpdates).length > 0) {
        const { error: retryErr } = await supabase.from('ai_tools').update(safeUpdates).eq('id', tool.id)
        if (retryErr) return { slug: tool.slug, updated: false, fields: [], error: retryErr.message }
        return { slug: tool.slug, updated: true, fields: Object.keys(safeUpdates) }
      }
      return { slug: tool.slug, updated: false, fields: [], error: error.message }
    }

    return { slug: tool.slug, updated: true, fields }
  } catch (err) {
    const msg = err instanceof Error ? err.name : String(err)
    return { slug: tool.slug, updated: false, fields: [], error: msg }
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get('dry') === '1'
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam || '50', 10), 200)

  const supabase = getSupabase()

  // Fetch tools that actually NEED enrichment — skip already-complete tools
  // A tool needs enrichment if it's missing description, pricing, tagline, or contact info
  // Also skip tools where enrichment was already attempted (enrichment_tried_at is set)
  let query = supabase
    .from('ai_tools')
    .select('id, slug, name, website, tagline, description, pricing_model, starting_price, has_free_trial, has_api, no_code, gdpr_compliant, logo_url, status, company_description, contact_email, support_url, twitter_url, linkedin_url, github_url, discord_url, youtube_url, enrichment_tried_at')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(limit * 3)  // fetch more to filter, then take `limit`

  // Skip already-attempted tools unless forced
  const force = req.nextUrl.searchParams.get('force') === '1'
  if (!force) {
    query = query.is('enrichment_tried_at', null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawTools, error } = await query as any

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check which tools TRULY need enrichment (missing core metadata)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function toolNeedsWork(t: any): boolean {
    // Core fields — if ANY of these are missing, the tool needs enrichment
    const missingDesc = !t.description || t.description.length < 30
    const missingPricing = !t.pricing_model
    const missingTagline = !t.tagline || t.tagline === t.name
    const hasDirtyText = (t.tagline && /`#\w+`/.test(t.tagline)) || (t.description && /`#\w+`/.test(t.description))

    return missingDesc || missingPricing || missingTagline || hasDirtyText
  }

  // Separate: tools that need work vs tools that are already complete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const needsWork: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const alreadyComplete: any[] = []
  for (const t of (rawTools || [])) {
    if (toolNeedsWork(t)) needsWork.push(t)
    else alreadyComplete.push(t)
  }

  // Bulk-stamp already-complete tools so they're never fetched again
  if (alreadyComplete.length > 0) {
    const completeIds = alreadyComplete.map((t: { id: number }) => t.id)
    // Stamp in chunks of 100
    for (let i = 0; i < completeIds.length; i += 100) {
      const chunk = completeIds.slice(i, i + 100)
      try {
        await supabase.from('ai_tools')
          .update({ enrichment_tried_at: new Date().toISOString() })
          .in('id', chunk)
      } catch { /* column may not exist */ }
    }
  }

  // Take only `limit` tools that need work
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools = needsWork.slice(0, limit) as any[]

  if (dryRun) {
    return NextResponse.json({
      total_tools: (rawTools || []).length,
      already_complete_stamped: alreadyComplete.length,
      needs_enrichment: needsWork.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      samples: needsWork.slice(0, 10).map((t: any) => ({
        slug: t.slug,
        name: t.name,
        website: t.website,
        missing: [
          !t.description || t.description.length < 30 ? 'description' : null,
          !t.pricing_model ? 'pricing' : null,
          !t.tagline || t.tagline === t.name ? 'tagline' : null,
        ].filter(Boolean),
      })),
    })
  }

  // Enrich tools in parallel batches — only tools that genuinely need work
  const results = []
  let enriched = 0, skipped = 0, errors = 0

  if (tools.length === 0) {
    return NextResponse.json({
      enriched: 0,
      skipped: alreadyComplete.length,
      errors: 0,
      total: 0,
      details: [],
      message: `${alreadyComplete.length} already-complete tools stamped. No tools need enrichment.`,
    })
  }

  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    const batch = tools.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(batch.map(tool => enrichTool(tool)))
    for (const result of batchResults) {
      results.push(result)
      if (result.updated) enriched++
      else if (result.error) errors++
      else skipped++

      // Mark enrichment as attempted so we don't re-process this tool
      try {
        await supabase.from('ai_tools')
          .update({ enrichment_tried_at: new Date().toISOString() })
          .eq('slug', result.slug)
      } catch { /* column may not exist yet */ }
    }
  }

  return NextResponse.json({
    enriched,
    skipped,
    errors,
    total: tools.length,
    details: results,
  })
}
