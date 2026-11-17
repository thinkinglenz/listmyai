import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AGENTS, CUSTOM_INTAKE, getAgent, jobKeyMap, jobKeySlug, jobPhrase } from './agents.ts'

// The three rules in the module header are comments, and comments do not stop
// anyone. These tests do. A price or a delivery date on a public page sets the
// ceiling for every negotiation that follows it, so the build should fail
// rather than let one through.

// The custom intake is public copy too, so the price/date/phone rules cover it.
const everyString = (): string[] =>
  [...AGENTS, CUSTOM_INTAKE].flatMap(a => [
    a.name, a.job, a.tagline, a.problem, a.outcome,
    ...a.features, ...a.worksWith, ...a.jobKeys, ...a.industries, ...a.intakeFocus,
  ])

// A guard that fires on the word "cost" flags "what a wrong number would cost"
// and gets deleted by whoever hits it next. These match FIGURES and the
// phrases that introduce one, which is what the rule is actually about.
const PRICE_PATTERNS = [
  /[$£€₹]\s?\d/,                                        // $50, ₹2000
  /\b(?:aed|usd|gbp|eur|inr|dhs)\s?\d/i,                // AED 500
  /\b\d+\s?(?:k|aed|usd|gbp|eur|inr)\b/i,               // 5k, 500 AED
  /\b(?:price|pricing|cost|costs|fee|fees|rate|rates)\b[^.]{0,20}\d/i, // "fee of 300"
  // Recurring pricing needs a FIGURE beside it: "$499 per month" is a price,
  // "how many arrive per month" is a volume question.
  /(?:[$£€₹]\s?\d[\d,.]*|\b\d[\d,.]*)\s*(?:\/|per\s)(?:month|year|seat|user|licence|license)\b/i,
  /\b(?:starting at|starts at|from only|as low as|budget from)\b/i,
]

test('no price appears anywhere in the catalogue', () => {
  for (const s of everyString()) {
    for (const pattern of PRICE_PATTERNS) {
      assert.equal(pattern.test(s), false, `price-like text (${pattern}): "${s}"`)
    }
  }
})

// The guard has to still catch a real price, or it is decoration.
test('the price guard catches an actual price', () => {
  const offenders = ['From $499 per month', 'AED 2500 setup', 'starting at 5k', 'a fee of 300 applies']
  for (const bad of offenders) {
    assert.ok(PRICE_PATTERNS.some(p => p.test(bad)), `guard missed: "${bad}"`)
  }
  // ...and not fire on ordinary English.
  for (const fine of ['What a wrong number would cost, and who should check it', 'Rates of change are explained']) {
    assert.equal(PRICE_PATTERNS.some(p => p.test(fine)), false, `false positive: "${fine}"`)
  }
})

test('no delivery date or turnaround promise appears', () => {
  const timing = /\b(?:in|within|under|takes?|ready in|delivered in|live in|setup in)\s+\d+\s*(?:hour|day|week|month)/i
  const vague = /\b(?:same.day|next.day|overnight delivery|by (?:monday|friday)|turnaround)\b/i
  for (const s of everyString()) {
    assert.equal(timing.test(s), false, `timing promise: "${s}"`)
    assert.equal(vague.test(s), false, `timing promise: "${s}"`)
  }
})

test('no phone number appears', () => {
  // Any run of 7+ digits, with or without separators, and the +country form.
  const phone = /\+\d[\d\s().-]{6,}|\b\d[\d\s().-]{6,}\d\b/
  for (const s of everyString()) {
    assert.equal(phone.test(s), false, `phone-like text: "${s}"`)
  }
})

test('slugs are unique and URL-safe', () => {
  const seen = new Set<string>()
  for (const a of AGENTS) {
    assert.match(a.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `bad slug: ${a.slug}`)
    assert.equal(seen.has(a.slug), false, `duplicate slug: ${a.slug}`)
    seen.add(a.slug)
  }
})

// Two agents claiming the same search phrase would mean two pages competing
// for one query — the duplicate-content problem the job-keyed map exists to
// avoid.
test('no job key is claimed by two agents', () => {
  const owner = new Map<string, string>()
  for (const { key, slug } of jobKeyMap()) {
    const previous = owner.get(key)
    assert.equal(previous, undefined, `"${key}" claimed by both ${previous} and ${slug}`)
    owner.set(key, slug)
  }
})

test('job key slugs survive the round trip and stay distinct', () => {
  const slugs = jobKeyMap().map(j => jobKeySlug(j.key))
  assert.equal(new Set(slugs).size, slugs.length, 'two job keys collapse to the same URL')
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

test('every agent carries enough to fill a page', () => {
  for (const a of AGENTS) {
    assert.ok(a.features.length >= 4, `${a.slug} has too few features`)
    assert.ok(a.jobKeys.length >= 4, `${a.slug} has too few job keys`)
    assert.ok(a.intakeFocus.length >= 4, `${a.slug} has too little intake guidance`)
    assert.match(a.accent, /^#[0-9a-f]{6}$/i, `${a.slug} accent is not a hex colour`)
    assert.ok(a.job.toLowerCase().includes('agent'), `${a.slug} job heading is not job-keyed`)
  }
})

test('getAgent finds a real one and refuses an invented one', () => {
  assert.equal(getAgent('relay')?.name, 'Relay')
  assert.equal(getAgent('does-not-exist'), undefined)
})

test('the mid-sentence job phrase keeps the AI acronym capitalised', () => {
  for (const a of AGENTS) {
    const phrase = jobPhrase(a)
    assert.ok(phrase.startsWith('AI '), `${a.slug}: "${phrase}" lost the acronym`)
    // Same words as the heading, only the case differs.
    assert.equal(phrase.toLowerCase(), a.job.toLowerCase(), `${a.slug}: phrase is not the job`)
    // No stray capitals mid-phrase, which would read as a brand name again.
    assert.equal(phrase.slice(3), phrase.slice(3).toLowerCase(), `${a.slug}: "${phrase}" still has capitals`)
  }
})

test('the job phrase always follows "an" correctly', () => {
  // Every job starts with "AI", which takes "an". If a job is ever added that
  // does not, the copy that writes "an {phrase}" becomes wrong.
  for (const a of AGENTS) assert.match(jobPhrase(a), /^AI /, `${a.slug} would read "a AI..."`)
})

test('the custom intake resolves for the enquiry API but is not in the catalogue', () => {
  assert.equal(getAgent('custom')?.slug, 'custom')
  assert.equal(AGENTS.some(a => a.slug === 'custom'), false,
    'the custom intake must not appear as a thirteenth card')
})
