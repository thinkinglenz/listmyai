import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractContact } from './enquiry-contact.ts'

const user = (content: string) => ({ role: 'user' as const, content })
const model = (content: string) => ({ role: 'model' as const, content })

test('finds an address stated in a sentence', () => {
  const c = extractContact([user('My name is Sam Okafor and the email is sam@acme.co.uk.')])
  assert.equal(c.email, 'sam@acme.co.uk')
  assert.equal(c.name, 'Sam Okafor')
})

test('a trailing full stop is not part of the address', () => {
  assert.equal(extractContact([user('Reach me at jo@example.com.')]).email, 'jo@example.com')
})

test('the address is lower-cased so it matches however it was typed', () => {
  assert.equal(extractContact([user('Write to Sam@ACME.com')]).email, 'sam@acme.com')
})

// A visitor who corrects themselves means the later address.
test('a corrected address wins over the first one', () => {
  const c = extractContact([
    user('email is old@personal.com'),
    user('actually use my work one, new@company.com'),
  ])
  assert.equal(c.email, 'new@company.com')
})

// The assistant echoes addresses back; that is not the visitor stating one.
test('only the visitor is searched, never the assistant', () => {
  const c = extractContact([
    model('Shall I use assistant-made-up@wrong.com for you?'),
    user('We run a clinic in Leeds.'),
  ])
  assert.equal(c.email, null)
})

test('"I am looking for" does not become a name', () => {
  for (const phrase of [
    "I'm looking for something to handle bookings",
    "I'm just checking what this costs",
    "I'm not sure yet",
    "I'm interested in the support one",
  ]) {
    assert.equal(extractContact([user(phrase)]).name, null, phrase)
  }
})

test('a whole sentence is never returned as a name', () => {
  const c = extractContact([user('My name is the person who handles all of our inbound enquiries here')])
  assert.equal(c.name, null)
})

test('several phrasings for a name all work', () => {
  assert.equal(extractContact([user('My name is Priya')]).name, 'Priya')
  assert.equal(extractContact([user("I'm Daniel Reyes")]).name, 'Daniel Reyes')
  // "from Northside Dental" is where they work, not part of their name.
  assert.equal(extractContact([user('This is Aisha from Northside Dental')]).name, 'Aisha')
  assert.equal(extractContact([user('You can call me Mo')]).name, 'Mo')
})

test('nothing found returns nulls rather than guesses', () => {
  const c = extractContact([user('We get about forty messages a day and it is too many.')])
  assert.equal(c.email, null)
  assert.equal(c.name, null)
})

test('an empty or malformed transcript does not throw', () => {
  assert.deepEqual(extractContact([]), { email: null, name: null })
  // Content that is not a string can arrive from a malformed client payload.
  const odd = [{ role: 'user' as const, content: undefined as unknown as string }]
  assert.doesNotThrow(() => extractContact(odd))
})
