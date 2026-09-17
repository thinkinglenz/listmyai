// Square social card for a tool listing, served as JPEG.
//
// Instagram's Content Publishing API downloads an image from a public URL and
// accepts JPEG only — next/og always emits PNG, so the card is rendered and
// then converted. Facebook is happy either way, but sharing one image keeps
// both networks visually identical.
//
// The conversion is pure JS rather than sharp: sharp ships a native libvips
// that collides with the copy Next bundles, and a native-binary clash is a bad
// trade for a route that renders one image per approval and caches it a week.

import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'

// 1080x1080 sits inside Instagram's accepted aspect range and is the safest
// single size for a card that also has to look right in a Facebook feed.
const SIZE = 1080

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // The social post needs the name and tagline set large. As a fallback image
  // inside a card that already prints both, that same art reads as duplicated
  // text — so `?variant=plain` keeps the brand furniture and drops the words.
  const isPlain = new URL(req.url).searchParams.get('variant') === 'plain'
  // `?format=portrait`: 1080x1350, Instagram's tallest feed size. The square
  // card was being posted by hand from a 1200x630 download, which Instagram
  // crops at both sides.
  const isPortrait = new URL(req.url).searchParams.get('format') === 'portrait'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('name, tagline, description, social_hook, categories(name)')
    .eq('slug', slug)
    .maybeSingle()

  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRel = (tool as any).categories
  const category = (Array.isArray(catRel) ? catRel[0]?.name : catRel?.name) ?? 'AI Tool'
  const tagline = (tool.tagline || tool.description || '').slice(0, 120)

  // The plain panel is composed for the 16:10 slot it fills, rather than being
  // a square post cropped into it — cropping left the artwork off-centre with
  // most of it discarded.
  if (isPlain) {
    const W = 1200, H = 750
    const letter = (tool.name ?? '?').charAt(0).toUpperCase()
    const plainPng = await new ImageResponse(
      (
        <div style={{
          width: W, height: H, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(150deg, #0f172a 0%, #0d1b2e 55%, #131c30 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          {/* Full-canvas glow layers: Satori clamps an off-canvas box to its
              parent and the gradient then shows a straight cut edge. */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex',
            background: 'radial-gradient(circle at 940px 160px, rgba(233,69,96,0.32) 0%, rgba(233,69,96,0.10) 18%, rgba(233,69,96,0) 36%)',
          }} />
          <div style={{
            width: 200, height: 200, borderRadius: 48, background: '#e94560',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 104, fontWeight: 900, color: 'white',
            boxShadow: '0 30px 80px -20px rgba(233,69,96,0.6)',
          }}>{letter}</div>
          <div style={{
            display: 'flex', marginTop: 40, padding: '14px 34px', borderRadius: 999,
            border: '2px solid rgba(233,69,96,0.35)', background: 'rgba(233,69,96,0.10)',
            fontSize: 30, color: '#e94560', fontWeight: 600,
          }}>{category}</div>
          <div style={{
            position: 'absolute', bottom: 44, display: 'flex',
            fontSize: 26, color: '#475569', fontWeight: 600,
          }}>listmyai.com</div>
        </div>
      ),
      { width: W, height: H }
    ).arrayBuffer()

    const d = PNG.sync.read(Buffer.from(plainPng))
    const { data: plainJpeg } = jpeg.encode({ data: d.data, width: d.width, height: d.height }, 90)
    return new NextResponse(new Uint8Array(plainJpeg), {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=604800, s-maxage=604800' },
    })
  }

  if (isPortrait) return portraitCard(tool.name ?? '', tagline, category, tool.social_hook ?? null)

  const png = await new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 90,
          background: 'linear-gradient(135deg, #0f172a 0%, #0d1b2e 55%, #131c30 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Accent wash, echoing the site's brand glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE, display: 'flex',
          background: 'radial-gradient(circle at 890px 150px, rgba(233,69,96,0.30) 0%, rgba(233,69,96,0.10) 17%, rgba(233,69,96,0) 34%)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{ width: 46, height: 6, borderRadius: 3, background: '#e94560', display: 'flex' }} />
          <div style={{ fontSize: 26, letterSpacing: 6, color: '#e94560', fontWeight: 700 }}>
            NEW ON LISTMYAI
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginBottom: 34 }}>
          {/* First letter as the mark: a tool's own logo is an external URL of
              unknown format and may not load during rendering. */}
          <div style={{
            width: 120, height: 120, borderRadius: 30, background: '#e94560',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 62, fontWeight: 900, color: 'white',
          }}>
            {(tool.name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 900, color: 'white', lineHeight: 1.05 }}>
            {(tool.name ?? '').slice(0, 22)}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 38, color: '#94a3b8', lineHeight: 1.45, marginBottom: 52 }}>
          {tagline}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{
            display: 'flex', padding: '14px 30px', borderRadius: 999,
            border: '2px solid rgba(233,69,96,0.35)', background: 'rgba(233,69,96,0.10)',
            fontSize: 28, color: '#e94560', fontWeight: 600,
          }}>
            {category}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 70, left: 90,
          display: 'flex', fontSize: 30, color: '#64748b', fontWeight: 600,
        }}>
          listmyai.com
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  ).arrayBuffer()

  // PNG -> raw RGBA -> JPEG. jpeg-js wants the same RGBA layout pngjs decodes
  // to, so no channel shuffling is needed in between.
  const decoded = PNG.sync.read(Buffer.from(png))
  const { data: jpegData } = jpeg.encode(
    { data: decoded.data, width: decoded.width, height: decoded.height },
    90
  )

  return new NextResponse(new Uint8Array(jpegData), {
    headers: {
      'Content-Type': 'image/jpeg',
      // Deterministic per slug, so it can be cached hard.
      'Cache-Control': 'public, max-age=604800, s-maxage=604800',
    },
  })
}

