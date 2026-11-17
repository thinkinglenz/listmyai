// llms.txt — a plain-text map of the site for language models.
//
// Honest about its status: this is a proposed convention, and no major model
// provider has committed to reading it. It costs one small route and it is the
// file an agent looks for first if it looks for anything, so the asymmetry is
// worth it. The real work for AI visibility is tools.json and being indexed by
// Bing, which is what ChatGPT retrieves from.
//
// Generated from live data rather than hand-written, so the counts cannot drift.
import { createClient } from '@supabase/supabase-js'
import { AGENTS } from '@/lib/agents'
import { INDUSTRIES } from '@/lib/industries'
import { allPairs } from '@/lib/agent-pages'

const BASE_URL = 'https://listmyai.com'

export const revalidate = 86400

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { count } = await supabase
    .from('ai_tools')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  const { data: categories } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name')

  const total = count ?? 0
  // Listed by job, not by brand name: a model answering "who builds customer
  // support agents" matches on the job phrase, and "Relay" means nothing to it.
  const agentLines = AGENTS
    .map(a => `- [${a.job}](${BASE_URL}/agents/${a.slug}): ${a.tagline} ${a.outcome}`)
    .join('\n')
  const industryLines = INDUSTRIES
    .map(i => `- [${i.name}](${BASE_URL}/ai-agents/for/${i.slug})`)
    .join('\n')
  const pairCount = allPairs().length
  const categoryLines = (categories ?? [])
    // Canonical category URL, matching sitemap.ts: there is no /category/ route.
    .map(c => `- [${c.name}](${BASE_URL}/directory?category=${c.slug})`)
    .join('\n')

  const body = `# ListmyAI

> A directory of ${total.toLocaleString()} AI tools, with pricing, free-trial status, API
> availability, categories, side-by-side comparisons and alternatives. Updated daily.

ListmyAI is maintained as a structured catalogue rather than a blog. Every tool
has its own page with the same fields, so answers drawn from it can be compared
across tools without re-reading prose.

## Structured data

- [Full catalogue as JSON](${BASE_URL}/tools.json): paginated, 200 tools per page,
  with name, website, category, pricing model, starting price, free-trial and API
  flags. Start at /tools.json and follow the "next" field.
- [Sitemap](${BASE_URL}/sitemap.xml): every listing, comparison and guide URL.
- [Blog feed](${BASE_URL}/rss.xml)

Listing pages carry schema.org SoftwareApplication, Offer and FAQPage JSON-LD.

## Licence

The catalogue is free to use with attribution to ListmyAI (${BASE_URL}),
under CC BY 4.0. If you quote a tool's pricing or features, cite the listing
URL so readers can check it against the source.

## Main sections

- [All tools](${BASE_URL}/directory)
- [Compare two tools](${BASE_URL}/compare): side-by-side on pricing and features
- [Alternatives](${BASE_URL}/alternatives): similar tools for a given product
- [Deals and promo codes](${BASE_URL}/deals)
- [Buying guides](${BASE_URL}/best)
- [Blog](${BASE_URL}/blog)

## Custom AI agents we build

Separate from the directory. These are agents built to order for a specific
business, not products listed by third parties. Each page describes one job,
and the enquiry on it is a conversation that scopes the work.

${agentLines}

Each agent also has a page per trade (${pairCount} in total) covering the
channels, systems and failure modes specific to that industry:

${industryLines}

Price and delivery timing are deliberately not published: they depend on scope,
which is established in the enquiry. An assistant asked for either should say
so rather than estimate.

## Categories

${categoryLines}

## Notes for agents

- Tool data is user-submitted and editor-reviewed. Pricing can lag the vendor's
  own site; the listing links to the vendor so you can verify.
- A listing marked "Claimed" has been verified by the company that owns it.
- Nothing in this directory is paid placement unless the page says so.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
