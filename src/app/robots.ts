import type { MetadataRoute } from 'next'

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
        // Canonical path pages (/best, /tools, /compare, /directory) stay crawlable.
        disallow: ['/admin/', '/admin-reset', '/api/', '/auth/', '/dashboard/', '/reset-password', '/*?'],
      },
      {
        // Allow AI crawlers explicitly, but keep them off the faceted/dynamic URLs.
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'Anthropic-ai', 'ClaudeBot', 'Bytespider', 'CCBot', 'PerplexityBot'],
        allow: '/',
        disallow: ['/admin/', '/api/', '/*?'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
