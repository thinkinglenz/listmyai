import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Only these may be set from the admin editor. Without an allowlist a crafted
// request could write any column on the row, including ownership and counters.
const EDITABLE = new Set([
  'name', 'tagline', 'description', 'website',
  'logo_url', 'cover_url', 'category_id',
  'status', 'pricing_model',
])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const { id } = await params
  const raw = await req.json()
  const body = Object.fromEntries(
    Object.entries(raw).filter(([k]) => EDITABLE.has(k))
  )
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ai_tools')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
