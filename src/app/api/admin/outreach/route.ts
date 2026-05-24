import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, autoEnrollWelcomeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'

// GET — list tools eligible for outreach
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'pending' // pending | sent | all
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = 30
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Count queries
  const [
    { count: totalWithEmail },
    { count: totalSent },
    { count: totalPending },
  ] = await Promise.all([
    supabase.from('ai_tools').select('*', { count: 'exact', head: true })
      .eq('status', 'active').not('contact_email', 'is', null).neq('contact_email', ''),
    supabase.from('ai_tools').select('*', { count: 'exact', head: true })
      .eq('status', 'active').not('contact_email', 'is', null).neq('contact_email', '')
      .not('outreach_sent_at', 'is', null),
    supabase.from('ai_tools').select('*', { count: 'exact', head: true })
      .eq('status', 'active').not('contact_email', 'is', null).neq('contact_email', '')
      .is('outreach_sent_at', null).eq('claimed', false),
  ])

  // Data query — build step by step to avoid TS deep instantiation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('ai_tools')
    .select('id, name, slug, website, contact_email, claimed, outreach_sent_at, created_at')
    .eq('status', 'active')
    .not('contact_email', 'is', null)
    .neq('contact_email', '')

  if (filter === 'pending') {
    query = query.is('outreach_sent_at', null).eq('claimed', false)
  } else if (filter === 'sent') {
    query = query.not('outreach_sent_at', 'is', null)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data: tools, error } = await query

  if (error) {
    // If outreach_sent_at column doesn't exist, return helpful error
    if (error.message.includes('outreach_sent_at')) {
      return NextResponse.json({
        error: 'Column outreach_sent_at missing. Run this SQL:\n\nALTER TABLE ai_tools ADD COLUMN outreach_sent_at timestamptz;',
        needsMigration: true,
      }, { status: 500 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    tools: tools ?? [],
    stats: {
      totalWithEmail: totalWithEmail ?? 0,
      totalSent: totalSent ?? 0,
      totalPending: totalPending ?? 0,
    },
    page,
    pageSize,
    total: filter === 'pending' ? (totalPending ?? 0) : filter === 'sent' ? (totalSent ?? 0) : (totalWithEmail ?? 0),
    totalPages: Math.ceil(((filter === 'pending' ? totalPending : filter === 'sent' ? totalSent : totalWithEmail) ?? 0) / pageSize),
  })
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

/** Send one email with a single 429-retry (waits retryAfter ms then tries once more) */
async function sendWithRetry(opts: Parameters<typeof sendEmail>[0]) {
  try {
    await sendEmail(opts)
  } catch (err) {
    const msg = String(err)
    if (msg.includes('429')) {
      // Resend says max 2 req/s — back off 1 s then retry once
      await sleep(1000)
      await sendEmail(opts) // let this throw if it fails again
    } else {
      throw err
    }
  }
}

// POST — send outreach email(s)
export async function POST(req: NextRequest) {
  const { toolIds } = await req.json()

  if (!toolIds || !Array.isArray(toolIds) || toolIds.length === 0) {
    return NextResponse.json({ error: 'toolIds array required' }, { status: 400 })
  }

  if (toolIds.length > 50) {
    return NextResponse.json({ error: 'Max 50 tools per batch' }, { status: 400 })
  }

  // Fetch tools
  const { data: tools, error } = await supabase
    .from('ai_tools')
    .select('id, name, slug, website, contact_email, outreach_sent_at, claimed')
    .in('id', toolIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tools || tools.length === 0) return NextResponse.json({ error: 'No tools found' }, { status: 404 })

  const results: { id: string; name: string; email: string; sent: boolean; error?: string }[] = []

  for (const tool of tools) {
    // Skip if already sent or claimed
    if (tool.outreach_sent_at) {
      results.push({ id: tool.id, name: tool.name, email: tool.contact_email, sent: false, error: 'Already contacted' })
      continue
    }
    if (tool.claimed) {
      results.push({ id: tool.id, name: tool.name, email: tool.contact_email, sent: false, error: 'Already claimed' })
      continue
    }
    if (!tool.contact_email) {
      results.push({ id: tool.id, name: tool.name, email: '', sent: false, error: 'No email' })
      continue
    }

    const claimUrl = `${APP_URL}/tools/${tool.slug}`
    const html = autoEnrollWelcomeEmail(tool.name, tool.website, claimUrl)

    try {
      await sendWithRetry({
        to: tool.contact_email,
        subject: `Your tool "${tool.name}" is now listed on ListmyAI`,
        html,
      })

      // Mark as sent
      await supabase
        .from('ai_tools')
        .update({ outreach_sent_at: new Date().toISOString() })
        .eq('id', tool.id)

      results.push({ id: tool.id, name: tool.name, email: tool.contact_email, sent: true })
    } catch (err) {
      results.push({ id: tool.id, name: tool.name, email: tool.contact_email, sent: false, error: String(err) })
    }

    // Resend free tier: max 2 req/s → wait 600 ms between sends to stay safely under the limit
    await sleep(600)
  }

  const sent = results.filter(r => r.sent).length
  const failed = results.filter(r => !r.sent).length

  return NextResponse.json({ sent, failed, total: results.length, results })
}
