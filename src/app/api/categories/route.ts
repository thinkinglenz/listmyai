import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Category id -> name, for callers that cannot rely on an embedded
// `categories(...)` relation resolving.
//
// Why this exists: every public page reads categories server-side and resolves
// them fine. The owner dashboard is the one place that reads them through a
// logged-in browser client, and there the embedded relation did not resolve —
// so the dashboard showed every listing as "Other". The exact reason was not
// confirmed against the database; a read permission that names `anon` but not
// `authenticated` would produce it. Serving the names here with the service
// role removes the dependency rather than guessing at the cause.
//
// Categories are public reference data: they are already printed on every
// listing page, in llms.txt and in tools.json. Nothing is exposed by serving
// the id/name pairs.

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  // 503, not an empty 200. An empty list would let the caller render a
  // confident "no category" for a database that simply failed to answer.
  if (error) {
    console.error('[api/categories] read failed:', error.message)
    return NextResponse.json({ error: 'Categories unavailable' }, { status: 503 })
  }

  return NextResponse.json({ categories: data ?? [] })
}
