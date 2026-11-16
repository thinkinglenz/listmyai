import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { notifyOwnerOfEdit } from '@/lib/notify-owner'
import { revalidatePath } from 'next/cache'

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

  // The listing page is cached for a day. Without this an admin edit — above
  // all approving a listing by setting status to active — would not reach the
  // public page until the cache expired, leaving an approved listing serving
  // its stale noindex copy for up to 24 hours.
  const slug = (data as Record<string, unknown>)?.slug
  if (typeof slug === 'string' && slug) {
    try {
      revalidatePath(`/tools/${slug}`)
      revalidatePath('/directory')
    } catch (err) {
      // A cache miss must not turn a saved edit into a failed request.
      console.warn('[admin/tools] revalidate failed:', err)
    }
  }

  // Best-effort: the owner should know, but a failed notification must not make
  // a successful edit look like it failed.
  const notified = await notifyOwnerOfEdit(id, Object.keys(body)).catch(() => null)

  return NextResponse.json({ ...data, _owner_notified: notified?.ok ?? false })
}

/** The whole listing, for the admin's full edit page. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }
  const { id } = await params
  const { data, error } = await supabase
    .from('ai_tools')
    .select('*, categories(id, name)')
    .eq('id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  return NextResponse.json({ tool: data })
}
