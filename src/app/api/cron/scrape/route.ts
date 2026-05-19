import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron Job — runs daily via vercel.json cron schedule.
// Reads the scrape queue from scrape_log, calls Python scraper,
// then imports results via the /api/import endpoint.
// Protected by CRON_SECRET (set in Vercel env + vercel.json).

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

const PYTHON_SCRAPER_URL = process.env.PYTHON_SCRAPER_URL ?? ''
const IMPORT_SECRET = process.env.IMPORT_SECRET ?? ''

export async function GET(req: NextRequest) {
  // Vercel sets this header automatically for cron jobs
  const cronSecret = req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const now = new Date().toISOString()

  // Pull up to 50 sources not scraped in the last 7 days
  const { data: sources, error } = await supabase
    .from('scrape_log')
    .select('id, source_url, last_scraped_at')
    .or(`last_scraped_at.is.null,last_scraped_at.lt.${new Date(Date.now() - 7 * 86400_000).toISOString()}`)
    .eq('status', 'pending')
    .limit(50)

  if (error) {
    console.error('[cron/scrape] fetch sources error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!sources || sources.length === 0) {
    return NextResponse.json({ ok: true, scraped: 0, message: 'No sources due' })
  }

  const results: { url: string; status: string }[] = []

  for (const source of sources) {
    try {
      // If a Python scraper sidecar is configured, call it
      if (PYTHON_SCRAPER_URL) {
        const scraperRes = await fetch(`${PYTHON_SCRAPER_URL}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source.source_url }),
          signal: AbortSignal.timeout(30_000),
        })

        if (scraperRes.ok) {
          const tool = await scraperRes.json()

          // Forward to import endpoint
          const importRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${IMPORT_SECRET}`,
            },
            body: JSON.stringify({ ...tool, source_url: source.source_url }),
          })

          if (importRes.ok) {
            results.push({ url: source.source_url, status: 'imported' })
          } else {
            results.push({ url: source.source_url, status: 'import_failed' })
          }
        } else {
          results.push({ url: source.source_url, status: 'scrape_failed' })
        }
      } else {
        // No scraper configured — mark as skipped so queue doesn't re-run immediately
        results.push({ url: source.source_url, status: 'skipped_no_scraper' })
      }

      // Update last_scraped_at regardless of outcome
      await supabase
        .from('scrape_log')
        .update({ last_scraped_at: now })
        .eq('id', source.id)
    } catch (err) {
      console.error('[cron/scrape] error for', source.source_url, err)
      results.push({ url: source.source_url, status: 'error' })
    }
  }

  return NextResponse.json({ ok: true, scraped: sources.length, results })
}
