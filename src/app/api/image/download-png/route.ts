import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url param required' }, { status: 400 })

  // Our own blog-hero endpoint already returns a PNG — pass through untouched.
  // Otherwise, force PNG format via Unsplash URL param.
  const isOwnHero = url.includes('/api/blog-hero/')
  const pngUrl = isOwnHero
    ? (url.startsWith('http') ? url : `${req.nextUrl.origin}${url}`)
    : url
        .replace(/[&?]fm=[a-z]+/, '')       // remove existing fm= param
        .replace(/[&?]auto=format/, '')      // remove auto=format
        .replace(/\?$/, '')                  // clean trailing ?
        + (url.includes('?') ? '&' : '?') + 'fm=png&fit=crop'

  try {
    const res = await fetch(pngUrl, { headers: { 'User-Agent': 'ListmyAI/1.0' } })
    if (!res.ok) throw new Error(`Upstream ${res.status}`)

    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="listmyai-hero.png"',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
