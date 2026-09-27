// Fills in comparison enrichment, a fixed number at a time.
//
// The comparison page reads cache only, so something has to write it. That used
// to be the first page view, which meant a crawler hitting thousands of
// comparison URLs could trigger thousands of Claude calls against a prepaid
// balance shared with the blog cron. Here the spend is bounded by BATCH,
// whatever the traffic does.
//
// Pairs are chosen exactly as sitemap.ts chooses them, so the pages that get
// written are the ones Google is being told about.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateAndCache } from '@/lib/compare/enrichment'
import { requireAdmin } from '@/lib/admin-auth'

export const maxDuration = 300

/** Comparisons enriched per run. One Claude Haiku call each. */
const BATCH = 25

/** Matches COMPARABLE_PER_CATEGORY in sitemap.ts. */
const COMPARABLE_PER_CATEGORY = 15

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Vercel cron (Bearer CRON_SECRET) or the admin panel's session cookie,
  // same gate every other cron route in this project uses.
  const denied = requireAdmin(req, 'CRON_SECRET')
  if (denied) return denied

  const { data: tools } = await supabase
    .from('ai_tools')
    .select('slug, description, category_id, upvotes, view_count')
    .eq('status', 'active')
    .limit(1000)

  if (!tools?.length) {
    return NextResponse.json({ ok: true, note: 'no tools' })
  }

  // Same ranking as the sitemap: real interest, and something to compare.
  const score = (t: { upvotes?: number | null; view_count?: number | null }) =>
    (t.upvotes ?? 0) * 10 + (t.view_count ?? 0)

  const byCategory = new Map<string, typeof tools>()
  for (const t of tools) {
    const key = String(t.category_id ?? 'none')
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key)!.push(t)
  }

  const candidates: string[] = []
  byCategory.forEach(categoryTools => {
    const ranked = categoryTools
      .filter(t => (t.description ?? '').trim().length > 60)
      .sort((a, b) => score(b) - score(a))
      .slice(0, COMPARABLE_PER_CATEGORY)
    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        candidates.push(`${ranked[i].slug}-vs-${ranked[j].slug}`)
      }
    }
  })

  // Skip what is already written, so a run never pays twice for the same pair.
  const { data: done } = await supabase
    .from('comparison_enrichment')
    .select('comparison_slug')
    .limit(10000)
  const already = new Set((done ?? []).map(r => r.comparison_slug))

  const todo = candidates.filter(s => !already.has(s)).slice(0, BATCH)

  let written = 0
  const failed: string[] = []
  for (const slug of todo) {
    const result = await generateAndCache(slug)
    if (result) written++
    else failed.push(slug)
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    alreadyEnriched: already.size,
    attempted: todo.length,
    written,
    failed: failed.length,
    remaining: candidates.length - already.size - written,
  })
}
