// The Instagram post for a listing: 1080x1350, built around the listing's own
// visual — its video thumbnail, share image or a live screenshot — framed
// like a browser window, with the headline and the DM call to action below.

import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'

const W = 1080

// Feed posts are 4:5. Stories are 9:16, and Instagram draws its own header
// and reply bar over the top and bottom ~250px, so the story layout keeps
// clear of both.
const LAYOUT = {
  post:  { H: 1350, MEDIA_H: 600, padTop: 64,  ctaBottom: 88,  footBottom: 30 },
  story: { H: 1920, MEDIA_H: 740, padTop: 230, ctaBottom: 300, footBottom: 240 },
} as const
export type CardFormat = keyof typeof LAYOUT

/**
 * What the button says. Only Instagram has the comment-to-DM flow;
 * Facebook and Threads carry a clickable link in the post text instead.
 */
export type CardCta = 'comment' | 'caption' | 'site'

import { COMMENT_DM_ON } from './copy'

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export interface CardTool {
  slug: string
  name: string
  tagline: string
  category: string
  hook: string | null
  website: string | null
  logoUrl: string | null
  coverUrl: string | null
  videoUrl: string | null
}

// Satori renders PNG and JPEG; WebP and ICO arrive often and would break the
// render, so the bytes are checked rather than the URL or content-type.
async function imageAsDataUri(url: string, timeoutMs = 9000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'image/png,image/jpeg,image/*;q=0.8' },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 1500 || buf.length > 6_000_000) return null
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    if (!isPng && !isJpeg) return null
    return `data:image/${isPng ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

function youtubeId(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

function hostOf(url: string | null): string {
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : 'listmyai.com' } catch { return 'listmyai.com' }
}

/** Best visual for the listing, and whether it is a video frame. */
async function findMedia(tool: CardTool, origin: string): Promise<{ uri: string; isVideo: boolean } | null> {
  // An admin-chosen cover always wins; the preview route serves it first.
  const preview = `${origin}/api/tools/preview/${tool.slug}`
  if (tool.coverUrl) {
    const uri = await imageAsDataUri(preview)
    if (uri) return { uri, isVideo: false }
  }
  const yt = youtubeId(tool.videoUrl)
  if (yt) {
    for (const size of ['maxresdefault', 'hqdefault']) {
      const uri = await imageAsDataUri(`https://i.ytimg.com/vi/${yt}/${size}.jpg`)
      if (uri) return { uri, isVideo: true }
    }
  }
  if (!tool.coverUrl) {
    const uri = await imageAsDataUri(preview)
    if (uri) return { uri, isVideo: false }
  }
  // The preview may have been a WebP share image; a screenshot is always PNG.
  if (tool.website) {
    const uri = await imageAsDataUri(`${origin}/api/tools/screenshot?url=${encodeURIComponent(tool.website)}`, 15000)
    if (uri) return { uri, isVideo: false }
  }
  return null
}

let fontCache: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 800 | 900; style: 'normal' }[]> | null = null
function fonts() {
  fontCache ??= Promise.all(
    ([400, 600, 800, 900] as const).map(async weight => ({
      name: 'Inter',
      data: await readFile(join(process.cwd(), `assets/fonts/inter-latin-${weight}-normal.woff`)),
      weight,
      style: 'normal' as const,
    })),
  )
  return fontCache
}

const fullLayer = (background: string, H: number) => ({
  position: 'absolute' as const, top: 0, left: 0, width: W, height: H, display: 'flex', background,
})

