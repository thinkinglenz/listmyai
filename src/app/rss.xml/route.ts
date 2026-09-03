// RSS feed for the blog.
//
// Exists so automation tools can consume the blog without a bespoke
// integration — dlvr.it polls this to auto-post new articles to Facebook, X
// and LinkedIn, and the same feed serves newsletter tools and readers.

import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://listmyai.com'
const FEED_LIMIT = 30

// Re-generated hourly; the blog publishes once a day, so anything tighter
// would just add load without surfacing posts sooner.
export const revalidate = 3600

/** XML has no HTML entities beyond these five, and an unescaped & or < in a
 *  title produces a feed that strict parsers reject outright. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, hero_image_url, hero_image_alt, published_at, updated_at, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(FEED_LIMIT)

  const items = (posts ?? []).map(post => {
    const link = `${BASE_URL}/blog/${post.slug}`
    const published = new Date(post.published_at ?? post.updated_at ?? Date.now()).toUTCString()

    // Hero images are stored as relative paths; a feed reader has no page
    // context to resolve those against, so they must be absolute here.
    const image = post.hero_image_url?.startsWith('http')
      ? post.hero_image_url
      : `${BASE_URL}${post.hero_image_url ?? ''}`

    const categories = (post.tags ?? [])
      .map((tag: string) => `<category>${escapeXml(tag)}</category>`)
      .join('')

    return `    <item>
      <title>${escapeXml(post.title ?? '')}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(post.excerpt ?? '')}</description>
      <pubDate>${published}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      ${categories}
      ${post.hero_image_url ? `<enclosure url="${escapeXml(image)}" type="image/png" length="0" />` : ''}
      ${post.hero_image_url ? `<media:content url="${escapeXml(image)}" medium="image" />` : ''}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>ListmyAI Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Daily coverage of AI tools, news and comparisons from ListmyAI.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
