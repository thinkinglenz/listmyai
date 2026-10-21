// One chunk of the sitemap. See src/lib/seo/sitemap-data.ts for why.
//
// Filenames are core.xml, tools-N.xml, alternatives-N.xml and compare.xml,
// exactly as the index advertises them.
import {
  CHUNK, compareEntries, coreEntries, countActiveTools, fetchAllTools, fetchTools,
  renderUrlset, toolEntries, XML_HEADERS, type Entry,
} from '@/lib/seo/sitemap-data'

export const revalidate = 86400

const SLICE = /^(tools|alternatives)-(\d+)\.xml$/

async function entriesFor(file: string): Promise<Entry[] | null> {
  if (file === 'core.xml') return coreEntries()
  if (file === 'compare.xml') return compareEntries(await fetchAllTools())

  const m = SLICE.exec(file)
  if (!m) return null

  const prefix = m[1] as 'tools' | 'alternatives'
  const n = Number(m[2])
  // Chunks are 1-indexed in the URL. A request for a chunk past the end of
  // the catalogue is a 404, not an empty sitemap: an empty file would have
  // Google re-fetch nothing forever.
  if (!Number.isInteger(n) || n < 1) return null
  const offset = (n - 1) * CHUNK
  if (offset >= Math.max(1, await countActiveTools())) return null

  return toolEntries(await fetchTools(offset, CHUNK), prefix)
}

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params

  let entries: Entry[] | null
  try {
    entries = await entriesFor(file)
  } catch (e) {
    // The database is unreachable. This must be a 5xx, never a 404 or an
    // empty urlset: a 404 on a sitemap tells Google to drop it, and an empty
    // one tells Google the section is genuinely gone. Google retries a 5xx.
    console.error('[sitemap] chunk failed', file, e)
    return new Response('sitemap temporarily unavailable', { status: 503 })
  }

  if (!entries) return new Response('not found', { status: 404 })
  return new Response(renderUrlset(entries), { headers: XML_HEADERS })
}
