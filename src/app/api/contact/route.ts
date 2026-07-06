import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sender_name, sender_email, message, package_type, auto_register } = body

    if (!sender_name || !sender_email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const ssrClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch { /* ignore in RSC */ }
            })
          },
        },
      }
    )

    const { data: { user } } = await ssrClient.auth.getUser()
    let userId: string | null = user?.id ?? null
    let autoRegistered = false

    if (!userId && auto_register) {
      try {
        const { data: signUpData, error: signUpErr } = await supabase.auth.admin.createUser({
          email: sender_email,
          user_metadata: { full_name: sender_name },
          
        })

        if (signUpErr) {
          if (signUpErr.message.includes('already exists')) {
            autoRegistered = false
          } else {
            throw signUpErr
          }
        } else {
          userId = signUpData?.user?.id ?? null
          autoRegistered = true
        }
      } catch (err) {
        console.error('[contact] Auto-register failed:', err)
      }
    }

    const { error: insertErr } = await supabase.from('contact_messages').insert({
      user_id: userId,
      sender_email,
      sender_name,
      package_type,
      message,
      status: 'new',
    })

    if (insertErr) {
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    try {
      const subject = package_type
        ? `New contact: ${package_type} inquiry from ${sender_name}`
        : `New contact message from ${sender_name}`

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e94560; margin-bottom: 16px;">New Contact Message</h2>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p><strong>From:</strong> ${sender_name}</p>
            <p><strong>Email:</strong> <a href="mailto:${sender_email}">${sender_email}</a></p>
            ${package_type ? `<p><strong>Package:</strong> ${package_type}</p>` : ''}
          </div>
          <div style="background: #ffffff; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px;">
            <p style="white-space: pre-wrap; color: #374151;">${message}</p>
          </div>
          ${autoRegistered ? `<p style="color: #059669; font-size: 14px;">✓ New account auto-registered.</p>` : ''}
        </div>
      `

      await sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || 'listmyai@gmail.com',
        subject,
        html: emailHtml,
      })
    } catch (err) {
      console.error('[contact] Email failed:', err)
    }

    return NextResponse.json({
      ok: true,
      auto_registered: autoRegistered,
    })
  } catch (err) {
    console.error('[contact] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
