#!/usr/bin/env node
/**
 * One-shot Lemon Squeezy wiring.
 *
 * Lemon Squeezy's API cannot create stores or products, so those two steps stay
 * manual. Everything after them is automated here:
 *   1. find the store
 *   2. find the one-time and monthly variants
 *   3. create the webhook (with a freshly generated signing secret)
 *   4. push every key into Vercel production
 *
 * Secrets are never printed: only names and a masked tail.
 *
 * Usage:  LEMONSQUEEZY_API_KEY=... node scripts/lemonsqueezy-setup.mjs [--dry-run]
 */
import { randomBytes } from 'node:crypto'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, appendFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/** Repo root, so `vercel` targets this project whatever the caller's cwd is. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const API = 'https://api.lemonsqueezy.com/v1'
const WEBHOOK_URL = 'https://listmyai.com/api/webhooks/lemonsqueezy'
const EVENTS = ['order_created', 'order_refunded', 'subscription_created', 'subscription_cancelled', 'subscription_expired']
const DRY = process.argv.includes('--dry-run')

/**
 * The key comes from the environment, or failing that from the clipboard, so
 * the usual invocation is a bare `node scripts/lemonsqueezy-setup.mjs` with the
 * key copied from the Lemon Squeezy dashboard. It is never typed, echoed or
 * written to disk.
 */
function readKey() {
  const fromEnv = process.env.LEMONSQUEEZY_API_KEY?.trim()
  if (fromEnv) return fromEnv

  // Lemon Squeezy shows an API key once, so cache the first one we are handed
  // in .env.local (gitignored) rather than asking for the clipboard every time.
  const envFile = resolve(ROOT, '.env.local')
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('LEMONSQUEEZY_API_KEY='))
    const saved = line?.slice('LEMONSQUEEZY_API_KEY='.length).replace(/^["']|["']$/g, '').trim()
    if (saved) { console.log('Using the API key saved in .env.local.\n'); return saved }
  }
  try {
    const clip = execFileSync('pbpaste', { encoding: 'utf8' }).trim()
    if (clip && !/\s/.test(clip) && clip.length > 20) {
      appendFileSync(resolve(ROOT, '.env.local'), `\nLEMONSQUEEZY_API_KEY=${clip}\n`)
      console.log('Using the API key on your clipboard, and saved it to .env.local.\n')
      return clip
    }
    console.error(clip ? 'The clipboard does not look like an API key.' : 'The clipboard is empty.')
  } catch {
    console.error('Could not read the clipboard.')
  }
  console.error('Copy your Lemon Squeezy API key (Settings -> API) and run this again.')
  process.exit(1)
}

const key = readKey()

const mask = (v) => `${'*'.repeat(8)}${String(v).slice(-4)}`

