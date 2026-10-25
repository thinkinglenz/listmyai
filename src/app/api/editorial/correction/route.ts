// An owner (or anyone) telling us something in an editorial is wrong.
//
// Open to anyone on purpose. Requiring a sign-in would mean the only people
// who can report an error are the ones who already claimed the listing, and a
// factual mistake is worth hearing about from whoever spotted it. Nothing here
// edits the page: it files a message a human reads.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN = 20
const MAX = 4000
/** Two from the same address about the same piece inside this window is a
 *  double-click or a flood, not two corrections. */
const REPEAT_WINDOW_MINUTES = 10

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as
    { slug?: string; email?: string; message?: string }

  const slug = (body.slug ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const message = (body.message ?? '').trim()

  if (!slug) return NextResponse.json({ error: 'Missing editorial' }, { status: 400 })
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address so we can reply' }, { status: 400 })
  }
  if (message.length < MIN) {
    return NextResponse.json({ error: 'Please say what is wrong, in a sentence or two' }, { status: 400 })
  }
  if (message.length > MAX) {
    return NextResponse.json({ error: 'That is too long — please keep it under 4,000 characters' }, { status: 400 })
  }

  // The editorial has to exist. Otherwise this is a form that accepts anything
  // and fills a table with rows pointing at nothing.
  const { data: editorial, error: lookupErr } = await sb
    .from('editorials').select('id, slug').eq('slug', slug).maybeSingle()
  if (lookupErr) return NextResponse.json({ error: 'Could not accept that right now' }, { status: 503 })
  if (!editorial) return NextResponse.json({ error: 'No such editorial' }, { status: 404 })

  const since = new Date(Date.now() - REPEAT_WINDOW_MINUTES * 60_000).toISOString()
  const { count } = await sb
    .from('editorial_corrections')
    .select('id', { count: 'exact', head: true })
    .eq('editorial_slug', slug).eq('email', email).gte('created_at', since)
  if ((count ?? 0) > 0) {
    // Not an error from the sender's point of view: their first one arrived.
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const { error } = await sb.from('editorial_corrections').insert({
    editorial_id: editorial.id,
    editorial_slug: slug,
    email,
    message,
    status: 'open',
  })
  if (error) return NextResponse.json({ error: 'Could not save that — please email us instead' }, { status: 500 })

  try {
    const { sendEmail } = await import('@/lib/email')
    await sendEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL ?? 'listmyai@gmail.com',
      subject: `Correction sent for /editorial/${slug}`,
      html: `<p><strong>${email}</strong> says:</p><blockquote>${
        message.replace(/[<>]/g, c => (c === '<' ? '&lt;' : '&gt;'))
      }</blockquote><p><a href="https://listmyai.com/admin/editorials">Open the queue</a></p>`,
    })
  } catch { /* it is stored; the alert is a convenience */ }

  return NextResponse.json({ ok: true })
}
