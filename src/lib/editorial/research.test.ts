// Guards the source matcher.
//
// Run: npm test
//
// This exists because of a real near-miss. The first matcher used a bare
// substring, and a search for "ZeroLog" returned five threads about
// "Zerologon" (a Windows CVE) and one about Uber's Go logging library. Those
// would have been published as independent coverage of a Swiss AI company and
// mailed to its founder. The cases below are that bug, frozen.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchKind, bareDomain } from './research.ts'

const hit = (over: Partial<Record<string, unknown>> = {}) => ({
  objectID: '1', title: null, story_title: null, comment_text: null,
  url: null, created_at: null, points: 1, ...over,
}) as Parameters<typeof matchKind>[0]

test('the tool\'s own domain is proof', () => {
  assert.equal(matchKind(hit({ url: 'https://zerolog.ch/docs' }), 'ZeroLog', 'zerolog.ch'), 'domain')
  assert.equal(matchKind(hit({ comment_text: 'tried zerolog.ch today' }), 'ZeroLog', 'zerolog.ch'), 'domain')
})

test('a longer name matches on a word boundary', () => {
  assert.equal(matchKind(hit({ title: 'New search at NameStation' }), 'NameStation', 'namestation.com'), 'name')
})

test('"zerolog" must never match "zerologon"', () => {
  assert.equal(matchKind(hit({ title: 'Zerologon: become domain admin' }), 'ZeroLog', 'zerolog.ch'), null)
  assert.equal(matchKind(hit({ title: "Microsoft: attackers exploiting 'ZeroLogon'" }), 'ZeroLog', 'zerolog.ch'), null)
})

test('a short name alone is never enough', () => {
  // Uber's Go logger is also called zerolog. Nothing but the domain separates
  // them, so a name-only hit on a short name is refused.
  assert.equal(matchKind(hit({ title: 'Uber Zap/Zerolog marshal methods' }), 'ZeroLog', 'zerolog.ch'), null)
  assert.equal(matchKind(hit({ title: 'Notion is great' }), 'Notion', null), null)
})

test('a name embedded in a longer word does not count', () => {
  assert.equal(matchKind(hit({ title: 'Copilotage is a French word' }), 'Copilot', null), null)
  assert.equal(matchKind(hit({ title: 'We use NameStationary' }), 'NameStation', null), null)
})

test('regex metacharacters in a name do not break the match', () => {
  assert.equal(matchKind(hit({ title: 'love C++ Helper here' }), 'C++ Helper', null), 'name')
  assert.equal(matchKind(hit({ title: 'anything at all' }), 'a.b.c.d.e', null), null)
})

test('bareDomain strips www and rejects nonsense', () => {
  assert.equal(bareDomain('https://www.Example.com/x'), 'example.com')
  assert.equal(bareDomain('not a url'), null)
  assert.equal(bareDomain(null), null)
})
