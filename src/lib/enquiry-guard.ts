/**
 * Abuse guards for the agent enquiry endpoint.
 *
 * This route is different from the rest of the API: every call costs real
 * money, because every call hits a model. An open form that hits a paid model
 * is a bill waiting to be run up by the first scraper that finds it.
 *
 * None of these checks is strong on its own, and one of them is weaker than it
 * looks: the IP counter lives in the memory of a single serverless instance,
 * so a burst spread across instances gets more through than the number
 * suggests. It is a speed bump, not a wall. The cheap layers are stacked so
 * that the usual, lazy abuse is rejected before the model is ever called, and
 * the hard ceiling that actually bounds the cost is MAX_TURNS plus the
 * per-message length cap, which no attacker can spread across instances.
 */

export const MAX_MESSAGE_CHARS = 2_000
export const MAX_TURNS = 12
export const MIN_FILL_MS = 2_500

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 20

const hits = new Map<string, { count: number; resetAt: number }>()

export type Refusal =
  | 'honeypot'
  | 'bot-agent'
  | 'too-fast'
  | 'rate-limited'
  | 'message-too-long'
  | 'conversation-too-long'
  | 'empty'

export interface GuardInput {
  ip: string
  userAgent: string | null | undefined
  /** A field hidden from humans by CSS. Anything in it came from a script. */
  honeypot?: string | null
  /** Milliseconds between the form rendering and this submission. */
  elapsedMs?: number | null
  message: string
  /** How many messages the visitor has already sent in this conversation. */
  turnsSoFar: number
  isBot: (ua: string | null | undefined) => boolean
}

export interface GuardResult {
  ok: boolean
  reason?: Refusal
  /** Seconds until the IP window resets, when that is why it was refused. */
  retryAfter?: number
}

export function checkEnquiry(input: GuardInput, now: number = Date.now()): GuardResult {
  // Cheapest checks first — none of these touch shared state.
  if (input.honeypot != null && input.honeypot.trim() !== '') {
    return { ok: false, reason: 'honeypot' }
  }

  const message = input.message?.trim() ?? ''
  if (!message) return { ok: false, reason: 'empty' }
  if (message.length > MAX_MESSAGE_CHARS) return { ok: false, reason: 'message-too-long' }

  // The real cost ceiling. A conversation cannot grow without bound, so the
  // worst case per visitor is fixed however the IP checks behave.
  if (input.turnsSoFar >= MAX_TURNS) return { ok: false, reason: 'conversation-too-long' }

  if (input.isBot(input.userAgent)) return { ok: false, reason: 'bot-agent' }

  // Only applied to the opening message. Later replies legitimately arrive
  // fast, and a visitor who types quickly is not an attacker.
  if (input.turnsSoFar === 0 && typeof input.elapsedMs === 'number' && input.elapsedMs >= 0 && input.elapsedMs < MIN_FILL_MS) {
    return { ok: false, reason: 'too-fast' }
  }

  const entry = hits.get(input.ip)
  if (!entry || now > entry.resetAt) {
    hits.set(input.ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return { ok: false, reason: 'rate-limited', retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count += 1
  return { ok: true }
}

/** Test seam, and a way to drop expired rows rather than grow for ever. */
export function sweepEnquiryHits(now: number = Date.now()): void {
  for (const [ip, entry] of hits) if (now > entry.resetAt) hits.delete(ip)
}

export function resetEnquiryHits(): void {
  hits.clear()
}

/** What the visitor is told. Never names the specific guard that fired. */
export function refusalMessage(reason: Refusal): string {
  switch (reason) {
    case 'rate-limited':
      return 'That is a lot of enquiries from one place. Please try again a little later.'
    case 'message-too-long':
      return 'That message is longer than this form can take — could you shorten it?'
    case 'conversation-too-long':
      return 'We have plenty to go on now. Send it over and we will come back to you.'
    case 'empty':
      return 'Could you type something first?'
    default:
      // honeypot / bot-agent / too-fast all look identical from outside, so a
      // script cannot tell which check it tripped and tune around it.
      return 'Something went wrong sending that. Please try again.'
  }
}
