import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classify, CATEGORY_IDS } from './classify-tool.ts'

test('classifies an obvious image tool', () => {
  const r = classify({ name: 'PixelForge', tagline: 'AI image generation from text prompts' })
  assert.equal(r.categoryName, 'Image Generation')
  assert.equal(r.categoryId, CATEGORY_IDS['Image Generation'])
  assert.equal(r.reason, 'confident')
})

test('classifies an invoice tool into Finance & Legal', () => {
  const r = classify({
    name: 'LedgerBot',
    tagline: 'Extracts invoice data and reconciles expenses automatically',
  })
  assert.equal(r.categoryName, 'Finance & Legal')
  assert.equal(r.reason, 'confident')
})

test('tells video apart from image', () => {
  const r = classify({ name: 'Reeler', tagline: 'Text-to-video generator for short-form reels' })
  assert.equal(r.categoryName, 'Video Generation')
})

test('tells voice apart from audio', () => {
  const r = classify({ name: 'Speakly', tagline: 'Voice cloning and text-to-speech for voiceover' })
  assert.equal(r.categoryName, 'Voice & Speech')
})

// The whole point of the exercise. A listing in "Other" is honestly
// unclassified; a listing moved into the wrong category is indistinguishable
// from a human decision, and nothing downstream can tell it was a guess.
test('refuses to choose when two categories are close', () => {
  const r = classify({
    name: 'Hybrid',
    tagline: 'AI image generation and video generation in one editor',
  })
  assert.equal(r.categoryId, null)
  assert.equal(r.reason, 'too-close')
})

test('refuses when nothing matches', () => {
  const r = classify({ name: 'Zorblat', tagline: 'The future, delivered differently' })
  assert.equal(r.categoryId, null)
  assert.equal(r.reason, 'no-signal')
})

test('refuses when there is no text to read', () => {
  const r = classify({ name: '', tagline: null, description: undefined })
  assert.equal(r.categoryId, null)
  assert.equal(r.reason, 'no-text')
})

test('a weak signal alone is never enough', () => {
  // "design" on its own is a weak hit, worth 1 against a minimum of 3.
  const r = classify({ name: 'Thing', tagline: 'a design' })
  assert.equal(r.categoryId, null)
})

test('never files anything INTO Other', () => {
  const samples = [
    { name: 'A', tagline: 'misc general purpose everything app' },
    { name: 'B', tagline: 'the tool for teams' },
    { name: 'C', tagline: 'something else entirely' },
  ]
  for (const s of samples) {
    assert.notEqual(classify(s).categoryId, CATEGORY_IDS.Other)
  }
})

test('reads tags and description, not just the tagline', () => {
  const r = classify({
    name: 'Untitled',
    tagline: '',
    description: 'Helps teams write and ship',
    tags: ['seo', 'backlink', 'keyword research'],
  })
  assert.equal(r.categoryName, 'SEO & Marketing')
})
