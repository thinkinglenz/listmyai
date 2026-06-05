import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

// ── Base32 decode ─────────────────────────────────────────────────────────────
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0, value = 0
  const output: number[] = []
  for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
    const idx = alphabet.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

// ── TOTP generation (RFC 6238) ────────────────────────────────────────────────
function totp(secret: string, windowOffset = 0): string {
  const counter = Math.floor(Date.now() / 1000 / 30) + windowOffset
  const buf = Buffer.alloc(8)
  buf.writeBigInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', base32Decode(secret))
  hmac.update(buf)
  const hash = hmac.digest()
  const offset = hash[hash.length - 1] & 0xf
  const code = (
    ((hash[offset]     & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) <<  8) |
     (hash[offset + 3] & 0xff)
  ) % 1_000_000
  return String(code).padStart(6, '0')
}

function verifyTOTP(secret: string, code: string): boolean {
  // Allow ±1 window (90s tolerance for clock skew)
  return [-1, 0, 1].some(w => totp(secret, w) === code)
}

const SECRET = process.env.ADMIN_TOTP_SECRET ?? 'DNB2RF2MPEYGBGGBMKMY'

// GET — return QR code URL for initial setup
export async function GET() {
  const label = encodeURIComponent('ListmyAI:Admin')
  const issuer = encodeURIComponent('ListmyAI')
  // Keep the otpauth URL minimal — shorter URL = less dense QR = easier to scan
  const otpauth = `otpauth://totp/${label}?secret=${SECRET}&issuer=${issuer}`
  // Use a larger size (400px) and lowest error correction (L) for maximum scannability
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=L&margin=10&data=${encodeURIComponent(otpauth)}`
  return NextResponse.json({ qr, secret: SECRET })
}

// POST — verify a TOTP code
export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Enter a 6-digit code.' }, { status: 400 })
  }
  if (!verifyTOTP(SECRET, code)) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 401 })
  }
  return NextResponse.json({ verified: true })
}
