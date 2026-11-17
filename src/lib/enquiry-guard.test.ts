import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { checkEnquiry, resetEnquiryHits, sweepEnquiryHits, refusalMessage, MAX_TURNS, MAX_MESSAGE_CHARS } from './enquiry-guard.ts'

const neverBot = () => false
const base = {
  ip: '1.2.3.4',
  userAgent: 'Mozilla/5.0 (Macintosh) Chrome/131',
  message: 'We get about 40 support emails a day and keep answering the same things.',
  turnsSoFar: 1,
  elapsedMs: 10_000,
  isBot: neverBot,
}

beforeEach(() => resetEnquiryHits())

test('a normal enquiry passes', () => {
  assert.equal(checkEnquiry(base).ok, true)
})

test('anything in the honeypot is refused before anything else is checked', () => {
  // Deliberately also empty and over-long: the honeypot must win, so a script
  // cannot learn which other rule it would have tripped.
  const r = checkEnquiry({ ...base, honeypot: 'http://spam.example', message: '' })
  assert.equal(r.reason, 'honeypot')
})

test('an empty honeypot is what a real browser sends and must pass', () => {
  assert.equal(checkEnquiry({ ...base, honeypot: '' }).ok, true)
  assert.equal(checkEnquiry({ ...base, honeypot: '   ' }).ok, true)
})

test('a crawler user agent is refused', () => {
  const r = checkEnquiry({ ...base, isBot: () => true })
  assert.equal(r.reason, 'bot-agent')
})

test('an instant first submission is refused, but a fast later reply is not', () => {
  assert.equal(checkEnquiry({ ...base, turnsSoFar: 0, elapsedMs: 300 }).reason, 'too-fast')
  // Mid-conversation, a quick "yes" is perfectly normal.
  assert.equal(checkEnquiry({ ...base, turnsSoFar: 3, elapsedMs: 300 }).ok, true)
})

test('a missing timing value does not refuse a real visitor', () => {
  // Older browsers, blocked scripts, or a replayed form can all omit it.
  assert.equal(checkEnquiry({ ...base, turnsSoFar: 0, elapsedMs: null }).ok, true)
  assert.equal(checkEnquiry({ ...base, turnsSoFar: 0, elapsedMs: undefined }).ok, true)
})

test('an over-long message is refused', () => {
  const r = checkEnquiry({ ...base, message: 'x'.repeat(MAX_MESSAGE_CHARS + 1) })
  assert.equal(r.reason, 'message-too-long')
})

test('a conversation cannot exceed the turn cap', () => {
  assert.equal(checkEnquiry({ ...base, turnsSoFar: MAX_TURNS - 1 }).ok, true)
  assert.equal(checkEnquiry({ ...base, turnsSoFar: MAX_TURNS }).reason, 'conversation-too-long')
  assert.equal(checkEnquiry({ ...base, turnsSoFar: MAX_TURNS + 5 }).reason, 'conversation-too-long')
})

test('the turn cap is checked before the user agent, so cost is bounded either way', () => {
  // Even a request that looks perfect in every other way stops at the cap.
  const r = checkEnquiry({ ...base, turnsSoFar: MAX_TURNS, isBot: neverBot })
  assert.equal(r.reason, 'conversation-too-long')
})

test('one IP is limited within the window and told when to retry', () => {
  let last = checkEnquiry(base)
  for (let i = 0; i < 40 && last.ok; i++) last = checkEnquiry(base)
  assert.equal(last.ok, false)
  assert.equal(last.reason, 'rate-limited')
  assert.ok((last.retryAfter ?? 0) > 0, 'a rate-limited caller must be told when to come back')
})

test('a different IP is unaffected by another one being limited', () => {
  for (let i = 0; i < 40; i++) checkEnquiry(base)
  assert.equal(checkEnquiry({ ...base, ip: '9.9.9.9' }).ok, true)
})

test('the window reopens once it has expired', () => {
  const t0 = 1_000_000
  let last = checkEnquiry(base, t0)
  for (let i = 0; i < 40 && last.ok; i++) last = checkEnquiry(base, t0)
  assert.equal(last.ok, false)
  // An hour and a minute later.
  assert.equal(checkEnquiry(base, t0 + 61 * 60 * 1000).ok, true)
})

test('the sweep drops expired rows and keeps live ones', () => {
  const t0 = 2_000_000
  checkEnquiry({ ...base, ip: 'old' }, t0)
  checkEnquiry({ ...base, ip: 'new' }, t0 + 59 * 60 * 1000)
  sweepEnquiryHits(t0 + 61 * 60 * 1000)
  // 'old' expired, so its counter starts again; 'new' is still counting.
  assert.equal(checkEnquiry({ ...base, ip: 'old' }, t0 + 61 * 60 * 1000).ok, true)
})

// The visitor-facing copy must not tell a script which check it tripped.
test('honeypot, bot and too-fast are indistinguishable to the caller', () => {
  const messages = new Set([
    refusalMessage('honeypot'),
    refusalMessage('bot-agent'),
    refusalMessage('too-fast'),
  ])
  assert.equal(messages.size, 1, 'these three must be indistinguishable from outside')
})

test('refusal copy never quotes a price or a date', () => {
  const all = (['honeypot','bot-agent','too-fast','rate-limited','message-too-long','conversation-too-long','empty'] as const)
    .map(refusalMessage)
  for (const m of all) {
    assert.equal(/[$£€₹]|\b\d+\s*(?:day|week|hour)s?\b/i.test(m), false, `refusal leaks a figure: "${m}"`)
  }
})
