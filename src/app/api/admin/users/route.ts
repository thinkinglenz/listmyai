import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authUsers = authData?.users ?? []

    let profiles: Record<string, Record<string, unknown>> = {}
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

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
        email_verified: !!u.email_confirmed_at,
        banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
      }
    })

    return NextResponse.json({ users })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, role, action } = await req.json()

  if (action === 'ban') {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: '87600h', // ~10 years = effectively permanent
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'unban') {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: 'none',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Default: update role in profiles table
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
