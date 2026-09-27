// Best available preview image for a listing.
//
// Order matters, best first:
//   1. cover_url  — an admin's explicit choice always wins
//   2. og:image   — the marketing image the tool designed for sharing, already
//                   1200x630 and far better than any screenshot
// There is no third source. A 404 here lets the card fall back to the grey
// brand panel, which is the only thing behind these two.
//
// The bytes are proxied rather than redirected to, so caching is ours to
// control and a site that blocks hotlinking by Referer still works.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sites serve very different markup to an obvious bot, so ask as a browser.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function metaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

/** The tool's own share image, resolved to an absolute URL. */
async function findOgImage(website: string): Promise<string | null> {
  try {
    const res = await fetch(website, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(10_000),
      redirect: 'follow',
    })
    if (!res.ok) return null

    // Cut at </head> rather than at a fixed offset. A 200k character window
    // looked generous until namestation.com, whose og:image sits at character
    // 340,126 of a 1.7MB page: frameworks inline a great deal of JSON and
    // script before the meta tags, so position in the file says nothing about
    // whether a tag is in the head.
    const raw = await res.text()
    const headEnd = raw.indexOf('</head>')
    const html = headEnd > 0 ? raw.slice(0, headEnd) : raw.slice(0, 1_000_000)
    const found =
      metaContent(html, 'og:image') ??
      metaContent(html, 'twitter:image') ??
      metaContent(html, 'twitter:image:src')

    if (!found) return null
    // og:image is often a path or protocol-relative.
    return new URL(found, res.url || website).href
  } catch {
    return null
  }
}

async function fetchImage(url: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(12_000),
      redirect: 'follow',
    })
    if (!res.ok) return null

    const type = res.headers.get('content-type') ?? ''
    // An HTML error page returned with a 200 is not an image.
    if (!type.startsWith('image/')) return null

    const body = await res.arrayBuffer()
    // Tiny responses are usually a tracking pixel or a placeholder, but SVG is
    // text and a real share image can be under a kilobyte: deepege.com's is
    // 1,053 bytes and was being thrown away as a pixel.
    const floor = type.startsWith('image/svg') ? 200 : 2_000
    if (body.byteLength < floor) return null

    return { body, type }
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('website, logo_url, cover_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

  const candidates: string[] = []
  if (tool.cover_url) candidates.push(tool.cover_url)

  if (tool.website) {
    const og = await findOgImage(tool.website)
    if (og) candidates.push(og)
  }

  for (const url of candidates) {
    const image = await fetchImage(url)
    if (image) {
      return new NextResponse(image.body, {
        headers: {
          'Content-Type': image.type,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800',
        },
      })
    }
  }

  return NextResponse.json({ error: 'No preview image available' }, { status: 404 })
}