async function ls(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      ...init.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = body?.errors?.[0]?.detail ?? res.statusText
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status}: ${detail}`)
  }
  return body
}

function vercel(args, stdin) {
  return new Promise((resolve) => {
    const p = spawn('npx', ['vercel', ...args], { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    p.stdout.on('data', (d) => { out += d })
    p.stderr.on('data', (d) => { out += d })
    if (stdin !== undefined) { p.stdin.write(stdin); p.stdin.end() }
    p.on('close', (code) => resolve({ code, out }))
  })
}

async function setEnv(name, value) {
  if (DRY) { console.log(`  would set ${name} = ${mask(value)}`); return }
  await vercel(['env', 'rm', name, 'production', '--yes'])          // ignore "not found"
  const { code, out } = await vercel(['env', 'add', name, 'production'], value)
  if (code !== 0) { console.log(`  ! ${name} failed: ${out.trim().split('\n').pop()}`); return }
  console.log(`  set ${name} = ${mask(value)}`)
}

// ── 1. store ────────────────────────────────────────────────────────────────
const stores = await ls('/stores')
if (!stores.data?.length) throw new Error('No store on this account yet. Create one at app.lemonsqueezy.com first.')
const store = stores.data[0]
console.log(`Store: ${store.attributes.name} (id ${store.id}), currency ${store.attributes.currency}`)

// `custom_price` is denominated in the store's currency, while packages.ts is
// written in US cents. A mismatch silently charges the wrong amount, so stop.
if (store.attributes.currency !== 'USD') {
  console.error(`\nStore currency is ${store.attributes.currency}, but the package catalogue is in USD.`)
  console.error('A $39 package would charge 3900 minor units of ' + store.attributes.currency + ' instead.')
  console.error('Fix: Lemon Squeezy -> Settings -> Store -> Currency -> USD, then re-run.')
  process.exit(1)
}
if (stores.data.length > 1) console.log(`  note: ${stores.data.length} stores found, using the first`)

// ── 2. variants ─────────────────────────────────────────────────────────────
const products = await ls(`/products?filter[store_id]=${store.id}`)
if (!products.data?.length) throw new Error('No products in the store. Create the two placeholder products first.')

const variants = []
for (const prod of products.data) {
  const vs = await ls(`/variants?filter[product_id]=${prod.id}`)
  for (const v of vs.data ?? []) {
    // `interval` carries a meaningless default on one-time variants, so
    // `is_subscription` is the field that actually decides the billing type.
    variants.push({
      id: v.id, product: prod.attributes.name, name: v.attributes.name,
      sub: v.attributes.is_subscription, interval: v.attributes.interval,
      count: v.attributes.interval_count, status: v.attributes.status,
    })
  }
}
console.log('\nVariants found:')
for (const v of variants) console.log(`  ${v.id}  ${v.product} / ${v.name}  ${v.sub ? `every ${v.count > 1 ? v.count + ' ' : ''}${v.interval}` : 'one-time'}  [${v.status}]`)

const usable = variants.filter((v) => v.status !== 'draft')
const oneTime = usable.find((v) => !v.sub)
const monthly = usable.find((v) => v.sub && v.interval === 'month' && v.count === 1)
if (!oneTime) throw new Error('No one-time variant found. One product must be a one-time payment.')
if (!monthly) throw new Error('No monthly subscription variant found. Set the monthly product to Subscription, billed every 1 month.')
console.log(`\nUsing one-time variant ${oneTime.id}, monthly variant ${monthly.id}`)

// ── 3. webhook ──────────────────────────────────────────────────────────────
const existing = await ls(`/webhooks?filter[store_id]=${store.id}`)
const already = (existing.data ?? []).find((w) => w.attributes.url === WEBHOOK_URL)
let secret = randomBytes(20).toString('hex')  // Lemon Squeezy caps the secret at 40 chars

if (already && !DRY) {
  await ls(`/webhooks/${already.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ data: { type: 'webhooks', id: String(already.id), attributes: { url: WEBHOOK_URL, events: EVENTS, secret } } }),
  })
  console.log(`\nWebhook ${already.id} updated -> ${WEBHOOK_URL}`)
} else if (!DRY) {
  const made = await ls('/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'webhooks',
        attributes: { url: WEBHOOK_URL, events: EVENTS, secret },
        relationships: { store: { data: { type: 'stores', id: String(store.id) } } },
      },
    }),
  })
  console.log(`\nWebhook ${made.data.id} created -> ${WEBHOOK_URL}`)
} else {
  console.log(`\nwould ${already ? 'update' : 'create'} webhook -> ${WEBHOOK_URL}`)
}
console.log(`  events: ${EVENTS.join(', ')}`)

// ── 4. Vercel ───────────────────────────────────────────────────────────────
console.log('\nWriting Vercel production env:')
await setEnv('LEMONSQUEEZY_API_KEY', key)
await setEnv('LEMONSQUEEZY_STORE_ID', store.id)
await setEnv('LEMONSQUEEZY_WEBHOOK_SECRET', secret)
await setEnv('LEMONSQUEEZY_VARIANT_ONETIME', oneTime.id)
await setEnv('LEMONSQUEEZY_VARIANT_MONTHLY', monthly.id)

console.log(DRY ? '\nDry run, nothing changed.' : '\nDone. Redeploy for the new env to take effect.')
