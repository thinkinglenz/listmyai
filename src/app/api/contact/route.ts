import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; message?: string; tool_name?: string; tool_slug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, message, tool_name, tool_slug } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 422 })
  if (!email?.trim() || !email.includes('@')) return NextResponse.json({ error: 'Valid email is required' }, { status: 422 })
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 422 })
  if (message.trim().length < 10) return NextResponse.json({ error: 'Message is too short' }, { status: 422 })

  const admin = supabaseAdmin()

  // Try to save to contact_messages table
  const { error: insertErr } = await admin.from('contact_messages').insert({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    tool_name: tool_name || null,
    tool_slug: tool_slug || null,
  })

  if (insertErr) {
    console.error('[contact] Insert failed:', insertErr.message)
    // Still send email even if DB insert fails
  }

  // Send notification email to admin
  try {
    const toolContext = tool_name ? `<p style="color:#94a3b8;font-size:13px;">From listing: <strong>${tool_name}</strong> (/tools/${tool_slug})</p>` : ''

    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@listmyai.com',
      subject: `New Contact: ${name.trim()}${tool_name ? ` — re: ${tool_name}` : ''}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1117;color:#e2e8f0;border-radius:12px;">
          <h2 style="color:#fff;margin:0 0 16px;">New Contact Message</h2>
          ${toolContext}
          <div style="background:#161b27;border:1px solid #1e2a3a;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong style="color:#fff;">Name:</strong> ${name.trim()}</p>
            <p style="margin:0 0 8px;"><strong style="color:#fff;">Email:</strong> <a href="mailto:${email.trim()}" style="color:#e94560;">${email.trim()}</a></p>
            <p style="margin:0;"><strong style="color:#fff;">Message:</strong></p>
            <p style="margin:8px 0 0;white-space:pre-wrap;color:#94a3b8;">${message.trim()}</p>
          </div>
          <p style="color:#475569;font-size:12px;margin:16px 0 0;">Sent from ListmyAI contact form</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[contact] Failed to send notification email:', err)
  }

  return NextResponse.json({ ok: true })
}
