import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageSpec, pageSlice, DEFAULT_PER_PAGE, MAX_PER_PAGE } from './paginate.ts'

test('the first page starts at zero and is inclusive at both ends', () => {
  const s = pageSpec(1, 25, 200)
  assert.deepEqual([s.from, s.to], [0, 24])
  assert.equal(s.totalPages, 8)
})

test('consecutive pages are contiguous and never skip or repeat a row', () => {
  const total = 97, perPage = 25
  const seen: number[] = []
  for (let p = 1; p <= pageSpec(1, perPage, total).totalPages; p++) {
    const s = pageSpec(p, perPage, total)
    for (let i = s.from; i <= Math.min(s.to, total - 1); i++) seen.push(i)
  }
  assert.deepEqual(seen, Array.from({ length: total }, (_, i) => i),
    'every row index must appear exactly once across the pages')
})

test('a page beyond the end is clamped to the last page, not left empty', () => {
  const s = pageSpec(999, 25, 60)
  assert.equal(s.page, 3)
  assert.equal(s.from, 50)
})

test('page zero and negatives clamp to the first page', () => {
  for (const bad of [0, -1, -999]) assert.equal(pageSpec(bad, 25, 100).page, 1)
})

test('junk input falls back rather than producing NaN bounds', () => {
  for (const bad of [undefined, null, '', 'abc', {}, NaN, Infinity]) {
    const s = pageSpec(bad, bad, 100)
    assert.equal(Number.isFinite(s.from), true, `from is not finite for ${String(bad)}`)
    assert.equal(Number.isFinite(s.to), true, `to is not finite for ${String(bad)}`)
    assert.equal(s.page, 1)
    assert.equal(s.perPage, DEFAULT_PER_PAGE)
  }
})

test('perPage is capped so one request cannot ask for the whole table', () => {
  assert.equal(pageSpec(1, 10_000, 50_000).perPage, MAX_PER_PAGE)
  assert.equal(pageSpec(1, 0, 100).perPage, 1)
})

test('a string page from a query string works', () => {
  const s = pageSpec('3', '10', 100)
  assert.equal(s.page, 3)
  assert.deepEqual([s.from, s.to], [20, 29])
})

test('an empty table reports one page, not zero', () => {
  const s = pageSpec(1, 25, 0)
  assert.equal(s.totalPages, 1)
  assert.equal(s.page, 1)
})

test('an unknown total trusts the page and claims no page count', () => {
  const s = pageSpec(4, 25, null)
  assert.equal(s.page, 4)
  assert.equal(s.from, 75)
  assert.equal(s.totalPages, 1, 'a guessed page count would be a lie')
})

test('pageSlice matches the spec it was given', () => {
  const rows = Array.from({ length: 30 }, (_, i) => i)
  assert.deepEqual(pageSlice(rows, pageSpec(2, 10, 30)), [10,11,12,13,14,15,16,17,18,19])
  assert.deepEqual(pageSlice(rows, pageSpec(3, 10, 30)), [20,21,22,23,24,25,26,27,28,29])
  assert.deepEqual(pageSlice(rows, pageSpec(4, 10, 30)).length, 10, 'clamped to the last page')
})
