/**
 * Moves listings out of "Other" (and out of no category at all) into the
 * category they actually belong to.
 *
 * Roughly a quarter of the index sits unclassified, which leaves category
 * pages thin and gives the job-keyed agent pages nothing accurate to map to.
 *
 * Runs as a DRY RUN unless told otherwise. The report it returns is the point:
 * a pass that silently rewrites a quarter of the catalogue is not something
 * anyone should trigger without seeing what it intends to do first.
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'
import { classify, CATEGORY_IDS, type CategoryName } from '@/lib/classify-tool'
import { classifyWithLlm, llmAvailable, type LlmItem } from '@/lib/classify-llm'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Rows considered unclassified: literally "Other", or nothing at all. */
const OTHER_ID = CATEGORY_IDS.Other
/** Listings per model call. Small enough that one bad batch costs little. */
const LLM_BATCH = 25
/** Ceiling per run, so a click cannot start an unbounded job. */
const MAX_LIMIT = 500
/** Lower ceiling when the model stage runs: batches are sequential, and the
 *  function is killed at 60s regardless of how much work is left. */
const MAX_LIMIT_LLM = 150

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface Row { id: number; name: string | null; tagline: string | null; description: string | null; slug: string | null }

export async function POST(req: NextRequest) {
  // requireAdmin returns a response when it REFUSES, and null when it allows.
  const denied = requireAdmin(req, 'IMPORT_SECRET')
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  // Dry run is the default, and only an explicit `false` turns it off. A typo
  // in the request body must not be what writes to 4,900 rows.
  const dryRun = body?.dryRun !== false
  const useLlm = body?.useLlm === true
  // The model stage runs batches one after another, so a 500-row run would
  // sit well past the 60s function ceiling and be killed mid-write. The rules
  // stage is instant and can take the full ceiling.
  const ceiling = useLlm ? MAX_LIMIT_LLM : MAX_LIMIT
  const limit = Math.min(Number(body?.limit) || (useLlm ? 100 : 200), ceiling)

  const supabase = db()
  const { data, error } = await supabase
    .from('ai_tools')
    .select('id, name, tagline, description, slug')
    .or(`category_id.is.null,category_id.eq.${OTHER_ID}`)
    .order('id')
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as Row[]
  const decided = new Map<number, { categoryId: number; categoryName: CategoryName; via: 'rules' | 'model' }>()
  const undecided: Row[] = []

  // Stage 1 — keyword rules. Free, deterministic, and testable.
  for (const row of rows) {
    const r = classify({ name: row.name, tagline: row.tagline, description: row.description })
    if (r.categoryId && r.categoryName) {
      decided.set(row.id, { categoryId: r.categoryId, categoryName: r.categoryName, via: 'rules' })
    } else {
      undecided.push(row)
    }
  }

  // Stage 2 — the model reads what the rules could not.
  let llmCalls = 0
  const modelReady = llmAvailable()
  if (useLlm && modelReady && undecided.length > 0) {
    for (let i = 0; i < undecided.length; i += LLM_BATCH) {
      const batch = undecided.slice(i, i + LLM_BATCH)
      const items: LlmItem[] = batch.map(r => ({
        id: r.id, name: r.name, tagline: r.tagline, description: r.description,
      }))
      const verdicts = await classifyWithLlm(items)
      llmCalls++
      for (const v of verdicts) {
        if (v.categoryId && v.categoryName) {
          decided.set(v.id, { categoryId: v.categoryId, categoryName: v.categoryName, via: 'model' })
        }
      }
    }
  }

  // Group by target so the write is one statement per category, not per row.
  const byCategory = new Map<number, { name: CategoryName; ids: number[] }>()
  for (const [id, d] of decided) {
    const entry = byCategory.get(d.categoryId) ?? { name: d.categoryName, ids: [] }
    entry.ids.push(id)
    byCategory.set(d.categoryId, entry)
  }

  let written = 0
  const writeErrors: string[] = []
  if (!dryRun) {
    for (const [categoryId, { name, ids }] of byCategory) {
      const { error: upErr } = await supabase
        .from('ai_tools')
        .update({ category_id: categoryId, updated_at: new Date().toISOString() })
        .in('id', ids)
      if (upErr) writeErrors.push(`${name}: ${upErr.message}`)
      else written += ids.length
    }
    if (written > 0) {
      // Category pages and the directory both count by category.
      try {
        revalidatePath('/categories')
        revalidatePath('/directory')
      } catch (err) {
        console.warn('[reclassify] revalidate failed:', err)
      }
    }
  }

  const stillUnclassified = rows.length - decided.size
  return NextResponse.json({
    dryRun,
    scanned: rows.length,
    classified: decided.size,
    byRules: [...decided.values()].filter(d => d.via === 'rules').length,
    byModel: [...decided.values()].filter(d => d.via === 'model').length,
    stillUnclassified,
    llmCalls,
    modelReady,
    // Asked for the model, but there is no key to call it with. Without this
    // the caller cannot tell an unconfigured stage from a stage that ran and
    // was unsure about everything.
    ...(useLlm && !modelReady && {
      warning: 'GEMINI_API_KEY is not set, so the model stage did not run. Only the keyword rules were applied.',
    }),
    written: dryRun ? 0 : written,
    ...(writeErrors.length && { writeErrors }),
    breakdown: [...byCategory.entries()]
      .map(([id, v]) => ({ categoryId: id, category: v.name, count: v.ids.length }))
      .sort((a, b) => b.count - a.count),
    // A sample so the decision can be eyeballed before anything is written.
    sample: rows
      .filter(r => decided.has(r.id))
      .slice(0, 25)
      .map(r => ({
        slug: r.slug,
        name: r.name,
        tagline: (r.tagline ?? '').slice(0, 70),
        to: decided.get(r.id)!.categoryName,
        via: decided.get(r.id)!.via,
      })),
  })
}
