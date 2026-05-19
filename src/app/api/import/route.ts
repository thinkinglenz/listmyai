import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Called by the Python scraper with a secret token.
// Accepts one tool payload and upserts it into ai_tools.
const IMPORT_SECRET = process.env.IMPORT_SECRET ?? ''

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

interface ToolPayload {
  name: string
  website: string
  tagline?: string
  description?: string
  logo_url?: string
  category_slug?: string
  pricing_model?: string
  has_free_trial?: boolean
  has_api?: boolean
  tags?: string[]
  source_url?: string
}

export async function POST(req: NextRequest) {
  // Verify shared secret
  const auth = req.headers.get('authorization') ?? ''
  if (!IMPORT_SECRET || auth !== `Bearer ${IMPORT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ToolPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name || !body.website) {
    return NextResponse.json({ error: 'name and website are required' }, { status: 422 })
  }

  const slug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const supabase = supabaseAdmin()

  // Look up category id from slug
  let category_id: string | null = null
  if (body.category_slug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', body.category_slug)
      .single()
    category_id = cat?.id ?? null
  }

  const record = {
    slug,
    name: body.name,
    website: body.website,
    tagline: body.tagline ?? null,
    description: body.description ?? null,
    logo_url: body.logo_url ?? null,
    category_id,
    pricing_model: body.pricing_model ?? 'freemium',
    has_free_trial: body.has_free_trial ?? false,
    has_api: body.has_api ?? false,
    tags: body.tags ?? [],
    source_url: body.source_url ?? null,
    status: 'active',
    is_auto_enrolled: true,
  }

  const { data, error } = await supabase
    .from('ai_tools')
    .upsert(record, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, slug')
    .single()

  if (error) {
    console.error('[import] upsert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug }, { status: 200 })
}
