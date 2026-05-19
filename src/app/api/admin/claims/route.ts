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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  // If approving, mark the tool as claimed
  if (status === 'approved') {
    const { data: claim } = await supabase
      .from('claim_requests')
      .select('tool_id')
      .eq('id', id)
      .single()

    if (claim?.tool_id) {
      await supabase
        .from('ai_tools')
        .update({ claimed: true, status: 'active' })
        .eq('id', claim.tool_id)
    }
  }

  return NextResponse.json({ success: true })
}
