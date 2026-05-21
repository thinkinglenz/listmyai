import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('claim_requests')
    .select('*, ai_tools(name, slug, website)')
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
  const { id, status } = await req.json()
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('claim_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If approving, mark the tool as claimed and link to the user
  if (status === 'approved') {
    const { data: claim } = await supabase
      .from('claim_requests')
      .select('tool_id, claimant_user_id, claimant_email')
      .eq('id', id)
      .single()

    if (claim?.tool_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        claimed: true,
        status: 'claimed',
        updated_at: new Date().toISOString(),
      }
      if (claim.claimant_user_id) {
        updateData.claimed_by = claim.claimant_user_id
      }

      await supabase
        .from('ai_tools')
        .update(updateData)
        .eq('id', claim.tool_id)

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
    }
  }

  return NextResponse.json({ success: true })
}
