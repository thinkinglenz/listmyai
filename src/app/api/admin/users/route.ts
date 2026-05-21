import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get profiles (joined with auth user data via service role)
    // Get auth users first (service role only) — this is the source of truth
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authUsers = authData?.users ?? []

    // Try profiles table — fall back gracefully if columns don't exist
    let profiles: Record<string, Record<string, unknown>> = {}
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (profileData) {
      for (const p of profileData) {
        profiles[(p as Record<string, unknown>).id as string] = p as Record<string, unknown>
      }
    }

    const users = authUsers.map(u => {
      const p = profiles[u.id] || {}
      return {
        id: u.id,
        name: (p.display_name || p.full_name || u.user_metadata?.full_name || u.user_metadata?.name || 'Unknown') as string,
        email: u.email ?? '—',
        role: (p.role ?? 'user') as string,
        plan: (p.plan ?? 'free') as string,
        joined: u.created_at,
      }
    })

    return NextResponse.json({ users })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, role } = await req.json()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
