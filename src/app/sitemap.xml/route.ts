// The sitemap index.
//
// Deliberately still at /sitemap.xml: that is the URL in robots.txt and the
// one already submitted in Search Console. A sitemap index is valid at any
// URL, so Google follows it to the chunks with nothing to resubmit. Next's
// generateSitemaps would instead have moved everything to /sitemap/0.xml.
import { chunkFiles, countActiveTools, renderIndex, XML_HEADERS } from '@/lib/seo/sitemap-data'

export const revalidate = 86400

export async function GET() {
  // If the count cannot be read, serve the index with a single chunk rather
  // than failing: core.xml alone still gets the blog and editorials crawled,
  // and an index that 500s tells Google nothing at all.
  let count = 0
  try {
    count = await countActiveTools()
  } catch (e) {
    console.warn('[sitemap] could not count tools, serving a minimal index', e)
  }
  return new Response(renderIndex(chunkFiles(count)), { headers: XML_HEADERS })
}
