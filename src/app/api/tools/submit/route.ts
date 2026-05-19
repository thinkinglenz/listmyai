import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      name, website, tagline, description, category, pricing_model,
      starting_price, has_free_trial, trial_duration, promo_code, promo_desc,
      has_api, company_name, hq_location, founded_year,
      contact_email, contact_name,
    } = body

    if (!name || !website || !tagline || !category || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate slug from name
    const slug = name.toLowerCase()
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

    const { error } = await supabase.from('ai_tools').insert({
      slug,
      name,
      tagline,
      description,
      website,
      category_id: catRow?.id ?? 1,
      pricing_model: pricing_model?.toLowerCase().replace(/\s+/g, '_') ?? 'free',
      starting_price,
      has_free_trial: has_free_trial ?? false,
      trial_duration,
      promo_code,
      promo_desc,
      has_api: has_api ?? false,
      company_name,
      hq_location,
      founded_year,
      contact_email,
      contact_name,
      status: 'pending',
      is_featured: false,
      is_sponsored: false,
      is_auto_enrolled: false,
      upvotes: 0,
      rating_avg: 0,
      rating_count: 0,
      view_count: 0,
      click_count: 0,
    })

    if (error) {
      // Duplicate slug — try with timestamp suffix
      if (error.code === '23505') {
        const { error: e2 } = await supabase.from('ai_tools').insert({
          slug: `${slug}-${Date.now()}`,
          name, tagline, description, website,
          category_id: catRow?.id ?? 1,
          pricing_model: pricing_model?.toLowerCase().replace(/\s+/g, '_') ?? 'free',
          starting_price, has_free_trial: has_free_trial ?? false,
          trial_duration, promo_code, promo_desc, has_api: has_api ?? false,
          company_name, hq_location, founded_year, contact_email, contact_name,
          status: 'pending', is_featured: false, is_sponsored: false,
          is_auto_enrolled: false, upvotes: 0, rating_avg: 0,
          rating_count: 0, view_count: 0, click_count: 0,
        })
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
