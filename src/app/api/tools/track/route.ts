import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    // Early-stage boost: views count double until a listing reaches 100
    const increment = event === 'view' && current < 100 ? 2 : 1
    await supabase
      .from('ai_tools')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ [column]: current + increment } as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('id', (row as any).id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
