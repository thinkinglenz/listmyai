import { test } from 'node:test'
import assert from 'node:assert/strict'
import { imageOutcome } from './image-outcome.ts'

test('an image still loading is pending', () => {
  assert.equal(imageOutcome({ complete: false, naturalWidth: 0 }), 'pending')
})

test('a finished image with real pixels is loaded', () => {
  assert.equal(imageOutcome({ complete: true, naturalWidth: 1200 }), 'loaded')
})

// The case that caused the stuck spinner: a cached 404 settles instantly,
// before hydration, so onError never runs.
test('a finished image with no width has failed, not pending', () => {
  assert.equal(imageOutcome({ complete: true, naturalWidth: 0 }), 'failed')
})

test('a missing ref is pending, never failed', () => {
  // Treating "no element yet" as a failure would flash the fallback on every
  // first render before the ref attaches.
  assert.equal(imageOutcome(null), 'pending')
  assert.equal(imageOutcome(undefined), 'pending')
})

// A browser can report complete:false with a width already known while a
// progressive image decodes. That is still in flight.
test('width without completion is still pending', () => {
  assert.equal(imageOutcome({ complete: false, naturalWidth: 800 }), 'pending')
})
