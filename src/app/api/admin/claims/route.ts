import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function rejectionEmail(name: string, toolName: string, reason: string): string {
  return `
    <div style="font-family:Inter,-apple-system,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:520px;margin:0 auto">
      <h2 style="color:#fff;margin:0 0 16px">About your claim for ${toolName}</h2>
      <p style="color:#94a3b8;margin:0 0 20px;font-size:14px;line-height:1.6">
        Hi ${name}, thanks for your interest in managing the ${toolName} listing on ListmyAI.
        We were not able to approve this claim.
      </p>
      <div style="background:#161b27;border:1px solid #1e2a3a;border-left:3px solid #e94560;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="color:#e2e8f0;margin:0;font-size:14px;line-height:1.6">${reason}</p>
      </div>
      <p style="color:#94a3b8;margin:0 0 20px;font-size:14px;line-height:1.6">
        If you can meet the above, reply to this email or submit a new claim and we will take another look.
      </p>
      <a href="https://listmyai.com/dashboard"
         style="display:inline-block;background:#e94560;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        View your dashboard
      </a>
      <p style="color:#475569;font-size:12px;margin:24px 0 0">ListmyAI — the directory for AI tools</p>
    </div>
  `
}

export async function GET(req: NextRequest) {
  // Claim rows carry claimant names and email addresses.
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('claim_requests')
    .select('*, ai_tools(id, name, slug, website, tagline, description, category_id, pricing_model, has_free_trial, logo_url, categories(name))')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (error.message.includes('Could not find') || error.message.includes('does not exist')) {
      return NextResponse.json({ claims: [], table_missing: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ claims: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const { id, status, reason } = await req.json()
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : ''
  if (status === 'rejected' && !trimmedReason) {
    return NextResponse.json(
      { error: 'A reason is required when rejecting a claim' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('claim_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'rejected' && { rejection_reason: trimmedReason }),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'rejected') {
    // Tell the claimant why. The reason is also on their dashboard, so a
    // failed send leaves them informed rather than in the dark.
    const { data: claim } = await supabase
      .from('claim_requests')
      .select('claimant_email, claimant_name, ai_tools(name)')
      .eq('id', id)
      .single()

    let emailed = false
    if (claim?.claimant_email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolRel = (claim as any).ai_tools
      const toolName = (Array.isArray(toolRel) ? toolRel[0]?.name : toolRel?.name) ?? 'this listing'
      try {
        await sendEmail({
          to: claim.claimant_email,
          subject: `Your claim for ${toolName} on ListmyAI`,
          html: rejectionEmail(claim.claimant_name || 'there', toolName, trimmedReason),
        })
        emailed = true
      } catch (err) {
        console.error('[claims] rejection email failed:', err)
      }
    }

    return NextResponse.json({ success: true, emailed })
  }

  // If approving, mark the tool as claimed and link to the user
  const { data: claim } = await supabase
    .from('claim_requests')
    .select('tool_id, claimant_user_id, claimant_email')
    .eq('id', id)
    .single()

  if (!claim?.tool_id) {
    return NextResponse.json({ success: true, warning: 'Claim status updated but tool_id not found' })
  }

  // Try full update first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    claimed: true,
    status: 'claimed',
    updated_at: new Date().toISOString(),
  }
  if (claim.claimant_user_id) {
    updateData.claimed_by = claim.claimant_user_id
  }

  const { error: updateErr } = await supabase
    .from('ai_tools')
    .update(updateData)
    .eq('id', claim.tool_id)

  let toolUpdated = !updateErr
  let updateWarning = updateErr?.message

  if (updateErr) {
    // Try without 'claimed' and 'claimed_by' columns
    const { error: retryErr } = await supabase
      .from('ai_tools')
      .update({ status: 'claimed', updated_at: new Date().toISOString() })
      .eq('id', claim.tool_id)

    toolUpdated = !retryErr
    if (retryErr) {
      updateWarning = `Full: ${updateErr.message} | Minimal: ${retryErr.message}`
    }
  }

  // Send welcome email (fire-and-forget)
  if (claim.claimant_email) {
    const { data: tool } = await supabase
      .from('ai_tools')
      .select('name')
      .eq('id', claim.tool_id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl && tool) {
      fetch(`${appUrl}/api/email/claim-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.IMPORT_SECRET}` },
        body: JSON.stringify({ email: claim.claimant_email, tool_name: tool.name }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({
    success: true,
    tool_updated: toolUpdated,
    ...(updateWarning && { update_error: updateWarning }),
  })
}
