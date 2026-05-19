import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function buildInsert(slug: string, body: Record<string, unknown>, catId: number) {
  const {
    name, website, tagline, description, pricing_model,
    starting_price, has_free_trial, trial_duration, promo_code, promo_desc,
    has_api, company_name, hq_location, founded_year,
    contact_email, contact_name,
  } = body as Record<string, string | boolean>

  return {
    slug,
    name,
    tagline,
    description,
    website,
    category_id: catId,
    pricing_model: (pricing_model as string)?.toLowerCase().replace(/\s+/g, '_') ?? 'free',
    starting_price: starting_price ?? null,
    has_free_trial: has_free_trial ?? false,
    trial_duration: trial_duration ?? null,
    promo_code: promo_code ?? null,
    promo_desc: promo_desc ?? null,
    has_api: has_api ?? false,
    company_name: company_name ?? null,
    hq_location: hq_location ?? null,
    founded_year: founded_year ?? null,
    contact_email: contact_email ?? null,
    contact_name: contact_name ?? null,
    status: 'pending',
    is_featured: false,
    is_sponsored: false,
    is_auto_enrolled: false,
    upvotes: 0,
    rating_avg: 0,
    rating_count: 0,
    view_count: 0,
    click_count: 0,
  }
}

// Strip any keys that Supabase reports as missing from the schema
function stripUnknownColumns(
  row: Record<string, unknown>,
  errorMsg: string
): Record<string, unknown> {
  // Error format: "Could not find the 'column_name' column of 'table' in the schema cache"
  const match = errorMsg.match(/Could not find the '(.+?)' column/)
  if (!match) return row
  const col = match[1]
  const stripped = { ...row }
  delete stripped[col]
  return stripped
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { name, website, category, contact_email } = body

    if (!name || !website || !category || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Look up category id
    const { data: catRow } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${category}%`)
      .single()

    const catId = catRow?.id ?? 1
    let row = buildInsert(slug, body, catId)

    // Try insert — auto-strip any columns missing from the schema (up to 10 iterations)
    for (let attempt = 0; attempt < 10; attempt++) {
      const { error } = await supabase.from('ai_tools').insert(row)

      if (!error) return NextResponse.json({ success: true })

      // Duplicate slug → retry with timestamp suffix
      if (error.code === '23505') {
        row = { ...row, slug: `${slug}-${Date.now()}` }
        const { error: e2 } = await supabase.from('ai_tools').insert(row)
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
        return NextResponse.json({ success: true })
      }

      // Unknown column → strip it and retry
      if (error.message?.includes('Could not find the')) {
        row = stripUnknownColumns(row as Record<string, unknown>, error.message) as typeof row
        continue
      }

      // Any other error
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Schema mismatch — please run the migration SQL in Supabase.' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
