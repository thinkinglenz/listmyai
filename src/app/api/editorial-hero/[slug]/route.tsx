// The image for an editorial.
//
// Editorials shipped with no image at all: nothing on the page, and no
// og:image, so every share on LinkedIn or WhatsApp rendered as a bare link.
// Rendered rather than generated — deterministic, free, no API key, same
// slug always producing the same card. When GEMINI_API_KEY or OPENAI_API_KEY
// exists, real artwork can sit behind this exactly as it does for the blog.
import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { fonts } from '@/lib/social/instagram-card'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const W = 1200
const H = 630

// Same palette as the blog cards, so the two surfaces look like one site.
const ACCENTS = [
  { from: '#e94560', to: '#7c2d3e' },
  { from: '#10b981', to: '#065f46' },
  { from: '#3b82f6', to: '#1e3a8a' },
  { from: '#8b5cf6', to: '#4c1d95' },
  { from: '#f59e0b', to: '#92400e' },
  { from: '#06b6d4', to: '#155e75' },
]

function hashOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // A card must render even with the database down: the social crawler that
  // fetches it will not come back, and a broken image is permanent.
  let title = titleFromSlug(slug)
  let toolName = ''
  try {
    const { data } = await supabase
      .from('editorials').select('title, slug').eq('slug', slug).maybeSingle()
    if (data?.title) title = data.title
    toolName = titleFromSlug(slug)
  } catch { /* slug-derived title stands */ }

  const accent = ACCENTS[hashOf(slug) % ACCENTS.length]
  const size = title.length > 78 ? 44 : title.length > 52 ? 52 : 60
  const fontData = await fonts()

  const png = await new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '56px 64px', position: 'relative',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b27 60%, #1a1a2e 100%)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: `${W}px`, height: `${H}px`, display: 'flex',
          background: `radial-gradient(circle at 1050px 110px, ${accent.from}55 0%, ${accent.to}33 18%, ${accent.to}00 40%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: `${W}px`, height: '10px', display: 'flex',
          background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: 'white' }}>List</span>
            <span style={{ fontSize: 40, fontWeight: 800, color: accent.from }}>my</span>
            <span style={{ fontSize: 40, fontWeight: 800, color: 'white' }}>AI</span>
          </div>
          <div style={{
            display: 'flex', fontSize: 22, fontWeight: 700, color: 'white',
            background: 'rgba(255,255,255,0.08)', border: `2px solid ${accent.from}`,
            borderRadius: '9999px', padding: '10px 28px', letterSpacing: 2,
          }}>EDITORIAL</div>
        </div>

        <div style={{
          display: 'flex', fontSize: size, fontWeight: 800, color: 'white',
          lineHeight: 1.14, maxWidth: '1010px',
        }}>{title}</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 23, color: '#94a3b8' }}>
            Written independently. Not paid placement.
          </div>
          <div style={{ display: 'flex', fontSize: 23, fontWeight: 700, color: accent.from }}>
            listmyai.com/editorial
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontData },
  ).arrayBuffer()

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      // A week at the edge: the card only changes when the title does.
      'Cache-Control': 'public, max-age=604800, s-maxage=604800',
    },
  })
}
