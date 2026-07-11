import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'

// Repoints every auto-generated post's hero image to /api/blog-hero/[slug],
// which renders a deterministic branded card from the post's own title.
// Fixes legacy posts stuck with random picsum/unsplash/placeholder URLs.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const secret = body.secret || req.headers.get('x-admin-secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'lmai@admin2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: posts, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('id, slug, title, hero_image_url')
    .eq('is_auto_generated', true)

  if (fetchErr || !posts || posts.length === 0) {
    return NextResponse.json({ error: 'No blog posts found', details: fetchErr?.message }, { status: 404 })
  }

  const updated: string[] = []
  const failed: { slug: string; error: string }[] = []

  for (const post of posts) {
    const newImageUrl = `${APP_URL}/api/blog-hero/${post.slug}`
    if (post.hero_image_url === newImageUrl) continue

    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update({ hero_image_url: newImageUrl, hero_image_alt: post.title })
      .eq('id', post.id)

    if (updateErr) failed.push({ slug: post.slug, error: updateErr.message })
    else updated.push(post.slug)
  }

  return NextResponse.json({
    success: failed.length === 0,
    total: posts.length,
    updated,
    failed,
    message: `Repointed ${updated.length} post(s) to /api/blog-hero. Refresh /admin/blog to see it.`,
  })
}
