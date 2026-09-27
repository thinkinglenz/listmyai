// Manual trigger for one comparison's enrichment.
//
// The comparison page no longer calls this: it reads the cache during server
// render so the content ships in the HTML, and the capped cron does the writing.
// What is left here is an admin tool for filling in a specific pair on demand.
//
// Admin-gated, because each call costs a Claude request. Open to the public it
// was a way for anyone to spend the Anthropic balance one URL at a time.
import { NextRequest, NextResponse } from 'next/server'
import { generateAndCache, parseComparisonSlug } from '@/lib/compare/enrichment'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const denied = requireAdmin(req, 'CRON_SECRET')
  if (denied) return denied

  const { slug } = await params
  if (!parseComparisonSlug(slug)) {
    return NextResponse.json({ error: 'Invalid comparison slug format' }, { status: 400 })
  }

  const enrichment = await generateAndCache(slug)
  if (!enrichment) {
    return NextResponse.json({ error: 'Could not generate enrichment' }, { status: 502 })
  }

  return NextResponse.json(enrichment)
}
