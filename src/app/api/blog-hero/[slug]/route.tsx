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
import { findMedia, fonts, hostOf, type CardTool } from '@/lib/social/instagram-card'
import { createClient } from '@supabase/supabase-js'
import { heroArtUrl } from '@/lib/blog/hero-image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

/**
 * The generated artwork for this post, as a data URI, or null if none was ever
 * made for it. Satori cannot fetch remote images itself, and a post written
 * before image generation existed simply has no object in the bucket.
 */
async function loadArt(slug: string): Promise<string | null> {
  try {
    const res = await fetch(heroArtUrl(slug), { cache: 'force-cache' })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (!buf.length) return null
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

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
  let tags: string[] = []
  let relatedIds: string[] = []
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('title, tags, related_tool_ids')
      .eq('slug', slug)
      .maybeSingle()
    if (data?.title) title = data.title
    if (Array.isArray(data?.tags)) tags = data.tags.map(String)
    if (tags[0]) tag = tags[0]
    if (Array.isArray(data?.related_tool_ids)) relatedIds = data.related_tool_ids.map(String)
  } catch {
    // DB unreachable — render from slug-derived title
  }

  const art = await loadArt(slug)
  const accent = ACCENTS[hashOf(slug) % ACCENTS.length]
  const titleSize = title.length > 70 ? 46 : title.length > 45 ? 54 : 62

  if (isThumb) return thumbnail(slug, title, tags, relatedIds, accent, new URL(req.url).origin, art)

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
        {art ? (
          <img
            src={art}
            width={1200}
            height={630}
            style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', objectFit: 'cover' }}
          />
        ) : null}
        {/* Scrim: generated art is unpredictable, the title must stay readable. */}
        {art ? (
          <div
            style={{
              position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px', display: 'flex',
              background: 'linear-gradient(100deg, #0d1117f2 0%, #0d1117d9 45%, #0d111766 100%)',
            }}
          />
        ) : null}
        {/* Accent glow. A full-canvas gradient rather than a blurred circle
            hanging off the corner: Satori clipped that circle's blur at its
            box, which showed as a straight vertical edge through the glow. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            background: `radial-gradient(circle at 1050px 110px, ${accent.from}55 0%, ${accent.to}33 18%, ${accent.to}00 40%)`,
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

// The card on /blog prints the title, date and excerpt beneath the image, so
// the image carries what those cannot: the topic, set large, and a real
// visual — the first related listing's own site or video — in a browser
// frame. The card crops to a wide band, so everything sits mid-height.
async function thumbnail(
  slug: string, title: string, tagsIn: string[], relatedIds: string[],
  accent: { from: string; to: string }, origin: string, art: string | null = null,
) {
  const W = 1200, H = 630
  const lower = title.toLowerCase()
  // Tags are sometimes stored as slugs ("ai-models"); set them as words.
  const pretty = (t: string) => /[A-Z]/.test(t) ? t
    : t.replace(/-/g, ' ').replace(/\b\w+/g, w => (w === 'ai' || w === 'api' || w === 'llm' ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
  const tags = tagsIn.map(pretty)
  // The tag that names what the post is about: one the title mentions,
  // earliest first, short enough to set large.
  const topic = tags
    .filter(t => t.length <= 22 && lower.includes(t.toLowerCase()))
    .sort((a, b) => lower.indexOf(a.toLowerCase()) - lower.indexOf(b.toLowerCase()))[0]
    ?? tags.find(t => t.length <= 22) ?? 'AI Insights'
  const second = tags.find(t => t !== topic && t.length <= 20)

  let tool: (CardTool & { id: string }) | null = null
  type Row = { id: string; slug: string; name: string; tagline: string | null; website: string | null; logo_url: string | null; cover_url: string | null; video_url: string | null }
  let candidates: Row[] = []
  if (relatedIds.length) {
    const { data } = await supabase
      .from('ai_tools')
      .select('id, slug, name, tagline, website, logo_url, cover_url, video_url')
      .in('id', relatedIds.slice(0, 6))
      .eq('status', 'active')
    // Keep the post's own order: its first related tool is the most relevant.
    const rows = (data ?? []).sort((a, b) => relatedIds.indexOf(a.id) - relatedIds.indexOf(b.id))
    // A tool the title names beats one that is merely related.
    const named = rows.find(r => lower.includes(r.name.toLowerCase()))
    candidates = named ? [named, ...rows] : rows
  }
  // The title often names a listing the post did not link ("Pion: …",
  // "Google Launches Gemini 3.8 Live …"). Every 1–4 word run of the title is
  // tried as an exact name in one query, and the longest match wins.
  if (!candidates.some(r => lower.includes(r.name.toLowerCase()))) {
    const words = title.replace(/[:—–,!?'"()]/g, ' ').split(/\s+/).filter(Boolean)
    const grams = new Set<string>()
    for (let n = 4; n >= 1; n--) {
      for (let i = 0; i + n <= words.length; i++) {
        const g = words.slice(i, i + n).join(' ')
        if (g.length >= 3 && !/^(the|and|for|with|what|how|why|new|ai|now|can|your|you)$/i.test(g)) grams.add(g)
      }
    }
    const list = [...grams].slice(0, 60)
    if (list.length) {
      const or = list.map(g => `name.ilike.${g.replace(/[,()%_\\]/g, ' ').trim()}`).join(',')
      const { data } = await supabase
        .from('ai_tools')
        .select('id, slug, name, tagline, website, logo_url, cover_url, video_url')
        .eq('status', 'active')
        .or(or)
        .limit(20)
      const best = (data ?? []).sort((x, y) => y.name.length - x.name.length)[0]
      if (best) candidates = [best, ...candidates]
    }
  }
  {
    // A named tool is shown even without a website; otherwise prefer one we
    // can capture.
    const first = candidates[0]
    const t = first && lower.includes(first.name.toLowerCase())
      ? first
      : candidates.find(r => r.website) ?? first
    if (t) {
      tool = {
        id: t.id, slug: t.slug, name: t.name, tagline: t.tagline ?? '', category: '',
        hook: null, website: t.website ?? null, logoUrl: t.logo_url ?? null,
        coverUrl: t.cover_url ?? null, videoUrl: t.video_url ?? null,
      }
    }
  }
  const [media, fontData] = await Promise.all([tool ? findMedia(tool, origin) : Promise.resolve(null), fonts()])
  // Sized by the longest word, not the whole string: a single long word cannot
  // wrap, so "Transformers" at 104px ran off the column and under the browser
  // frame. The column is 1200 - 128 padding - 48 gap - 560 frame = 464px wide,
  // and Inter Black sets at roughly 0.58em per character.
  const longestWord = topic.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), '')
  const fitsColumn = Math.floor(464 / Math.max(1, longestWord.length * 0.58))
  const topicSize = Math.min(topic.length > 16 ? 70 : topic.length > 10 ? 86 : 104, fitsColumn)
  const layer = (background: string) => ({
    position: 'absolute' as const, top: 0, left: 0, width: W, height: H, display: 'flex', background,
  })
  const FW = 560, FH = 380

  const png = await new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: 'flex', alignItems: 'center', padding: '0 64px', gap: 48,
        fontFamily: 'Inter', background: 'linear-gradient(135deg, #0b1020 0%, #111a33 55%, #160f2a 100%)',
      }}>
        {art ? <img src={art} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, objectFit: 'cover' }} /> : null}
        {art ? <div style={layer('linear-gradient(100deg, #0b1020f2 0%, #0b1020cc 50%, #0b102080 100%)')} /> : null}
        <div style={layer(`radial-gradient(circle at 250px 250px, ${accent.from}55 0%, ${accent.from}14 22%, ${accent.from}00 42%)`)} />
        <div style={layer(`radial-gradient(circle at 950px 420px, ${accent.to}88 0%, ${accent.to}22 24%, ${accent.to}00 46%)`)} />
        <div style={{ ...layer(`linear-gradient(90deg, ${accent.from}, ${accent.to})`), top: H - 6, height: 6 }} />

        {/* Topic */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex' }}>
            <div style={{
              display: 'flex', padding: '8px 18px', borderRadius: 999, fontSize: 18, fontWeight: 800,
              letterSpacing: 3, color: accent.from, background: `${accent.from}1f`, border: `2px solid ${accent.from}66`,
            }}>LISTMYAI BLOG</div>
          </div>
          <div style={{ display: 'flex', marginTop: 26, fontSize: topicSize, fontWeight: 900, color: 'white', lineHeight: 1.02, letterSpacing: -2 }}>
            {topic}
          </div>
          {second && (
            <div style={{ display: 'flex', marginTop: 14, fontSize: 30, fontWeight: 600, color: '#94a3b8' }}>+ {second}</div>
          )}
          {tool && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 34 }}>
              <div style={{
                display: 'flex', width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                background: accent.from, fontSize: 22, fontWeight: 900, color: 'white',
              }}>{tool.name.charAt(0).toUpperCase()}</div>
              <div style={{ display: 'flex', fontSize: 22, color: '#cbd5e1' }}>Featuring&nbsp;<span style={{ fontWeight: 800, color: 'white' }}>{tool.name.slice(0, 26)}</span></div>
            </div>
          )}
        </div>

        {/* Visual */}
        <div style={{
          display: 'flex', flexDirection: 'column', width: FW + 4, borderRadius: 22, overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.14)', background: '#0d1426',
          boxShadow: `0 30px 70px -25px rgba(0,0,0,0.9), 0 0 60px -20px ${accent.from}88`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 36, padding: '0 14px', gap: 7, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', width: 11, height: 11, borderRadius: 999, background: '#ff5f57' }} />
            <div style={{ display: 'flex', width: 11, height: 11, borderRadius: 999, background: '#febc2e' }} />
            <div style={{ display: 'flex', width: 11, height: 11, borderRadius: 999, background: '#28c840' }} />
            <div style={{ display: 'flex', marginLeft: 12, padding: '3px 14px', borderRadius: 999, fontSize: 14, color: '#94a3b8', background: 'rgba(255,255,255,0.06)' }}>
              {tool ? hostOf(tool.website) : 'listmyai.com/blog'}
            </div>
          </div>
          <div style={{ display: 'flex', position: 'relative', width: FW, height: FH }}>
            {media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.uri} width={FW} height={FH} style={{ width: FW, height: FH, objectFit: 'cover' }} />
            ) : (
              <div style={{
                display: 'flex', width: FW, height: FH, alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                fontSize: 150, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: -6,
              }}>{topic.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase()}</div>
            )}
            {media?.isVideo && (
              <div style={{
                position: 'absolute', top: FH / 2 - 44, left: FW / 2 - 44, width: 88, height: 88, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(233,69,96,0.92)',
              }}>
                <svg width="34" height="40" viewBox="0 0 56 64"><polygon points="4,0 56,32 4,64" fill="white" /></svg>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontData },
  ).arrayBuffer()

  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800, s-maxage=604800' },
  })
}
