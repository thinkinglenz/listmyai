import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyToolOwner } from '@/lib/notify'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOT_UA = /bot|crawler|spider|crawling|preview|scan|fetch|monitor|lighthouse|headless/i

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    if (BOT_UA.test(ua)) return NextResponse.json({ ok: true })

    const { slug, event } = await req.json()
    if (!slug || typeof slug !== 'string' || !['view', 'click'].includes(event)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const column = event === 'view' ? 'view_count' : 'click_count'

    const { data: row } = await supabase
      .from('ai_tools')
      .select(`id, ${column}`)
      .eq('slug', slug)
      .maybeSingle()

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (row as any)[column] ?? 0
    // One view is one view. This used to add 2 below 100 as an "early-stage
    // boost", which overstated the number shown publicly on the listing and to
    // the owner in their dashboard, and fed a milestone email that had not been
    // reached. Counts under a few hundred may still carry that historical
    // inflation; it cannot be reversed, since nothing recorded which views were
    // doubled.
    const next = current + 1
    await supabase
      .from('ai_tools')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ [column]: next } as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (row as any).id)

    // Views milestone: email the owner each time the count crosses a 100 mark
    if (event === 'view' && Math.floor(next / 100) > Math.floor(current / 100)) {
      const milestone = Math.floor(next / 100) * 100
      notifyToolOwner({ slug }, { type: 'views', count: milestone }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
