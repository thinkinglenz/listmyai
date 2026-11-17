import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AGENTS } from './agents.ts'
import { INDUSTRIES } from './industries.ts'
import {
  PAIRINGS, allPairs, getPair, pairSlug, agentsFor, industriesFor,
  pairTitle, pairDescription, pairIntro, pairStakes, pairIntegrations,
} from './agent-pages.ts'

test('every pairing names a real agent and a real industry', () => {
  const agentSlugs = new Set(AGENTS.map(a => a.slug))
  const industrySlugs = new Set(INDUSTRIES.map(i => i.slug))
  for (const [agent, industries] of Object.entries(PAIRINGS)) {
    assert.ok(agentSlugs.has(agent), `unknown agent in PAIRINGS: ${agent}`)
    for (const i of industries) {
      assert.ok(industrySlugs.has(i), `unknown industry for ${agent}: ${i}`)
    }
  }
})

test('every agent has pairings, and none are duplicated', () => {
  for (const a of AGENTS) {
    const list = PAIRINGS[a.slug]
    assert.ok(Array.isArray(list) && list.length > 0, `${a.slug} has no pairings`)
    assert.equal(new Set(list).size, list.length, `${a.slug} repeats an industry`)
  }
})

// The URL parser splits on "-for-". If a slug ever contains that sequence the
// split lands in the wrong place and the page 404s silently, so fail here
// instead of discovering it in a crawl report.
test('no slug contains the separator the URL parser splits on', () => {
  for (const a of AGENTS) assert.equal(a.slug.includes('-for-'), false, `agent slug: ${a.slug}`)
  for (const i of INDUSTRIES) assert.equal(i.slug.includes('-for-'), false, `industry slug: ${i.slug}`)
})

test('pair slugs round-trip back to the same pair', () => {
  for (const p of allPairs()) {
    const back = getPair(p.slug)
    assert.ok(back, `did not resolve: ${p.slug}`)
    assert.equal(back.agent.slug, p.agent.slug)
    assert.equal(back.industry.slug, p.industry.slug)
  }
})

test('a combination that is deliberately not offered does not resolve', () => {
  // Law firms do not hold stock. The exclusion must mean something, or every
  // cross-product URL becomes a live page about nothing.
  assert.equal(getPair('restock-for-legal'), undefined)
  assert.equal(getPair('relay-for-atlantis'), undefined)
  assert.equal(getPair('nonsense-for-clinics'), undefined)
  assert.equal(getPair('relay'), undefined)
  assert.equal(getPair(''), undefined)
})

test('pair slugs are unique and URL-safe', () => {
  const slugs = allPairs().map(p => p.slug)
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate pair slug')
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

test('the two directions of the map agree with each other', () => {
  for (const i of INDUSTRIES) {
    for (const a of agentsFor(i.slug)) {
      assert.ok(industriesFor(a.slug).some(x => x.slug === i.slug),
        `${a.slug}/${i.slug} appears in one direction only`)
    }
  }
})

// This is the whole justification for the page set. If the bodies are near
// duplicates, they are doorway pages whatever the URLs say.
test('no two pages share an intro, a title or a description', () => {
  const pairs = allPairs()
  for (const field of [pairTitle, pairDescription, pairIntro, pairStakes]) {
    const values = pairs.map(field)
    assert.equal(new Set(values).size, values.length,
      `${field.name} is not unique across the ${pairs.length} pages`)
  }
})

test('intros read as sentences, not as slug fragments', () => {
  for (const p of allPairs()) {
    const intro = pairIntro(p)
    assert.ok(intro.length > 120, `intro too thin for ${p.slug}`)
    assert.equal(intro.includes('-for-'), false, `slug leaked into copy: ${p.slug}`)
    assert.equal(/undefined|\[object/.test(intro), false, `broken interpolation: ${p.slug}`)
    // The first letter after any opening quote must be capitalised.
    assert.match(intro, /^[A-Z]/, `intro does not start with a capital: ${p.slug}`)
  }
})

test('a quoted pain is capitalised on its first letter, not its quote mark', () => {
  const p = getPair('relay-for-ecommerce')
  assert.ok(p)
  assert.ok(pairIntro(p).includes('"Where is my order"'),
    'the quoted phrase should be capitalised inside the quotes')
})

test('integrations merge both sources without case-duplicates', () => {
  for (const p of allPairs()) {
    const list = pairIntegrations(p)
    const lower = list.map(s => s.toLowerCase())
    assert.equal(new Set(lower).size, lower.length, `duplicate integration on ${p.slug}`)
    assert.ok(list.length >= 4, `too few integrations on ${p.slug}`)
  }
})

// The same content rules as the catalogue. These pages are public too.
test('composed copy never quotes a price or a delivery date', () => {
  const money = /[$£€₹]\s?\d|\b(?:aed|usd|gbp|eur|inr)\s?\d/i
  const timing = /\b(?:in|within|under|ready in|live in)\s+\d+\s*(?:hour|day|week|month)/i
  for (const p of allPairs()) {
    for (const s of [pairTitle(p), pairDescription(p), pairIntro(p), pairStakes(p)]) {
      assert.equal(money.test(s), false, `price in copy: "${s}"`)
      assert.equal(timing.test(s), false, `timing in copy: "${s}"`)
    }
  }
})

test('pairSlug builds what getPair expects', () => {
  assert.equal(pairSlug('relay', 'clinics'), 'relay-for-clinics')
  assert.equal(getPair(pairSlug('ledger', 'pharmacy'))?.agent.slug, 'ledger')
})

// `lower` exists because toLowerCase() flattens acronyms: "SaaS and software"
// became "saas and software" on every hub page for that trade. This checks the
// words are the same and that any capital AFTER the first character survives.
test('the mid-sentence industry name keeps its internal capitals', () => {
  for (const i of INDUSTRIES) {
    assert.equal(i.lower.toLowerCase(), i.name.toLowerCase(),
      `${i.slug}: lower is not the same words as name`)
    const internalCaps = i.name.slice(1).replace(/[^A-Z]/g, '')
    for (const c of internalCaps) {
      assert.ok(i.lower.includes(c),
        `${i.slug}: "${i.name}" lost the capital ${c} in "${i.lower}"`)
    }
  }
})

test('every industry profile is filled in, not left generic', () => {
  for (const i of INDUSTRIES) {
    assert.ok(i.pains.length >= 3, `${i.slug} has too few pains`)
    assert.ok(i.channels.length >= 3, `${i.slug} has too few channels`)
    assert.ok(i.systems.length >= 3, `${i.slug} has too few systems`)
    // "a workshop" or "an online shop" — both are correct, and an assertion
    // that only allowed "a " would be the test being wrong, not the copy.
    assert.match(i.one, /^an? /, `${i.slug}: "one" should read mid-sentence, got "${i.one}"`)
    assert.ok(i.stakes.length > 40, `${i.slug}: stakes is too vague to be useful`)
  }
})

// Two industries sharing a pain would make the pages that use it read alike.
test('industry pains are not copy-pasted between trades', () => {
  const seen = new Map<string, string>()
  for (const i of INDUSTRIES) {
    for (const pain of i.pains) {
      const prior = seen.get(pain)
      assert.equal(prior, undefined, `"${pain}" appears in both ${prior} and ${i.slug}`)
      seen.set(pain, i.slug)
    }
  }
})
