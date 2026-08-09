// Server-side screenshot proxy.
//
// Visitors' browsers used to hit image.thum.io directly. thum.io's free tier
// answers over-quota requests with a "Please sign-up for a paid account"
// picture served as HTTP 200 + valid PNG — so <img onError> never fired and
// that watermark rendered on the tool page instead of our own fallback.
//
// Routing it through here fixes both halves:
//   1. thum.io only ever sees requests from Vercel, not from every visitor.
//   2. We can inspect the bytes and refuse to serve a watermark — a 404 lets
//      WebsitePreview fall back to the branded card.
// Successful captures get an immutable Cache-Control so Vercel's CDN keeps
// them and thum.io is hit roughly once per tool.

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Measured 1280x853 captures: near-blank example.com 25KB, a plain text-only
// page 54KB, typical tool landing pages 80-210KB. thum.io's watermark is a
// flat background with three lines of text, which PNG squeezes well below
// even the blankest real page — so 20KB separates them without discarding
// screenshots of genuinely minimal sites.
const MIN_REAL_SCREENSHOT_BYTES = 20_000

// Exact sha256 of known thum.io placeholder bodies. The watermark is
// byte-identical every time it is served, so a hash pins it precisely even if
// a future variant lands above the size floor. Rejections are logged with
// their hash so this list can be extended from real traffic.
const KNOWN_PLACEHOLDER_HASHES = new Set<string>([])

function placeholderReason(buf: Buffer): string | null {
  const hash = createHash('sha256').update(buf).digest('hex')
  if (KNOWN_PLACEHOLDER_HASHES.has(hash)) return `known-placeholder ${hash}`
  if (buf.byteLength < MIN_REAL_SCREENSHOT_BYTES) return `undersized ${buf.byteLength}B sha256=${hash}`
  return null
}

// Returns the refusing status code when the site turns away automated
// clients, or null when a capture is worth attempting. A network error is
// not treated as a block — thum.io may still reach a host we cannot.
async function probeForBotBlock(target: string): Promise<number | null> {
  try {
    const res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8_000),
    })
    // Drain so the connection is released promptly; the body itself is unused.
    void res.body?.cancel()
    return res.status === 403 || res.status === 429 || res.status === 503 ? res.status : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url')
  if (!target) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Only ever screenshot public http(s) origins — never let this route be
  // pointed at internal hosts.
  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 })
  }
  if (/^(localhost$|127\.|10\.|192\.168\.|169\.254\.|\[?::1\]?$)/i.test(parsed.hostname)) {
    return NextResponse.json({ error: 'Blocked host' }, { status: 400 })
  }

  // Sites behind a bot firewall (Cloudflare and friends) serve crawlers a
  // "you have been blocked" page instead of their homepage. thum.io happily
  // screenshots that block page and returns it as a perfectly valid, richly
  // detailed PNG, so no amount of inspecting the bytes will catch it.
  //
  // What does catch it: asking the site ourselves. A host that refuses our
  // request refuses thum.io's too, so a 403/429/503 here means the capture
  // would be a block page — skip it and let the branded fallback show.
  const blockedStatus = await probeForBotBlock(parsed.toString())
  if (blockedStatus) {
    return NextResponse.json(
      { error: `Site blocks automated access (${blockedStatus})` },
      { status: 404, headers: { 'Cache-Control': 'public, max-age=86400' } }
    )
  }

  const upstream = `https://image.thum.io/get/width/1280/crop/800/noanimate/${parsed.toString()}`

  try {
    const res = await fetch(upstream, {
      headers: { 'User-Agent': 'ListmyAI/1.0 (+https://listmyai.com)' },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 404 })
    }

    const buf = Buffer.from(await res.arrayBuffer())

    const rejected = placeholderReason(buf)
    if (rejected) {
      // Quota watermark (or an empty render). Tell the client there is no
      // screenshot so it draws the branded fallback, and keep the negative
      // answer short-lived so the next visitor retries.
      console.warn(`[screenshot] rejected ${parsed.hostname}: ${rejected}`)
      return NextResponse.json(
        { error: 'No screenshot available' },
        { status: 404, headers: { 'Cache-Control': 'public, max-age=600' } }
      )
    }

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/png',
        // Captured once, then served from the edge.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Screenshot fetch failed' }, { status: 404 })
  }
}
