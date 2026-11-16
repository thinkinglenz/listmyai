import { test } from 'node:test'
import assert from 'node:assert/strict'
import { categoryName } from './category-name.ts'

// The exact shape PostgREST returns for `select('..., categories(name)')`.
// This is the case the owner dashboard got wrong: it read `.name` off the
// array, got undefined, and rendered the literal string 'Other'.
test('unwraps the array shape PostgREST actually returns', () => {
  assert.equal(categoryName([{ name: 'Code Assistant' }]), 'Code Assistant')
})

test('still handles a plain object, in case the relation resolves to-one', () => {
  assert.equal(categoryName({ name: 'Code Assistant' }), 'Code Assistant')
})

// A listing genuinely filed under the real "Other" category must still read
// 'Other' — the fix must not swing the other way and hide a legitimate value.
test('a real Other category is reported, not swallowed', () => {
  assert.equal(categoryName([{ name: 'Other' }]), 'Other')
})

test('unreadable categories return undefined, never an invented label', () => {
  for (const input of [null, undefined, [], [null], [{}], {}, [{ name: null }], [{ name: '' }], [{ name: '   ' }]]) {
    assert.equal(categoryName(input as Parameters<typeof categoryName>[0]), undefined, JSON.stringify(input))
  }
})
