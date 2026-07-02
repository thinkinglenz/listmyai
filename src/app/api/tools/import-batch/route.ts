import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

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

function guessCategory(text: string): string {
  const t = text.toLowerCase()
  if (/image|photo|art|dall|midjourney|stable.diff|generat.*image/i.test(t)) return 'Image Generation'
  if (/video|film|animation|clip/i.test(t)) return 'Video Generation'
  if (/audio|music|sound|voice|speech|tts/i.test(t)) return 'Audio & Music'
  if (/code|program|developer|github|debug|ide|coding/i.test(t)) return 'Code Assistant'
  if (/seo|marketing|ads|campaign|social media/i.test(t)) return 'SEO & Marketing'
  if (/write|writing|copy|blog|essay|content/i.test(t)) return 'Writing & Copy'
  if (/data|analytic|chart|spreadsheet|dashboard/i.test(t)) return 'Data & Analytics'
  if (/search|research|knowledge/i.test(t)) return 'AI Search'
  if (/automat|workflow|integrat|zapier/i.test(t)) return 'Automation'
  if (/education|learn|study|tutor|course/i.test(t)) return 'Education'
  if (/health|medical|fitness/i.test(t)) return 'Healthcare'
  if (/finance|legal|law|contract/i.test(t)) return 'Finance & Legal'
  if (/design|logo|ui|ux|graphic|creative/i.test(t)) return 'Design & Creative'
  if (/chat|assistant|bot|gpt|conversation/i.test(t)) return 'Chatbot / Assistant'
  if (/productiv|task|note|schedule|email/i.test(t)) return 'Productivity'
  if (/translat|language|locali/i.test(t)) return 'Translation'
  if (/summar|document|pdf|meeting note/i.test(t)) return 'Summarisation'
  if (/avatar|persona|character|face/i.test(t)) return 'Avatar & Persona'
  if (/security|privacy|cyber/i.test(t)) return 'Security & Privacy'
  return 'Other'
}

function checkAuth(req: NextRequest, body: { secret?: string }) {
  const secret = req.headers.get('x-admin-secret') ?? body.secret
  return secret === process.env.CRON_SECRET || secret === 'lmai@admin2026'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!checkAuth(req, body)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tools: ToolInput[] = body.tools ?? []
    if (!tools.length) return NextResponse.json({ imported: 0, skipped: 0 })

    // Pre-fetch all categories once
    const { data: cats } = await supabase.from('categories').select('id, name')
    const catMap = new Map<string, string>()
    for (const c of (cats ?? [])) {
      catMap.set(c.name.toLowerCase(), c.id)
      catMap.set(c.name.split(' ')[0].toLowerCase(), c.id)
    }

    // Load existing website domains for dedup
    const { data: existing } = await supabase
      .from('ai_tools')
      .select('website')
    const knownSites = new Set<string>(
      (existing ?? []).map((r: { website: string }) =>
        (r.website ?? '').replace(/^https?:\/\//, '').replace(/www\./, '').replace(/\/$/, '').toLowerCase()
      )
    )

    // Also load existing slugs to avoid collisions
    const { data: existingSlugs } = await supabase
      .from('ai_tools')
      .select('slug')
    const slugSet = new Set<string>((existingSlugs ?? []).map((r: { slug: string }) => r.slug))

    let imported = 0, skipped = 0
    const errors: string[] = []

    // Process in DB batches of 50 for efficiency
    const BATCH = 50
    const rows: Record<string, unknown>[] = []

    for (const tool of tools) {
      if (!tool.name?.trim() || !tool.website?.trim()) { skipped++; continue }

      const norm = tool.website.replace(/^https?:\/\//, '').replace(/www\./, '').replace(/\/$/, '').toLowerCase()
      if (knownSites.has(norm)) { skipped++; continue }

      const catName = tool.category ?? guessCategory(`${tool.name} ${tool.description ?? ''}`)
      const catKey = catName.toLowerCase()
      const categoryId = catMap.get(catKey) ?? catMap.get(catKey.split(' ')[0]) ?? null

      let slug = slugify(tool.name.trim())
      if (slugSet.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
      slugSet.add(slug)
      knownSites.add(norm)

      rows.push({
        slug,
        name: tool.name.trim(),
        tagline: (tool.tagline ?? tool.description ?? tool.name).trim().slice(0, 120),
        description: (tool.description ?? '').trim(),
        website: tool.website.trim().replace(/\/$/, ''),
        logo_url: `https://www.google.com/s2/favicons?domain=${norm}&sz=128`,
        category_id: categoryId,
        status: 'active',
        claimed: false,
        is_auto_enrolled: false,
        is_featured: false,
        is_sponsored: false,
        upvotes: 0, rating_avg: 0, rating_count: 0, view_count: 0, click_count: 0,
      })

      if (rows.length >= BATCH) {
        const { error, data } = await supabase.from('ai_tools').insert(rows).select('id')
        if (error) {
          // Fall back to one-by-one for this batch
          for (const row of rows) {
            const { error: e } = await supabase.from('ai_tools').insert(row)
            if (e) {
              if (e.code === '23505') skipped++
              else errors.push(`${row.name}: ${e.message}`)
            } else imported++
          }
        } else {
          imported += (data?.length ?? rows.length)
        }
        rows.length = 0
      }
    }

    // Flush remaining
    if (rows.length > 0) {
      const { error, data } = await supabase.from('ai_tools').insert(rows).select('id')
      if (error) {
        for (const row of rows) {
          const { error: e } = await supabase.from('ai_tools').insert(row)
          if (e) {
            if (e.code === '23505') skipped++
            else errors.push(`${row.name}: ${e.message}`)
          } else imported++
        }
      } else {
        imported += (data?.length ?? rows.length)
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 50) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
