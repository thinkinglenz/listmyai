#!/usr/bin/env node
import { readFileSync } from 'fs'

const API = 'https://listmyai.com/api/tools/import-batch'
const SECRET = 'lmai@admin2026'
const BATCH_SIZE = 200
const DELAY_MS = 2000

function handleToName(handle) {
  return handle
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function main() {
  const raw = JSON.parse(readFileSync(new URL('./ai-tools-19k.json', import.meta.url), 'utf-8'))
  console.log(`Loaded ${raw.length} tools from dataset`)

  // Filter out entries with invalid/missing websites
  const tools = raw
    .filter(t => t.website && t.website.startsWith('http'))
    .map(t => ({
      name: handleToName(t.handle),
      website: t.website,
      description: t.description || '',
      tagline: (t.description || '').split(/[.!?]/)[0].slice(0, 120) || handleToName(t.handle),
    }))

  console.log(`${tools.length} tools with valid websites`)

  let totalImported = 0, totalSkipped = 0, totalErrors = 0
  const batches = Math.ceil(tools.length / BATCH_SIZE)

  for (let i = 0; i < batches; i++) {
    const batch = tools.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    const batchNum = i + 1

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': SECRET },
        body: JSON.stringify({ secret: SECRET, tools: batch }),
      })

      const data = await res.json()
      totalImported += data.imported ?? 0
      totalSkipped += data.skipped ?? 0
      totalErrors += (data.errors?.length ?? 0)

      console.log(
        `Batch ${batchNum}/${batches}: +${data.imported ?? 0} imported, ${data.skipped ?? 0} skipped` +
        (data.errors?.length ? `, ${data.errors.length} errors` : '') +
        ` | Total: ${totalImported} imported`
      )

      if (data.errors?.length) {
        console.log(`  Errors: ${data.errors.slice(0, 3).join('; ')}`)
      }
    } catch (err) {
      console.error(`Batch ${batchNum} FAILED:`, err.message)
      totalErrors++
    }

    // Rate limit
    if (i < batches - 1) await new Promise(r => setTimeout(r, DELAY_MS))
  }

  console.log(`\nDone! Imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`)
}

main().catch(console.error)
