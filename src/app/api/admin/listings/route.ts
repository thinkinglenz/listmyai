import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Scraping helpers for "Add Listing" ───────────────────────────────────────
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
}

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

function getLogo(html: string, website: string): string {
  // og:image is usually the hero/logo
  const ogImg = getMeta(html, 'og:image')
  if (ogImg) {
    try { return new URL(ogImg, website).href } catch {}
  }
  // apple-touch-icon
  const touch = html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i)?.[1]
  if (touch) {
    try { return new URL(touch, website).href } catch {}
  }
  // Google favicon as last resort
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(website).hostname}&sz=128`
  } catch { return '' }
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Count query (same filters, no pagination)
  let countQuery = supabase
    .from('ai_tools')
    .select('*', { count: 'exact', head: true })
  if (status && status !== 'all') countQuery = countQuery.eq('status', status)
  if (search) countQuery = countQuery.ilike('name', `%${search}%`)
  const { count: totalCount } = await countQuery

  // Data query with pagination
  let query = supabase
    .from('ai_tools')
    .select('id, name, slug, website, status, claimed, upvotes, rating_avg, rating_count, created_at, category_id, categories(name), tagline, description, logo_url')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    tools: data ?? [],
    page,
    pageSize: PAGE_SIZE,
    total: totalCount ?? 0,
    totalPages: Math.ceil((totalCount ?? 0) / PAGE_SIZE),
  })
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = [
    'status', 'slug', 'name', 'tagline', 'description', 'website',
    'logo_url', 'cover_url', 'video_url', 'demo_url', 'screenshots',
    'pricing_model', 'starting_price', 'pricing_url', 'has_free_trial', 'trial_duration',
    'has_api', 'api_docs_url', 'no_code', 'gdpr_compliant', 'platforms', 'integrations',
    'is_featured', 'is_sponsored', 'category_id', 'promo_code', 'promo_desc',
    'company_name', 'company_description', 'hq_location', 'founded_year', 'team_size',
    'contact_name', 'contact_email', 'contact_phone', 'support_url',
    'twitter_url', 'linkedin_url', 'github_url', 'discord_url', 'youtube_url',
    'facebook_url', 'instagram_url', 'tiktok_url', 'product_hunt_url',
    'target_audience', 'use_cases', 'tags', 'alternatives',
    'social_promotion_consent', 'creatives', 'brand_guidelines_url',
  ]
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key]
  }

  const { error } = await supabase.from('ai_tools').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabase.from('ai_tools').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ── POST: admin "Add Listing" — preview URL or insert tool ──────────────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  // ── Preview: fetch URL and return scraped metadata ──────────────────────────
  if (action === 'preview') {
    const { url } = body
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    let normalized: string
    try {
      normalized = url.startsWith('http') ? url : `https://${url}`
      new URL(normalized) // validate
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    let html = ''
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const r = await fetch(normalized, { headers: BROWSER_HEADERS, signal: ctrl.signal })
      if (r.ok) html = await r.text()
      clearTimeout(t)
    } catch { /* page may be JS-rendered; still return partial data */ }

    const origin = (() => { try { return new URL(normalized).origin } catch { return normalized } })()
    const name = getTitle(html) || new URL(normalized).hostname.replace(/^www\./, '').split('.')[0]
      .replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const description = getDesc(html)
    const tagline = description.split(/[.!?]/)[0].slice(0, 120) || name
    const logo_url = getLogo(html, normalized)
    const category = guessCategory(`${name} ${description}`)

    return NextResponse.json({ name, description, tagline, website: origin, logo_url, category })
  }

  // ── Insert: save admin-added tool to DB ────────────────────────────────────
  if (action === 'insert') {
    const { name, tagline, description, website, logo_url, category_name } = body
    if (!name?.trim() || !website?.trim()) {
      return NextResponse.json({ error: 'name and website are required' }, { status: 400 })
    }

    // Duplicate check
    const norm = website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    const { data: existing } = await supabase
      .from('ai_tools')
      .select('id, name')
      .or(`website.ilike.%${norm}%`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: `A listing already exists for this website: "${existing.name}"`,
        existing_id: existing.id,
      }, { status: 409 })
    }

    // Resolve category_id
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${(category_name ?? '').split(' ')[0]}%`)
      .maybeSingle()

    const slug = `${slugify(name.trim())}-${Date.now()}`

    const { data: inserted, error: insErr } = await supabase
      .from('ai_tools')
      .insert({
        slug,
        name: name.trim(),
        tagline: (tagline ?? name).trim().slice(0, 120),
        description: (description ?? '').trim(),
        website: website.trim().replace(/\/$/, ''),
        logo_url: logo_url?.trim() || null,
        category_id: cat?.id ?? null,
        status: 'active',
        claimed: false,
        is_auto_enrolled: false,  // distinguishes from scraped tools
        is_featured: false,
        is_sponsored: false,
        upvotes: 0, rating_avg: 0, rating_count: 0, view_count: 0, click_count: 0,
      })
      .select('id, slug')
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    return NextResponse.json({ success: true, id: inserted.id, slug: inserted.slug })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
