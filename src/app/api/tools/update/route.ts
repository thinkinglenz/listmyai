import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED = [
  'name', 'tagline', 'description', 'website',
  'logo_url', 'cover_url', 'video_url', 'demo_url', 'screenshots',
  'category_id',
  'pricing_model', 'starting_price', 'pricing_url',
  'has_free_trial', 'trial_duration', 'promo_code', 'promo_desc',
  'has_api', 'api_docs_url', 'no_code', 'gdpr_compliant', 'platforms', 'integrations',
  'company_name', 'company_description', 'hq_location', 'founded_year', 'team_size',
  'contact_name', 'contact_email', 'contact_phone', 'support_url',
  'twitter_url', 'linkedin_url', 'github_url', 'discord_url', 'youtube_url',
  'facebook_url', 'instagram_url', 'tiktok_url', 'product_hunt_url',
  'target_audience', 'use_cases', 'tags', 'alternatives',
  'social_promotion_consent', 'creatives', 'brand_guidelines_url',
]

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sbUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
            c.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch {}
            })
          },
        },
      }
    )
    const { data: { user } } = await sbUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { tool_id, ...updates } = await req.json()
    if (!tool_id) return NextResponse.json({ error: 'tool_id required' }, { status: 400 })

    const { data: tool } = await supabase
      .from('ai_tools')
      .select('id, claimed_by, submitted_by')
      .eq('id', tool_id)
      .maybeSingle()

    if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

    const isOwner = tool.claimed_by === user.id || tool.submitted_by === user.id
    if (!isOwner) return NextResponse.json({ error: 'You do not own this listing' }, { status: 403 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of ALLOWED) {
      if (key in updates) patch[key] = updates[key]
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase.from('ai_tools').update(patch).eq('id', tool_id)
      if (!error) return NextResponse.json({ success: true })
      if (error.message?.includes('Could not find the')) {
        const col = error.message.match(/Could not find the '(.+?)' column/)?.[1]
        if (col) { delete patch[col]; continue }
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Update failed after retries' }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sbUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
            c.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch {}
            })
          },
        },
      }
    )
    const { data: { user } } = await sbUser.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const slug = new URL(req.url).searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const { data: tool } = await supabase
      .from('ai_tools')
      .select('*, categories(id, slug, name)')
      .eq('slug', slug)
      .maybeSingle()

    if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

    const isOwner = tool.claimed_by === user.id || tool.submitted_by === user.id
    if (!isOwner) return NextResponse.json({ error: 'You do not own this listing' }, { status: 403 })

    return NextResponse.json({ tool })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
