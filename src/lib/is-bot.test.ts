import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isBotAgent } from './is-bot.ts'

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

test('real browsers are never treated as bots', () => {
  assert.equal(isBotAgent(CHROME), false)
  assert.equal(isBotAgent(IPHONE), false)
})

test('the crawlers actually hitting this site are caught', () => {
  for (const ua of [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
    'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'facebookexternalhit/1.1',
    'curl/8.4.0',
    'python-requests/2.32.3',
  ]) {
    assert.equal(isBotAgent(ua), true, ua)
  }
})

test('a missing user agent counts as a bot', () => {
  assert.equal(isBotAgent(null), true)
  assert.equal(isBotAgent(''), true)
})