// Instagram shows the whole 4:5 post in the feed but crops the profile grid
// to 3:4, which trims about 35px from each side, so nothing important sits
// within 80px of the left or right edge.
const COMMENT_DM_ON = process.env.NEXT_PUBLIC_INSTAGRAM_COMMENT_DM === 'on'

async function portraitCard(name: string, tagline: string, category: string, hook: string | null) {
  const W = 1080, H = 1350
  // The headline carries the post; the name and tagline sit beneath it. With
  // no headline yet, the name takes the headline's place.
  const headline = (hook || name).slice(0, 80)
  const headSize = headline.length > 48 ? 70 : headline.length > 30 ? 82 : 98
  const dmName = name.length > 22 ? `${name.slice(0, 21)}…` : name
  const png = await new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: 'flex', flexDirection: 'column',
        padding: '100px 90px 90px',
        background: 'linear-gradient(160deg, #0f172a 0%, #0d1b2e 50%, #1a1430 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Full-canvas glow layers: Satori clamps an off-canvas box to its
            parent and the gradient then shows a straight cut edge. */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex',
          background: 'radial-gradient(circle at 880px 180px, rgba(233,69,96,0.34) 0%, rgba(233,69,96,0.10) 18%, rgba(233,69,96,0) 36%)',
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex',
          background: 'radial-gradient(circle at 150px 1250px, rgba(99,102,241,0.24) 0%, rgba(99,102,241,0) 32%)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 7, borderRadius: 4, background: '#e94560', display: 'flex' }} />
          <div style={{ display: 'flex', fontSize: 28, letterSpacing: 7, color: '#e94560', fontWeight: 700 }}>
            NEW ON LISTMYAI
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingBottom: 200 }}>
          <div style={{ display: 'flex', fontSize: headSize, fontWeight: 900, color: 'white', lineHeight: 1.08, letterSpacing: -1 }}>
            {headline}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 56 }}>
            <div style={{
              display: 'flex', width: 104, height: 104, borderRadius: 28, background: '#e94560',
              alignItems: 'center', justifyContent: 'center', fontSize: 58, fontWeight: 900, color: 'white',
              boxShadow: '0 24px 60px -18px rgba(233,69,96,0.6)',
            }}>
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 46, fontWeight: 800, color: 'white' }}>{name.slice(0, 32)}</div>
              <div style={{ display: 'flex', marginTop: 6, fontSize: 28, color: '#ff6b85', fontWeight: 600 }}>{category}</div>
            </div>
          </div>

          {hook && tagline && (
            <div style={{ display: 'flex', marginTop: 34, fontSize: 36, color: '#a5b4c8', lineHeight: 1.4 }}>
              {tagline.slice(0, 110)}
            </div>
          )}
        </div>

        {/* The call to action the DM automation answers. It only promises a
            DM once that automation is switched on. */}
        <div style={{
          position: 'absolute', left: 90, right: 90, bottom: 150, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 16, padding: '30px 32px', borderRadius: 28,
          background: 'linear-gradient(90deg, #e94560 0%, #b8348f 100%)',
        }}>
          {COMMENT_DM_ON ? (
            <>
              <div style={{ display: 'flex', fontSize: 40, color: 'white', fontWeight: 500 }}>DM us</div>
              <div style={{
                display: 'flex', padding: '6px 20px', borderRadius: 14, background: 'white',
                fontSize: 38, color: '#e94560', fontWeight: 900,
              }}>{dmName}</div>
              <div style={{ display: 'flex', fontSize: 40, color: 'white', fontWeight: 500 }}>for the link</div>
            </>
          ) : (
            <div style={{ display: 'flex', fontSize: 40, color: 'white', fontWeight: 600 }}>Find it on listmyai.com</div>
          )}
        </div>

        <div style={{
          position: 'absolute', left: 90, right: 90, bottom: 70, display: 'flex', justifyContent: 'space-between',
          fontSize: 28, color: '#64748b', fontWeight: 600,
        }}>
          <div style={{ display: 'flex' }}>listmyai.com</div>
          <div style={{ display: 'flex' }}>Follow @listmyai</div>
        </div>
      </div>
    ),
    { width: W, height: H }
  ).arrayBuffer()

  const decoded = PNG.sync.read(Buffer.from(png))
  const { data } = jpeg.encode({ data: decoded.data, width: decoded.width, height: decoded.height }, 92)
  return new NextResponse(new Uint8Array(data), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=604800, s-maxage=604800' },
  })
}
