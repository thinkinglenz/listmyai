// Anonymous interaction counts (currently: the theme switch). Only a small
// allow-list of events and values is stored, so the endpoint cannot be used
// to write arbitrary data.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED: Record<string, string[]> = {
  theme_toggle: ['light', 'dark'],
}

const BOTS = /bot|crawler|spider|crawling|preview|headless|lighthouse/i

export async function POST(req: NextRequest) {
  if (BOTS.test(req.headers.get('user-agent') ?? '')) return NextResponse.json({ ok: true })
  const { event, value, path } = await req.json().catch(() => ({}))
  if (!ALLOWED[event]?.includes(value)) return NextResponse.json({ error: 'Unknown event' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabase.from('site_events').insert({
    event, value, path: typeof path === 'string' ? path.slice(0, 200) : null,
  })
  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}
