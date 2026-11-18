// Message the person who claimed a listing.
//
// There was no way to do this at all. When a claimed tool's site goes dark,
// or a listing needs a correction, the only record of the owner was an email
// address rendered as text in the admin table — so the job meant copying it
// out and leaving the product.
//
// The recipient is resolved HERE from the tool id. The browser never names
// the address: an admin endpoint that sends to a client-supplied email is an
// open relay wearing a login, and a compromised admin session would turn the
// site's own sending domain into a spam cannon.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { sendEmail, ownerContactEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_SUBJECT = 150
const MAX_MESSAGE = 4_000

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  let body: { toolId?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const toolId = String(body.toolId ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const message = String(body.message ?? '').trim()

  if (!toolId) return NextResponse.json({ error: 'Which listing?' }, { status: 400 })
  if (!subject) return NextResponse.json({ error: 'A subject is required.' }, { status: 400 })
  if (!message) return NextResponse.json({ error: 'The message is empty.' }, { status: 400 })
  if (subject.length > MAX_SUBJECT) return NextResponse.json({ error: 'That subject is too long.' }, { status: 400 })
  if (message.length > MAX_MESSAGE) return NextResponse.json({ error: 'That message is too long.' }, { status: 400 })

  const { data: tool, error } = await supabase
    .from('ai_tools')
    .select('id, name, slug, website, claimed, claimed_by')
    .eq('id', toolId)
    .single()

  if (error || !tool) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 })
  if (!tool.claimed || !tool.claimed_by) {
    // Nothing to send to, and saying so is more useful than a silent success.
    return NextResponse.json({ error: 'Nobody has claimed this listing, so there is no owner to write to.' }, { status: 409 })
  }

  let to: string | null = null
  try {
    const { data: user } = await supabase.auth.admin.getUserById(tool.claimed_by)
    to = user?.user?.email ?? null
  } catch { /* handled below */ }

  if (!to) {
    return NextResponse.json(
      { error: 'The claiming account no longer has an email address on it.' },
      { status: 409 },
    )
  }

  // Replies must reach a person. The send address is noreply@, so without
  // this the owner's answer goes nowhere and the exchange dies silently.
  const replyTo = process.env.ENQUIRY_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || ''

  try {
    await sendEmail({
      to,
      subject,
      html: ownerContactEmail({
        toolName: tool.name,
        slug: tool.slug,
        website: tool.website,
        message,
        replyTo,
      }),
      ...(replyTo && { headers: { 'Reply-To': replyTo } }),
    })
  } catch (err) {
    console.error('[contact-owner] send failed', err)
    return NextResponse.json({ error: 'The message could not be sent. Please try again.' }, { status: 502 })
  }

  // The address is returned so the admin sees exactly where it went, rather
  // than trusting a green tick.
  return NextResponse.json({ sent: true, to, replyTo: replyTo || null })
}
