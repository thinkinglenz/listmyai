// Signed opt-in links.
//
// A consent link has to be tied to the address it was sent to, or anyone could
// edit the URL and opt in somebody else's email — which would make the whole
// consent record worthless.

import { createHmac, timingSafeEqual } from 'crypto'

function key(): string {
  const k = process.env.CRON_SECRET
  if (!k) throw new Error('CRON_SECRET not set — opt-in links cannot be signed')
  return k
}

export function signOptIn(email: string): string {
  return createHmac('sha256', key()).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

export function verifyOptIn(email: string, token: string): boolean {
  try {
    const expected = signOptIn(email)
    if (expected.length !== token.length) return false
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}
