import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail, submissionConfirmationEmail, adminNewListingEmail } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? 'listmyai@gmail.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'

function orNull(v: unknown): unknown { return v || null }
function toBool(v: unknown): boolean { return !!v }
function toArr(v: unknown): string[] | null {
  if (Array.isArray(v)) return v.length ? v : null
  return null
}

function buildInsert(slug: string, body: Record<string, unknown>, catId: number) {
  return {
    slug,
    name: body.name,
    tagline: orNull(body.tagline),
    description: orNull(body.description),
    website: body.website,
    category_id: catId,
    pricing_model: ((body.pricing_model as string) ?? '').toLowerCase().replace(/\s+/g, '_') || 'free',
    starting_price: orNull(body.starting_price),
    pricing_url: orNull(body.pricing_url),
    has_free_trial: toBool(body.has_free_trial),
    trial_duration: orNull(body.trial_duration),
    promo_code: orNull(body.promo_code),
    promo_desc: orNull(body.promo_desc),
    has_api: toBool(body.has_api),
    api_docs_url: orNull(body.api_docs_url),
    no_code: toBool(body.no_code),
    gdpr_compliant: toBool(body.gdpr_compliant),
    platforms: toArr(body.platforms),
    integrations: orNull(body.integrations),
    // Media
    logo_url: orNull(body.logo_url),
    video_url: orNull(body.video_url),
    demo_url: orNull(body.demo_url),
    screenshots: toArr(body.screenshots),
    // Company
    company_name: orNull(body.company_name),
    company_description: orNull(body.company_description),
    hq_location: orNull(body.hq_location),
    founded_year: orNull(body.founded_year),
    team_size: orNull(body.team_size),
    // Contact
    contact_name: orNull(body.contact_name),
    contact_email: orNull(body.contact_email),
    contact_phone: orNull(body.contact_phone),
    support_url: orNull(body.support_url),
    // Social
    twitter_url: orNull(body.twitter_url),
    linkedin_url: orNull(body.linkedin_url),
    github_url: orNull(body.github_url),
    discord_url: orNull(body.discord_url),
    youtube_url: orNull(body.youtube_url),
    facebook_url: orNull(body.facebook_url),
    instagram_url: orNull(body.instagram_url),
    tiktok_url: orNull(body.tiktok_url),
    product_hunt_url: orNull(body.product_hunt_url),
    // Audience
    target_audience: orNull(body.target_audience),
    use_cases: orNull(body.use_cases),
    tags: toArr(body.tags),
    // Promotion
    social_promotion_consent: toBool(body.social_promotion_consent),
    creatives: toArr(body.creatives),
    brand_guidelines_url: orNull(body.brand_guidelines_url),
    // Status
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
        // ✅ Saved — send confirmation to submitter (non-blocking)
        sendEmail({
          to: contact_email,
          subject: `✅ "${name}" has been submitted to ListmyAI`,
          html: submissionConfirmationEmail(contact_name ?? '', name, contact_email, APP_URL),
        }).catch(err => console.error('[submit email - submitter]', err))

        // ✅ Notify admin of new listing (non-blocking)
        sendEmail({
          to: ADMIN_EMAIL,
          subject: `🆕 New listing submitted: "${name}"`,
          html: adminNewListingEmail(
            name,
            body.website as string,
            contact_name ?? '',
            contact_email,
            body.category as string,
            (body.pricing_model as string) ?? 'unknown',
            APP_URL,
          ),
        }).catch(err => console.error('[submit email - admin]', err))

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
