// What promotion has actually happened for the signed-in owner's listings.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
          c.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch {}
          })
        },
      },
    }
  )

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: tools } = await admin
    .from('ai_tools')
    .select('id, name, slug, social_promotion_consent, announced_at')
    .or(`claimed_by.eq.${user.id},submitted_by.eq.${user.id}`)
    .limit(50)

  const ids = (tools ?? []).map(t => t.id)
  if (ids.length === 0) return NextResponse.json({ tools: [], posts: [] })

  const { data: posts } = await admin
    .from('tool_social_posts')
    .select('id, tool_id, network, post_url, posted_at')
    .in('tool_id', ids)
    .order('posted_at', { ascending: false })
    .limit(100)

  return NextResponse.json({
    tools: (tools ?? []).map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      consented: Boolean(t.social_promotion_consent),
      announcedAt: t.announced_at ?? null,
    })),
    posts: posts ?? [],
  })
}
