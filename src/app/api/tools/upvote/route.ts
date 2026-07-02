import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notifyToolOwner } from '@/lib/notify'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateUpvoteCount(supabase: any, toolId: string, delta: number) {
  const { data } = await supabase.from('ai_tools').select('upvotes').eq('id', toolId).single()
  if (data) {
    const newCount = Math.max(0, ((data as any).upvotes || 0) + delta)
    await supabase.from('ai_tools').update({ upvotes: newCount }).eq('id', toolId)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { toolId } = await req.json()
    if (!toolId) return NextResponse.json({ error: 'toolId required' }, { status: 400 })

    // Get the authenticated user from cookies
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch { /* ignore in RSC */ }
            })
          },
        },
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Use service role for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user already upvoted this tool.
    // NOTE: the upvotes table has a composite PK (user_id, tool_id) — no id column.
    const { data: existing, error: checkErr } = await supabase
      .from('upvotes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('tool_id', toolId)
      .maybeSingle()

    // If upvotes table itself doesn't exist, just toggle the counter directly
    if (checkErr && (checkErr.message.includes('Could not find the table') || checkErr.code === 'PGRST205' || checkErr.code === '42P01')) {
      await updateUpvoteCount(supabase, toolId, 1)
      return NextResponse.json({ upvoted: true })
    }

    if (existing) {
      // Remove upvote (toggle off)
      await supabase.from('upvotes').delete().eq('user_id', user.id).eq('tool_id', toolId)
      await updateUpvoteCount(supabase, toolId, -1)
      return NextResponse.json({ upvoted: false })
    } else {
      // Add upvote
      const { error: insertErr } = await supabase.from('upvotes').insert({ user_id: user.id, tool_id: toolId })
      if (insertErr) {
        // If upvotes table doesn't exist, just increment the counter
        if (insertErr.message.includes('Could not find the table') || insertErr.code === 'PGRST205' || insertErr.code === '42P01') {
          await updateUpvoteCount(supabase, toolId, 1)
          return NextResponse.json({ upvoted: true })
        }
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
      await updateUpvoteCount(supabase, toolId, 1)
      // Notify the listing owner (non-blocking)
      notifyToolOwner({ id: toolId }, { type: 'upvote' }).catch(() => {})
      return NextResponse.json({ upvoted: true })
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
