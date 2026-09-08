// Generates a branded image for a blog post.
//
// Two variants, because one image cannot serve both jobs. The default is a
// 1200x630 social card with the title set large — right for og:image, wrong as
// a thumbnail, where it was being cropped to 160px tall and repeating the title
// that already sits underneath the card. `?variant=thumb` renders the same
// brand furniture with the title omitted.
// Deterministic: same slug → same title + same accent → identical PNG every time.
// Used as hero_image_url for auto-generated posts (admin, blog page, og:image, PNG download).
import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Brand-compatible accent gradients — picked deterministically per slug
const ACCENTS = [
  { from: '#e94560', to: '#7c2d3e' }, // brand red
  { from: '#10b981', to: '#065f46' }, // emerald
  { from: '#3b82f6', to: '#1e3a8a' }, // blue
  { from: '#8b5cf6', to: '#4c1d95' }, // violet
  { from: '#f59e0b', to: '#92400e' }, // amber
  { from: '#06b6d4', to: '#155e75' }, // cyan
]

function hashOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Fallback title from slug: strip trailing date, hyphens → spaces, title case
function titleFromSlug(slug: string): string {
  return slug
    .replace(/-\d{4}-\d{2}-\d{2}$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const isThumb = new URL(req.url).searchParams.get('variant') === 'thumb'

  let title = titleFromSlug(slug)
  let tag = 'AI Insights'
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('title, tags')
      .eq('slug', slug)
      .maybeSingle()
    if (data?.title) title = data.title
    if (Array.isArray(data?.tags) && data.tags[0]) tag = String(data.tags[0])
  } catch {
    // DB unreachable — render from slug-derived title
  }

  const accent = ACCENTS[hashOf(slug) % ACCENTS.length]
  const titleSize = title.length > 70 ? 46 : title.length > 45 ? 54 : 62

  if (isThumb) {
    // Full-bleed gradient mesh in the post's own accent. No text and no logo:
    // the card already prints the title, tag and date beneath, and every
    // element removed from the social card left a hole rather than a design.
    const W = 1200, H = 630
    const thumbPng = await new ImageResponse(
      (
        <div style={{
          width: W, height: H, display: 'flex',
          background: `linear-gradient(135deg, #0d1117 0%, #131c2e 50%, #0d1117 100%)`,
        }}>
          <div style={{
            position: 'absolute', top: -180, left: -120, width: 760, height: 760, display: 'flex',
            background: `radial-gradient(circle at 50% 50%, ${accent.from}66 0%, ${accent.from}22 42%, ${accent.from}00 70%)`,
          }} />
          <div style={{
            position: 'absolute', bottom: -260, right: -140, width: 820, height: 820, display: 'flex',
            background: `radial-gradient(circle at 50% 50%, ${accent.to}77 0%, ${accent.to}26 45%, ${accent.to}00 72%)`,
          }} />
          <div style={{
            position: 'absolute', top: 120, right: 200, width: 420, height: 420, display: 'flex',
            background: `radial-gradient(circle at 50% 50%, ${accent.from}3a 0%, ${accent.from}00 65%)`,
          }} />
          {/* A single hairline keeps it from reading as an unloaded image. */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, display: 'flex',
            background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
          }} />
        </div>
      ),
      { width: W, height: H }
    ).arrayBuffer()

    return new Response(thumbPng, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800, s-maxage=604800' },
    })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d1117 0%, #161b27 60%, #1a1a2e 100%)',
          padding: '56px 64px',
          position: 'relative',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-160px',
            width: '620px',
            height: '620px',
            borderRadius: '9999px',
            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            opacity: 0.28,
            filter: 'blur(20px)',
            display: 'flex',
          }}
        />
        {/* Accent bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '1200px',
            height: '10px',
            background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
            display: 'flex',
          }}
        />

        {/* A wash of the post's own accent, which is what gives each thumbnail
            its distinct colour once the title is gone. */}
        {isThumb && (
          <div style={{
            position: 'absolute', top: '18%', left: '52%', width: 620, height: 620,
            background: `radial-gradient(circle at 50% 50%, ${accent.from}55 0%, ${accent.from}22 40%, ${accent.from}00 68%)`,
            display: 'flex',
          }} />
        )}
        {isThumb && (
          <div style={{
            position: 'absolute', bottom: '-14%', left: '-8%', width: 460, height: 460,
            background: `radial-gradient(circle at 50% 50%, ${accent.to}44 0%, ${accent.to}00 66%)`,
            display: 'flex',
          }} />
        )}

        {/* Header: logo + tag pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: 'white' }}>List</span>
            <span style={{ fontSize: 40, fontWeight: 800, color: accent.from }}>my</span>
            <span style={{ fontSize: 40, fontWeight: 800, color: 'white' }}>AI</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 700,
              color: 'white',
              background: 'rgba(255,255,255,0.08)',
              border: `2px solid ${accent.from}`,
              borderRadius: '9999px',
              padding: '10px 28px',
            }}
          >
            {tag}
          </div>
        </div>

        {/* Title — omitted on thumbnails, where the card heading already
            carries it and the text would only be cropped. */}
        {!isThumb && (
          <div
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.15,
              maxWidth: '1000px',
            }}
          >
            {title}
          </div>
        )}

        {/* Footer — omitted on thumbnails: the card crops top and bottom, and
            this line was being sliced through the middle of its text. */}
        {!isThumb && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 24, color: '#94a3b8' }}>
            The AI Tools Directory
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: accent.from }}>
            listmyai.com/blog
          </div>
        </div>}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
