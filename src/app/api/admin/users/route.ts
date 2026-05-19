import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get profiles (joined with auth user data via service role)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, plan, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get auth users for email (service role only)
    const { data: authData } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authData?.users?.forEach(u => { emailMap[u.id] = u.email ?? '' })

    const users = (profiles ?? []).map(p => ({
      id: p.id,
      name: p.full_name ?? 'Unknown',
      email: emailMap[p.id] ?? '—',
      role: p.role ?? 'user',
      plan: p.plan ?? 'free',
      joined: p.created_at,
    }))

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
