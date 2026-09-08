// Is this website already listed?
//
// Called from step 1 of the submit form. The same check runs again on submit —
// this one only exists so someone is told before filling in eight more fields,
// not after.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('website') ?? ''
  if (!raw.trim()) return NextResponse.json({ exists: false })

  // Someone typing "example.com" means the same site as
  // "https://www.example.com/" — compare on host so near-misses still match.
  let host: string
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    host = url.hostname.replace(/^www\./, '')
  } catch {
    return NextResponse.json({ exists: false })
  }

  if (host.length < 4) return NextResponse.json({ exists: false })

  const { data } = await supabase
    .from('ai_tools')
    .select('name, slug, status')
    .ilike('website', `%${host}%`)
    .limit(1)
    .maybeSingle()

  if (!data) return NextResponse.json({ exists: false })

  return NextResponse.json({
    exists: true,
    name: data.name,
    slug: data.slug,
    // A pending listing is not yet visible, so "find it in the directory"
    // would send them somewhere it does not appear.
    claimable: data.status === 'active',
  })
}
