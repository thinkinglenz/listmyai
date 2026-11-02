// Guards the parts of enrichment that touch the open internet or the page.
//
// Run: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPublicHttpUrl, githubReposIn, pageText, cleanKeywords, withRelatedSection } from './enrich.ts'

test('a listing cannot point the server at itself or its network', () => {
  for (const bad of [
    'http://localhost:3000', 'http://127.0.0.1', 'http://10.0.0.5', 'http://192.168.1.1',
    'http://172.20.0.1', 'http://169.254.169.254/latest/meta-data', 'http://[::1]/', 'ftp://example.com',
    'http://intranet', 'http://printer.local', 'javascript:alert(1)', 'not a url', '',
  ]) assert.equal(isPublicHttpUrl(bad), null, bad)
})

test('ordinary public sites are allowed', () => {
  assert.ok(isPublicHttpUrl('https://zerolog.ch/pricing'))
  assert.ok(isPublicHttpUrl('http://example.com'))
  assert.ok(isPublicHttpUrl('https://172.15.0.1'), 'outside the private 172.16-31 range')
})

test('repo links are read from hrefs, and github site chrome is ignored', () => {
  const html = `<a href="https://github.com/acme/widget">x</a>
    <a href="https://github.com/sponsors/acme">y</a>
    <a href="https://github.com/acme/widget/issues">z</a>
    <a href="https://github.com/other/tool.git?x=1">w</a>`
  assert.deepEqual(githubReposIn(html), ['acme/widget', 'other/tool'])
})

test('page text drops scripts, styles and markup', () => {
  const t = pageText('<style>a{}</style><script>evil()</script><h1>Plans &amp; pricing</h1><p>Free tier</p>')
  assert.equal(t, 'Plans & pricing Free tier')
})

test('keywords are lowercased, de-duplicated and capped', () => {
  const k = cleanKeywords(['AI Drone Tuning', 'ai drone tuning', 'x', 5, ...Array.from({ length: 12 }, (_, i) => `keyword ${i}`)])
  assert.equal(k[0], 'ai drone tuning')
  assert.equal(k.length, 8)
  assert.deepEqual(cleanKeywords('nope'), [])
})

test('the related section is replaced, never doubled', () => {
  const once = withRelatedSection('Body', '### More on ListmyAI\n\n- a')
  const twice = withRelatedSection(once, '### More on ListmyAI\n\n- b')
  assert.equal(twice.match(/More on ListmyAI/g)?.length, 1)
  assert.ok(twice.includes('- b') && !twice.includes('- a'))
})
