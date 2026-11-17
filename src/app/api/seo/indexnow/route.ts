import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { agentEntries } from '@/lib/seo/sitemap-data'

export const runtime = 'nodejs'
export const maxDuration = 60

const HOST = 'listmyai.com'
const BASE = `https://${HOST}`
// Submitting to one IndexNow endpoint shares the URLs with every participating
// engine, so there is nothing to gain from calling several.
const ENDPOINT = 'https://api.indexnow.org/IndexNow'
const BATCH = 10_000 // the protocol's per-request ceiling

/**
 * Tell Bing (and the other IndexNow engines) about the agent pages.
 *
 * Admin-gated: this is a write to an external service that is rate-limited per
 * domain, and an open endpoint here would let anyone burn that budget.
 *
 * POST with {"dryRun": true} to see exactly what would be submitted without
 * submitting it. That is the default, because a submission cannot be recalled.
 */
export async function POST(req: NextRequest) {
  // requireAdmin returns a response when it REFUSES and null when it allows.
  const denied = requireAdmin(req, 'IMPORT_SECRET')
  if (denied) return denied

  const key = process.env.INDEXNOW_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'INDEXNOW_KEY is not set, so ownership cannot be proven and a submission would be rejected.' },
      { status: 503 },
    )
  }

  let body: { dryRun?: boolean; urls?: string[] } = {}
  try { body = await req.json() } catch { /* an empty body means defaults */ }

  const dryRun = body.dryRun !== false
  const urls = Array.isArray(body.urls) && body.urls.length
    // Only our own URLs: IndexNow rejects a mixed host, and accepting an
    // arbitrary list would make this an open relay for someone else's domain.
    ? body.urls.filter(u => typeof u === 'string' && u.startsWith(`${BASE}/`))
    : agentEntries().map(e => e.loc)

  if (!urls.length) return NextResponse.json({ error: 'No URLs on this host to submit.' }, { status: 400 })

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      wouldSubmit: urls.length,
      keyLocation: `${BASE}/indexnow-key.txt`,
      sample: urls.slice(0, 10),
      note: 'Send {"dryRun": false} to submit. A submission cannot be withdrawn.',
    })
  }

  const results: { batch: number; count: number; status: number; ok: boolean }[] = []
  for (let i = 0; i < urls.length; i += BATCH) {
    const slice = urls.slice(i, i + BATCH)
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `${BASE}/indexnow-key.txt`,
        urlList: slice,
      }),
    })
    // 200 and 202 both mean accepted. Report the code rather than collapsing
    // them, because 403 (key not found) and 422 (host mismatch) are the two
    // that actually need acting on and they must not look like a generic fail.
    results.push({ batch: results.length + 1, count: slice.length, status: res.status, ok: res.ok })
  }

  return NextResponse.json({ dryRun: false, submitted: urls.length, results })
}
