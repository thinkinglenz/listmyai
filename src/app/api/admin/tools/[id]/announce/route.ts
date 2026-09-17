// Announces an approved tool on social. Called by the admin listings page
// straight after an approval succeeds.
//
// Kept separate from the approval itself so that a social outage can never
// block or reverse an approval, and so bulk approvals can deliberately skip it.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { announceToolToSocial, type Network } from '@/lib/social/post'
import { getSocialHook } from '@/lib/social/hook'

// Five networks, two cold image renders and a Threads processing wait.
export const maxDuration = 120

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

  // Only networks without a recorded post are attempted, so re-approving or
  // retrying never posts the same tool twice, but a network that failed last
  // time gets another go.
  const { data: existing } = await supabase
    .from('tool_social_posts').select('network').eq('tool_id', id)
  const done = [...new Set((existing ?? []).map(r => r.network))] as Network[]
  const all: Network[] = ['facebook', 'instagram', 'facebook_story', 'instagram_story',
    ...(process.env.THREADS_ACCESS_TOKEN ? ['threads' as Network] : []),
    ...(process.env.TWITTER_ACCESS_TOKEN ? ['x' as Network] : [])]
  if (all.every(n => done.includes(n))) {
    return NextResponse.json({ skipped: true, reason: 'Already posted everywhere', announced_at: tool.announced_at })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRel = (tool as any).categories
  // Written before posting so the image and caption both carry it. A failure
  // here just means the post goes out with the tagline instead.
  const hook = await getSocialHook(id).catch(() => null)

  const result = await announceToolToSocial({
    hook,
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline || tool.description || '',
    category: (Array.isArray(catRel) ? catRel[0]?.name : catRel?.name) ?? undefined,
  }, { skip: done })

  // Record what was posted where, so the owner can see it in their dashboard.
  if (result.links.length > 0) {
    await supabase.from('tool_social_posts').insert(
      result.links.map(l => ({
        tool_id: id,
        network: l.network,
        post_id: l.postId,
        post_url: l.postUrl,
        source: 'approval',
      }))
    ).then(() => {}, () => {}) // never fail an announcement over bookkeeping
  }

  // Stamp only when something actually posted, so a misconfigured token leaves
  // the tool eligible to be announced again once it is fixed.
  if (result.links.length > 0) {
    await supabase
      .from('ai_tools')
      .update({ announced_at: new Date().toISOString() })
      .eq('id', id)
  }

  return NextResponse.json(result)
}