export async function renderInstagramCard(tool: CardTool, origin: string, format: CardFormat = 'post', cta: CardCta = 'comment'): Promise<NextResponse> {
  const { H, MEDIA_H, padTop, ctaBottom, footBottom } = LAYOUT[format]
  const [media, logo, fontData] = await Promise.all([
    findMedia(tool, origin),
    tool.logoUrl ? imageAsDataUri(tool.logoUrl, 5000) : Promise.resolve(null),
    fonts(),
  ])

  const headline = (tool.hook || tool.name).slice(0, 80)
  const headSize = headline.length > 52 ? 54 : headline.length > 34 ? 64 : 80
  const letter = tool.name.charAt(0).toUpperCase() || '?'

  const png = await new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: 'flex', flexDirection: 'column',
        padding: `${padTop}px 70px 0`, fontFamily: 'Inter',
        background: 'linear-gradient(165deg, #0b1020 0%, #111a33 45%, #1c1033 100%)',
      }}>
        {/* Full-canvas glows: an off-canvas box gets clamped by Satori and
            shows a straight cut edge. */}
        <div style={fullLayer('radial-gradient(circle at 900px 260px, rgba(233,69,96,0.45) 0%, rgba(233,69,96,0.12) 20%, rgba(233,69,96,0) 40%)', H)} />
        <div style={fullLayer('radial-gradient(circle at 120px 520px, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 34%)', H)} />
        <div style={fullLayer('radial-gradient(circle at 540px 1350px, rgba(184,52,143,0.35) 0%, rgba(184,52,143,0) 40%)', H)} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderRadius: 999,
            background: 'rgba(233,69,96,0.14)', border: '2px solid rgba(233,69,96,0.45)',
          }}>
            <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 999, background: '#ff4d6d' }} />
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, letterSpacing: 4, color: '#ff8fa3' }}>NEW ON LISTMYAI</div>
          </div>
          <div style={{
            display: 'flex', padding: '12px 24px', borderRadius: 999, fontSize: 24, fontWeight: 600,
            color: '#c7d2fe', background: 'rgba(99,102,241,0.16)', border: '2px solid rgba(99,102,241,0.4)',
          }}>{tool.category}</div>
        </div>

        {/* The listing itself, in a browser frame */}
        <div style={{
          display: 'flex', flexDirection: 'column', marginTop: 40, borderRadius: 34, overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.14)', background: '#0d1426',
          boxShadow: '0 40px 90px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(233,69,96,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 58, padding: '0 24px', gap: 10, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 999, background: '#ff5f57' }} />
            <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 999, background: '#febc2e' }} />
            <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 999, background: '#28c840' }} />
            <div style={{
              display: 'flex', marginLeft: 22, padding: '6px 22px', borderRadius: 999, fontSize: 20, color: '#94a3b8',
              background: 'rgba(255,255,255,0.06)',
            }}>{hostOf(tool.website)}</div>
          </div>
          <div style={{ display: 'flex', position: 'relative', width: W - 140 - 4, height: MEDIA_H }}>
            {media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.uri} width={W - 144} height={MEDIA_H} style={{ width: W - 144, height: MEDIA_H, objectFit: 'cover' }} />
            ) : (
              <div style={{
                display: 'flex', width: W - 144, height: MEDIA_H, alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #e94560 0%, #7c3aed 55%, #2563eb 100%)',
                fontSize: 260, fontWeight: 900, color: 'rgba(255,255,255,0.92)',
              }}>{letter}</div>
            )}
            {media?.isVideo && (
              <div style={{
                position: 'absolute', top: MEDIA_H / 2 - 70, left: (W - 144) / 2 - 70, width: 140, height: 140,
                borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(233,69,96,0.92)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}>
                <svg width="56" height="64" viewBox="0 0 56 64"><polygon points="4,0 56,32 4,64" fill="white" /></svg>
              </div>
            )}
          </div>
        </div>

        {/* Headline and identity */}
        <div style={{ display: 'flex', marginTop: 44, fontSize: headSize, fontWeight: 900, color: 'white', lineHeight: 1.06, letterSpacing: -2 }}>
          {headline}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 30 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={76} height={76} style={{ width: 76, height: 76, borderRadius: 20, objectFit: 'cover', background: 'white' }} />
          ) : (
            <div style={{
              display: 'flex', width: 76, height: 76, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
              background: '#e94560', fontSize: 40, fontWeight: 900, color: 'white',
            }}>{letter}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {tool.hook && <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: 'white' }}>{tool.name.slice(0, 34)}</div>}
            <div style={{ display: 'flex', fontSize: 26, color: '#a5b4c8', lineHeight: 1.3 }}>{tool.tagline.slice(0, 80)}</div>
          </div>
        </div>

        {/* Call to action */}
        <div style={{
          position: 'absolute', left: 70, right: 70, bottom: ctaBottom, height: 108, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 16, borderRadius: 30,
          background: 'linear-gradient(90deg, #e94560 0%, #c2338f 55%, #7c3aed 100%)',
          boxShadow: '0 24px 60px -20px rgba(233,69,96,0.7)',
        }}>
          {cta === 'caption' ? (
            <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: 'white' }}>Tap the link in the post  ↑</div>
          ) : cta === 'comment' && COMMENT_DM_ON ? (
            <>
              <div style={{ display: 'flex', fontSize: 38, fontWeight: 600, color: 'white' }}>Comment</div>
              <div style={{
                // Satori does not apply the row gap across a fragment.
                display: 'flex', padding: '6px 20px', margin: '0 18px', borderRadius: 14, background: 'white',
                fontSize: 36, fontWeight: 900, color: '#e94560', letterSpacing: 2,
              }}>LINK</div>
              <div style={{ display: 'flex', fontSize: 38, fontWeight: 600, color: 'white' }}>
                {format === 'story' ? 'on our post for the link' : 'to get it in your DMs'}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: 'white' }}>Explore it on listmyai.com  →</div>
          )}
        </div>
        <div style={{
          position: 'absolute', left: 70, right: 70, bottom: footBottom, display: 'flex', justifyContent: 'space-between',
          fontSize: 24, fontWeight: 600, color: '#64748b',
        }}>
          <div style={{ display: 'flex' }}>20,000+ AI tools · listmyai.com</div>
          <div style={{ display: 'flex' }}>Follow @listmyai</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontData },
  ).arrayBuffer()

  // Instagram's publishing API accepts JPEG only.
  const decoded = PNG.sync.read(Buffer.from(png))
  const { data } = jpeg.encode({ data: decoded.data, width: decoded.width, height: decoded.height }, 92)
  return new NextResponse(new Uint8Array(data), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=604800, s-maxage=604800' },
  })
}
