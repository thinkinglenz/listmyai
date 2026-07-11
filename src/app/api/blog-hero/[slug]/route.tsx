// Generates a branded hero image for a blog post from its title.
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
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

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

        {/* Title */}
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

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 24, color: '#94a3b8' }}>
            The AI Tools Directory
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: accent.from }}>
            listmyai.com/blog
          </div>
        </div>
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
