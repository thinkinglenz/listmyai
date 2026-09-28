import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, autoEnrollWelcomeEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'

// How many emails to send per cron tick (tweak via env if needed)
const BATCH_SIZE = parseInt(process.env.OUTREACH_BATCH_SIZE ?? '20', 10)

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

async function sendWithRetry(opts: Parameters<typeof sendEmail>[0]) {
  try {
    await sendEmail(opts)
  } catch (err) {
    if (String(err).includes('429')) {
      await sleep(1200)
      await sendEmail(opts)
    } else {
      throw err
    }
  }
}

export async function GET(req: NextRequest) {
  // Vercel cron sends `Authorization: Bearer $CRON_SECRET`; an admin session
  // may also trigger it by hand. Fails closed if CRON_SECRET is unset.
  const denied = requireAdmin(req, 'CRON_SECRET')
  if (denied) return denied

  // Fetch next batch of unclaimed, un-emailed tools that have a contact address
  const { data: tools, error } = await supabase
    .from('ai_tools')
    .select('id, name, slug, website, contact_email')
    .eq('status', 'active')
    .eq('claimed', false)
    .is('outreach_sent_at', null)
    .not('contact_email', 'is', null)
    .neq('contact_email', '')
    .order('created_at', { ascending: true }) // oldest first
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[cron/outreach] fetch error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!tools || tools.length === 0) {
    return NextResponse.json({ ok: true, message: 'No pending tools — all done!', sent: 0, failed: 0 })
  }

  // Count total remaining (for progress info in the response)
  const { count: remaining } = await supabase
    .from('ai_tools')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('claimed', false)
    .is('outreach_sent_at', null)
    .not('contact_email', 'is', null)
    .neq('contact_email', '')

  const results: { name: string; email: string; sent: boolean; error?: string }[] = []

  for (const tool of tools) {
    const claimUrl = `${APP_URL}/tools/${tool.slug}`
    const html = autoEnrollWelcomeEmail(tool.name, tool.website, claimUrl)

    try {
      await sendWithRetry({
        to: tool.contact_email,
        subject: `Your tool "${tool.name}" is now listed on ListmyAI`,
        html,
      })

      await supabase
        .from('ai_tools')
        .update({ outreach_sent_at: new Date().toISOString() })
        .eq('id', tool.id)

      results.push({ name: tool.name, email: tool.contact_email, sent: true })
    } catch (err) {
      results.push({ name: tool.name, email: tool.contact_email, sent: false, error: String(err) })
    }

    // Stay under Resend's 2 req/s rate limit
    await sleep(600)
  }

  const sent = results.filter(r => r.sent).length
  const failed = results.filter(r => !r.sent).length
  const stillPending = Math.max(0, (remaining ?? 0) - sent)

  console.log(`[cron/outreach] sent=${sent} failed=${failed} stillPending=${stillPending}`)

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    batchSize: tools.length,
    stillPending,
    results,
  })
}
