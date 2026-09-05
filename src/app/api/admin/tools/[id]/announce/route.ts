// Announces an approved tool on social. Called by the admin listings page
// straight after an approval succeeds.
//
// Kept separate from the approval itself so that a social outage can never
// block or reverse an approval, and so bulk approvals can deliberately skip it.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { announceToolToSocial } from '@/lib/social/post'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const { id } = await params

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('id, name, slug, tagline, description, status, announced_at, categories(name)')
    .eq('id', id)
    .maybeSingle()

  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

  // Only live listings get announced — a pending or rejected tool would send
  // followers to a page they cannot see.
  if (tool.status !== 'active') {
    return NextResponse.json({ error: `Tool is ${tool.status}, not active` }, { status: 400 })
  }

  // Re-approving an already-announced tool must not post it a second time.
  if (tool.announced_at) {
    return NextResponse.json({ skipped: true, reason: 'Already announced', announced_at: tool.announced_at })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRel = (tool as any).categories
  const result = await announceToolToSocial({
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline || tool.description || '',
    category: (Array.isArray(catRel) ? catRel[0]?.name : catRel?.name) ?? undefined,
  })

  // Stamp only when something actually posted, so a misconfigured token leaves
  // the tool eligible to be announced again once it is fixed.
  if (result.facebook.ok || result.instagram.ok) {
    await supabase
      .from('ai_tools')
      .update({ announced_at: new Date().toISOString() })
      .eq('id', id)
  }

  return NextResponse.json(result)
}
