import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

// Detect pricing info from page text
function detectPricing(html: string): { pricing_model: string | null; starting_price: string | null; has_free_trial: boolean } {
  const text = html.toLowerCase()
  let pricing_model: string | null = null
  let starting_price: string | null = null
  let has_free_trial = false

  // Free trial detection
  if (/free.?trial|try.?free|start.?free|free.?plan|free.?tier|get started free/i.test(text)) {
    has_free_trial = true
  }

  // Pricing model detection
  if (/completely free|100% free|free and open/i.test(text) && !/free trial|freemium/i.test(text)) {
    pricing_model = 'Free'
  } else if (/freemium|free.?plan.*paid|free.?tier.*pro/i.test(text)) {
    pricing_model = 'Freemium'
  } else if (/enterprise.?pricing|contact.?sales|custom.?pricing/i.test(text)) {
    pricing_model = 'Enterprise'
  } else if (/\$\d+.*?\/mo|per.?month|\$\d+.*?month|billed.*?monthly/i.test(text)) {
    pricing_model = 'Subscription'
  } else if (/pay.?per.?use|pay.?as.?you.?go|per.?api.?call|usage.?based/i.test(text)) {
    pricing_model = 'Pay Per Use'
  } else if (has_free_trial) {
    pricing_model = 'Free Trial'
  }

  // Try to extract starting price
  const priceMatch = text.match(/(?:starting|from|plans? (?:start|begin))\s*(?:at|from)?\s*\$(\d+(?:\.\d{2})?)/i)
    || text.match(/\$(\d+(?:\.\d{2})?)\s*\/?\s*(?:mo|month)/i)
  if (priceMatch) {
    starting_price = `$${priceMatch[1]}/mo`
  }

  return { pricing_model, starting_price, has_free_trial }
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { slug: tool.slug, updated: false, fields: [], error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const meta = extractMeta(html)
    const pricing = detectPricing(html)
    const features = detectFeatures(html)

    // Build update object — only fill in missing/empty fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {}
    const fields: string[] = []

    // Description: enrich if empty or very short
    const ogDesc = meta['og:description'] || meta['twitter:description'] || meta['description'] || ''
    if ((!tool.description || tool.description.length < 30) && ogDesc.length > 30) {
      updates.description = ogDesc.slice(0, 800)
      fields.push('description')
    }

    // Tagline: if empty or same as name
    if ((!tool.tagline || tool.tagline === tool.name) && ogDesc) {
      const tagline = ogDesc.split(/[.!?]/)[0]?.trim()
      if (tagline && tagline.length >= 10 && tagline.length <= 150) {
        updates.tagline = tagline
        fields.push('tagline')
      }
    }

    // Logo / image
    const ogImage = meta['og:image'] || meta['twitter:image'] || ''
    if (!tool.logo_url && ogImage && ogImage.startsWith('http')) {
      updates.logo_url = ogImage
      fields.push('logo_url')
    }

    // Pricing — only fill if currently empty
    if (!tool.pricing_model && pricing.pricing_model) {
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

    if (Object.keys(updates).length === 0) {
      return { slug: tool.slug, updated: false, fields: [] }
    }

    const supabase = getSupabase()
    const { error } = await supabase.from('ai_tools').update(updates).eq('id', tool.id)

    if (error) {
      // If a column doesn't exist, retry without it
      const safeUpdates = { ...updates }
      if (error.message.includes('logo_url')) delete safeUpdates.logo_url
      if (error.message.includes('no_code')) delete safeUpdates.no_code
      if (error.message.includes('gdpr_compliant')) delete safeUpdates.gdpr_compliant

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
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10)

  const supabase = getSupabase()

  // Fetch tools that need enrichment (missing description, pricing, etc.)
  const { data: tools, error } = await supabase
    .from('ai_tools')
    .select('id, slug, name, website, tagline, description, pricing_model, starting_price, has_free_trial, has_api, no_code, gdpr_compliant, logo_url, status')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (dryRun) {
    // Just show what would be enriched
    const needsWork = (tools || []).filter(t =>
      !t.description || t.description.length < 30 ||
      !t.pricing_model ||
      !t.tagline || t.tagline === t.name
    )
    return NextResponse.json({
      total_tools: (tools || []).length,
      needs_enrichment: needsWork.length,
      samples: needsWork.slice(0, 10).map(t => ({
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

  // Enrich tools (with 500ms delay between requests to be polite)
  const results = []
  let enriched = 0, skipped = 0, errors = 0

  for (const tool of (tools || [])) {
    const result = await enrichTool(tool)
    results.push(result)
    if (result.updated) enriched++
    else if (result.error) errors++
    else skipped++

    // Be polite — don't hammer websites
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({
    enriched,
    skipped,
    errors,
    total: (tools || []).length,
    details: results,
  })
}
