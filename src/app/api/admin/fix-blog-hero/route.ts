import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'lmai@admin2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the latest auto-generated blog post
  const { data: latest, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('id, slug, title, hero_image_url')
    .eq('is_auto_generated', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchErr || !latest) {
    return NextResponse.json({ error: 'No blog posts found', details: fetchErr?.message }, { status: 404 })
  }

  // Generate a deterministic image URL based on slug
  let hash = 0
  for (let i = 0; i < latest.slug.length; i++) {
    hash = (hash * 31 + latest.slug.charCodeAt(i)) >>> 0
  }
  const newImageUrl = `https://picsum.photos/1200/630?random=${hash}`

  // Update the hero image
  const { error: updateErr } = await supabase
    .from('blog_posts')
    .update({ hero_image_url: newImageUrl })
    .eq('id', latest.id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    post: latest.title,
    slug: latest.slug,
    newImageUrl,
    message: 'Hero image updated. Refresh /admin/blog to see it.',
  })
}
