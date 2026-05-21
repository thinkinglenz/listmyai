import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail, submissionConfirmationEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'

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

    const { name, website, category, contact_email, contact_name } = body

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
    let row: Record<string, unknown> = buildInsert(slug, body, catId)

    // Try to get the logged-in user to link submission
    try {
      const cookieStore = await cookies()
      const supabaseUser = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
              c.forEach(({ name, value, options }) => {
                try { cookieStore.set(name, value, options) } catch { /* ignore */ }
              })
            },
          },
        }
      )
      const { data: { user } } = await supabaseUser.auth.getUser()
      if (user?.id) {
        row.submitted_by = user.id
        // Auto-claim: user-submitted listings belong to the submitter
        row.claimed = true
        row.claimed_by = user.id
      }
    } catch { /* not logged in — that's fine */ }

    // Check if website already exists
    const { data: existing } = await supabase
      .from('ai_tools')
      .select('id, name, slug')
      .eq('website', website)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: `This website is already listed as "${existing.name}". If you own this tool, find it in the directory and click "Claim Listing" to take ownership.`,
        existing_slug: existing.slug,
      }, { status: 409 })
    }

    // Try insert — auto-strip any columns missing from the schema (up to 10 iterations)
    for (let attempt = 0; attempt < 10; attempt++) {
      const { error } = await supabase.from('ai_tools').insert(row)

      if (!error) {
        // ✅ Saved — send confirmation email (non-blocking)
        sendEmail({
          to: contact_email,
          subject: `✅ "${name}" has been submitted to ListmyAI`,
          html: submissionConfirmationEmail(contact_name ?? '', name, contact_email, APP_URL),
        }).catch(err => console.error('[submit email]', err))

        return NextResponse.json({ success: true })
      }

      // Duplicate slug → retry with timestamp suffix
      if (error.code === '23505' && error.message?.includes('slug')) {
        row = { ...row, slug: `${slug}-${Date.now()}` }
        continue
      }

      // Duplicate website (race condition) → friendly message
      if (error.code === '23505' && error.message?.includes('website')) {
        return NextResponse.json({
          error: 'This website is already listed. Find it in the directory and click "Claim Listing" to take ownership.',
        }, { status: 409 })
      }

      // Unknown column → strip it and retry
      if (error.message?.includes('Could not find the')) {
        row = stripUnknownColumns(row as Record<string, unknown>, error.message) as typeof row
        continue
      }

      // Any other error
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'Schema mismatch — please run the migration SQL in Supabase.' },
      { status: 500 }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
