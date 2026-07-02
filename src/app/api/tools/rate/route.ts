import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notifyToolOwner } from '@/lib/notify'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { toolId, rating } = await req.json()
    if (!toolId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'toolId and rating (1-5) required' }, { status: 400 })
    }

    // Get the authenticated user
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert rating
    const { error: upsertErr } = await supabase
      .from('ratings')
      .upsert(
        { user_id: user.id, tool_id: toolId, rating },
        { onConflict: 'user_id,tool_id' }
      )

    if (upsertErr) {
      // If ratings table doesn't exist, update the tool's rating directly.
      // Supabase/PostgREST reports a missing table as "Could not find the
      // table ... in the schema cache" (code PGRST205), not "does not exist".
      const missingTable =
        upsertErr.message.includes('does not exist') ||
        upsertErr.message.includes('Could not find the table') ||
        upsertErr.code === '42P01' ||
        upsertErr.code === 'PGRST205'
      if (missingTable) {
        const { data: tool } = await supabase
          .from('ai_tools')
          .select('rating_avg, rating_count')
          .eq('id', toolId)
          .single()

        if (tool) {
          const oldTotal = (tool.rating_avg || 0) * (tool.rating_count || 0)
          const newCount = (tool.rating_count || 0) + 1
          const newAvg = (oldTotal + rating) / newCount
          await supabase
            .from('ai_tools')
            .update({ rating_avg: Math.round(newAvg * 10) / 10, rating_count: newCount })
            .eq('id', toolId)
        }

        return NextResponse.json({ saved: true, rating })
      }
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    // Recalculate the tool's average rating
    const { data: ratings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('tool_id', toolId)

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      await supabase
        .from('ai_tools')
        .update({ rating_avg: Math.round(avg * 10) / 10, rating_count: ratings.length })
        .eq('id', toolId)
    }

    // Notify the listing owner (non-blocking)
    notifyToolOwner({ id: toolId }, { type: 'rating', rating }).catch(() => {})

    return NextResponse.json({ saved: true, rating })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
