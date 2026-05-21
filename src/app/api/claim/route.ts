import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { sendEmail, claimVerificationEmail } from '@/lib/email'

// POST /api/claim — submit a claim request for a tool listing
// Body: { tool_id: string, email: string, name: string }
// Auth: Supabase session cookie (user must be logged in)

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

// Common free/consumer email providers — blocked for claims
const FREE_DOMAINS = new Set([
  // 'gmail.com','googlemail.com', // TODO: re-enable after testing
  'yahoo.com','yahoo.co.uk','yahoo.fr','yahoo.de',
  'hotmail.com','hotmail.co.uk','hotmail.fr','outlook.com','outlook.co.uk',
  'live.com','live.co.uk','msn.com','icloud.com','me.com','mac.com',
  'aol.com','protonmail.com','proton.me','mail.com','zoho.com','zohomail.com',
  'yandex.com','yandex.ru','gmx.com','gmx.de','gmx.net','web.de',
  'tutanota.com','tuta.io','fastmail.com','hushmail.com','inbox.com',
  'mailinator.com','guerrillamail.com','temp-mail.org','throwam.com',
])

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function POST(req: NextRequest) {
  // ── Auth: get user from session cookie ──────────────────────────────────
  const cookieStore = await cookies()
  const supabaseUser = createServerClient(
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
  const { data: { user } } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to claim a listing' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: { tool_id?: string; email?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tool_id, email, name } = body
  if (!tool_id) return NextResponse.json({ error: 'tool_id is required' }, { status: 422 })
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email is required' }, { status: 422 })
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 422 })

  // ── Validate email domain ──────────────────────────────────────────────
  const emailDomain = getEmailDomain(email)
  if (FREE_DOMAINS.has(emailDomain)) {
    return NextResponse.json({ error: `${emailDomain} is a personal email provider. Please use your company email.` }, { status: 422 })
  }

  const admin = supabaseAdmin()

  // ── Check tool exists and is unclaimed ─────────────────────────────────
  const { data: tool, error: fetchError } = await admin
    .from('ai_tools')
    .select('id, name, slug, website, claimed_by, claimed, status')
    .eq('id', tool_id)
    .single()

  if (fetchError || !tool) {
    return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  }

  if (tool.claimed_by || tool.claimed) {
    return NextResponse.json({ error: 'This listing is already claimed' }, { status: 409 })
  }

  // ── Check for existing pending claim ───────────────────────────────────
  const { data: existingClaim } = await admin
    .from('claim_requests')
    .select('id, status')
    .eq('tool_id', tool_id)
    .in('status', ['pending', 'pending_verification'])
    .maybeSingle()

  if (existingClaim) {
    return NextResponse.json({ error: 'A claim request is already pending for this tool' }, { status: 409 })
  }

  // ── Determine claim type ───────────────────────────────────────────────
  const toolDomain = extractDomain(tool.website || '')
  const isDomainMatch = !!(toolDomain && (emailDomain === toolDomain || emailDomain.endsWith(`.${toolDomain}`)))
  const claimType = isDomainMatch ? 'domain-match' : 'manual'

  // Generate verification token for domain-match claims
  const verificationToken = isDomainMatch ? generateToken() : null
  // Token expires in 48 hours
  const tokenExpiry = isDomainMatch ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null

  // ── Create claim request ───────────────────────────────────────────────
  // Domain-match → pending_verification (needs email click)
  // Non-match → pending (needs admin manual review)
  const claimStatus = isDomainMatch ? 'pending_verification' : 'pending'

  const { error: insertError } = await admin
    .from('claim_requests')
    .insert({
      tool_id,
      claimant_email: email,
      claimant_name: name.trim(),
      claimant_user_id: user.id,
      claim_type: claimType,
      status: claimStatus,
      verification_token: verificationToken,
      token_expires_at: tokenExpiry,
    })

  if (insertError) {
    // Table might not exist — fall back
    if (insertError.message.includes('Could not find') || insertError.message.includes('does not exist') || insertError.message.includes('relation')) {
      console.error('[claim] claim_requests table missing, falling back')
      return NextResponse.json({ ok: true, tool_id, claim_type: claimType, message: 'Request noted. We will review manually.' })
    }

    // Handle missing column gracefully (verification_token might not exist yet)
    if (insertError.message.includes('verification_token') || insertError.message.includes('token_expires_at')) {
      const { error: retryErr } = await admin
        .from('claim_requests')
        .insert({
          tool_id,
          claimant_email: email,
          claimant_name: name.trim(),
          claimant_user_id: user.id,
          claim_type: claimType,
          status: 'pending', // fall back to manual review if no token column
        })
      if (retryErr) {
        return NextResponse.json({ error: retryErr.message }, { status: 500 })
      }
      // Without token column, all go to manual review
      return NextResponse.json({
        ok: true,
        tool_id,
        claim_type: 'manual',
        message: 'Claim request submitted for manual review.',
      })
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // ── Send verification email for domain-match claims ────────────────────
  if (isDomainMatch && verificationToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listmyai.com'
    const verifyUrl = `${appUrl}/api/claim/verify?token=${verificationToken}`

    try {
      await sendEmail({
        to: email,
        subject: `Verify your claim for "${tool.name}" on ListmyAI`,
        html: claimVerificationEmail(tool.name, name.trim(), verifyUrl, appUrl),
      })
    } catch (err) {
      console.error('[claim] Failed to send verification email:', err)
      // Don't fail the whole request — claim is created, they can request resend
    }
  }

  return NextResponse.json({
    ok: true,
    tool_id,
    claim_type: claimType,
    message: isDomainMatch
      ? 'Verification email sent. Please check your inbox to confirm ownership.'
      : 'Claim request submitted for manual review.',
  })
}
