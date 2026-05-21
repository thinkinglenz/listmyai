import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, claimWelcomeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://listmyai.com'

  if (!token) {
    return NextResponse.redirect(`${appUrl}/dashboard?claim=invalid`)
  }

  const admin = supabaseAdmin()

  // ── Find the claim request by token ────────────────────────────────────
  const { data: claim, error } = await admin
    .from('claim_requests')
    .select('id, tool_id, claimant_email, claimant_name, claimant_user_id, status, token_expires_at')
    .eq('verification_token', token)
    .single()

  if (error || !claim) {
    return NextResponse.redirect(`${appUrl}/dashboard?claim=invalid`)
  }

  // ── Already processed? ─────────────────────────────────────────────────
  if (claim.status === 'approved') {
    return NextResponse.redirect(`${appUrl}/dashboard?claim=already`)
  }

  if (claim.status === 'rejected') {
    return NextResponse.redirect(`${appUrl}/dashboard?claim=rejected`)
  }

  // ── Check token expiry ─────────────────────────────────────────────────
  if (claim.token_expires_at && new Date(claim.token_expires_at) < new Date()) {
    // Mark as expired
    await admin
      .from('claim_requests')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', claim.id)

    return NextResponse.redirect(`${appUrl}/dashboard?claim=expired`)
  }

  // ── Approve the claim ──────────────────────────────────────────────────
  await admin
    .from('claim_requests')
    .update({
      status: 'approved',
      verification_token: null, // clear token after use
      updated_at: new Date().toISOString(),
    })
    .eq('id', claim.id)

  // ── Mark tool as claimed ───────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolUpdate: Record<string, any> = {
    claimed: true,
    status: 'claimed',
    updated_at: new Date().toISOString(),
  }
  if (claim.claimant_user_id) {
    toolUpdate.claimed_by = claim.claimant_user_id
  }

  await admin
    .from('ai_tools')
    .update(toolUpdate)
    .eq('id', claim.tool_id)

  // ── Get tool name for email ────────────────────────────────────────────
  const { data: tool } = await admin
    .from('ai_tools')
    .select('name')
    .eq('id', claim.tool_id)
    .single()

  // ── Send welcome email ─────────────────────────────────────────────────
  if (claim.claimant_email && tool?.name) {
    try {
      await sendEmail({
        to: claim.claimant_email,
        subject: `You've claimed "${tool.name}" on ListmyAI`,
        html: claimWelcomeEmail(tool.name, appUrl),
      })
    } catch (err) {
      console.error('[claim/verify] Failed to send welcome email:', err)
    }
  }

  // ── Redirect to dashboard with success ─────────────────────────────────
  return NextResponse.redirect(`${appUrl}/dashboard?claim=success&tool=${encodeURIComponent(tool?.name || '')}`)
}
