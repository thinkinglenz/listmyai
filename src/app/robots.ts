import type { MetadataRoute } from 'next'

// A crawler obeys exactly ONE group: the most specific one that names it.
// So a named group does not add to the '*' rules, it replaces them — every
// group below repeats the disallow list deliberately. Dropping a line from one
// of them reopens the faceted URLs for that crawler only, which is the kind of
// mistake that shows up weeks later as a function bill.
const BLOCKED = ['/admin/', '/admin-reset', '/api/', '/auth/', '/dashboard/', '/reset-password', '/*?']

// Narrower list for crawlers that have no business in the signed-in area but
// where the private paths are already unreachable without a session.
const BLOCKED_AI = ['/admin/', '/api/', '/*?']

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://listmyai.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // '/*?' blocks every query-string URL (the /directory filter facets:
        // ?category=&pricing=&sort=…). Those are force-dynamic and have no unique
        // SEO value, but crawlers were following every combination and running a
        // live DB render each time — the bulk of our function/Fluid-CPU cost.
        // Canonical path pages (/best, /tools, /compare, /directory, /agents,
        // /ai-agents) stay crawlable.
        disallow: BLOCKED,
      },
      {
        // Bing, named explicitly. It would be covered by '*' anyway, but a
        // named group is where crawl-delay and any future Bing-only rule has
        // to live, and it makes the intent legible.
        userAgent: ['Bingbot', 'msnbot', 'AdIdxBot'],
        allow: '/',
        disallow: BLOCKED,
      },
      {
        // Search-answer and training crawlers. Allowed on purpose: these pages
        // exist to be quoted by assistants, and a block here removes us from
        // answers without removing us from anyone's index.
        userAgent: [
          'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
          'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Anthropic-ai',
          'PerplexityBot', 'Perplexity-User',
          'Google-Extended', 'Applebot', 'Applebot-Extended',
          'meta-externalagent', 'Amazonbot', 'Bytespider', 'CCBot',
          'cohere-ai', 'YouBot', 'DuckAssistBot', 'MistralAI-User',
        ],
        allow: '/',
        disallow: BLOCKED_AI,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
