import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ToolInput {
  name: string
  tagline?: string
  description?: string
  website: string
  category?: string
}

function slugify(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Auth check
    if (body.secret !== process.env.IMPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tools: ToolInput[] = body.tools ?? []
    if (!tools.length) return NextResponse.json({ imported: 0, skipped: 0 })

    // Load existing websites for dedup
    const { data: existing } = await supabase.from('ai_tools').select('website')
    const knownSites = new Set<string>(
      (existing ?? []).map((r: { website: string }) =>
        (r.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
      )
    )

    let imported = 0, skipped = 0
    const errors: string[] = []

    // Probe which status values the check constraint allows
    let useStatus = 'active'

    for (const tool of tools) {
      if (!tool.name || !tool.website) { skipped++; continue }

      const norm = tool.website.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
      if (knownSites.has(norm)) { skipped++; continue }

      // Look up category id
      const catName = tool.category ?? 'Other'
      const { data: cat } = await supabase
        .from('categories').select('id')
        .ilike('name', `%${catName.split(' ')[0]}%`)
        .maybeSingle()

      const baseRow = {
        slug: `${slugify(tool.name)}-${Date.now()}`,
        name: tool.name,
        tagline: tool.tagline ?? tool.name,
        description: tool.description ?? '',
        website: tool.website,
        category_id: cat?.id ?? null,
        status: useStatus,
        claimed: false,
        is_featured: false,
        is_sponsored: false,
        upvotes: 0,
        rating_avg: 0,
        rating_count: 0,
        view_count: 0,
        click_count: 0,
      }

      let { error } = await supabase.from('ai_tools').insert(baseRow)

      // If check constraint fails on 'active', retry with 'pending'
      if (error && error.message.includes('check constraint')) {
        useStatus = 'pending'
        const retryRow = { ...baseRow, status: 'pending' }
        const retry = await supabase.from('ai_tools').insert(retryRow)
        error = retry.error
      }

      // If column doesn't exist error, strip that column and retry
      if (error && error.message.includes('column')) {
        // Retry with minimal columns only
        const minRow = {
          slug: baseRow.slug,
          name: baseRow.name,
          tagline: baseRow.tagline,
          description: baseRow.description,
          website: baseRow.website,
          category_id: baseRow.category_id,
          status: useStatus,
        }
        const retry = await supabase.from('ai_tools').insert(minRow)
        error = retry.error
      }

      if (error) {
        if (error.code === '23505') { skipped++; continue }
        errors.push(`${tool.name}: ${error.message}`)
      } else {
        imported++
        knownSites.add(norm)
      }
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
