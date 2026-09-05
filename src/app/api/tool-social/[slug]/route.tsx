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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('name, tagline, description, categories(name)')
    .eq('slug', slug)
    .maybeSingle()

  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catRel = (tool as any).categories
  const category = (Array.isArray(catRel) ? catRel[0]?.name : catRel?.name) ?? 'AI Tool'
  const tagline = (tool.tagline || tool.description || '').slice(0, 120)

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
          position: 'absolute', top: -160, right: -120, width: 620, height: 620,
          background: 'radial-gradient(circle at 50% 50%, rgba(233,69,96,0.30) 0%, rgba(233,69,96,0.10) 42%, rgba(233,69,96,0) 68%)', display: 'flex',
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
