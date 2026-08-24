import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://listmyai.com'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Supabase caps a response at 1,000 rows regardless of .limit(), so the
  // previous single query silently returned 1,000 of ~19,000 active tools and
  // the other 18,000 tool pages were never advertised to Google at all. Page
  // through explicitly.
  //
  // Headroom note: ~19k tools produce ~19k tool pages plus ~19k alternatives
  // pages, which with everything else lands near 40,000 against Google's
  // 50,000-per-file limit. If the catalogue grows much beyond ~24k tools this
  // has to become a sitemap index (generateSitemaps), which changes the URLs
  // to /sitemap/0.xml and needs resubmitting in Search Console.
  const PAGE = 1000
  const MAX_TOOLS = 22_000

  type ToolRow = {
    slug: string
    updated_at: string | null
    created_at: string
    category_id: string | null
    upvotes: number | null
    view_count: number | null
    description: string | null
  }

  const tools: ToolRow[] = []
  for (let from = 0; from < MAX_TOOLS; from += PAGE) {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('slug, updated_at, created_at, category_id, upvotes, view_count, description')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)

    if (error || !data || data.length === 0) break
    tools.push(...(data as ToolRow[]))
    if (data.length < PAGE) break // last page
  }

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')

  // Fetch published blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1000)

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/directory`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/trending`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/deals`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/blog`,               lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/categories`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/compare`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/find`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/submit`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/advertise`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/pricing`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/courses`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE_URL}/terms`,              lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/privacy-policy`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/disclaimer`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/dmca`,               lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/refund-policy`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = tools.map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: new Date(tool.updated_at ?? tool.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(p => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    // The blog is the growth surface, so it outranks everything but the home page.
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map(cat => ({
    url: `${BASE_URL}/directory?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Alternatives pages (one per tool)
  const alternativesPages: MetadataRoute.Sitemap = tools.map(tool => ({
    url: `${BASE_URL}/alternatives/${tool.slug}`,
    lastModified: new Date(tool.updated_at ?? tool.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Comparison pages.
  //
  // Pairing every tool with every other in its category is O(n^2): 1,000 active
  // tools produced 61,277 URLs, which pushed the sitemap past Google's 50,000
  // limit and buried the blog at the very end where it was never crawled. That
  // volume of near-identical auto-generated pages is also what Google's scaled
  // content abuse policy targets.
  //
  // So pair only the strongest tools in each category. The pages themselves all
  // still work and stay reachable by links; this only decides what we actively
  // put in front of Google.
  const COMPARABLE_PER_CATEGORY = 15 // 15 tools -> 105 pairs per category

  const toolsByCategory = new Map<string | number | null, NonNullable<typeof tools>>()
  ;tools.forEach(tool => {
    const key = tool.category_id ?? null
    if (!toolsByCategory.has(key)) toolsByCategory.set(key, [])
    toolsByCategory.get(key)!.push(tool)
  })

  // A comparison is only worth showing when both sides have something to
  // compare, so rank on real interest and require a description.
  const score = (t: { upvotes?: number | null; view_count?: number | null }) =>
    (t.upvotes ?? 0) * 10 + (t.view_count ?? 0)

  const comparisonPages: MetadataRoute.Sitemap = []
  toolsByCategory.forEach(categoryTools => {
    if (!categoryTools) return
    const ranked = categoryTools
      .filter(t => (t.description ?? '').trim().length > 60)
      .sort((a, b) => score(b) - score(a))
      .slice(0, COMPARABLE_PER_CATEGORY)

    for (let i = 0; i < ranked.length; i++) {
      for (let j = i + 1; j < ranked.length; j++) {
        comparisonPages.push({
          url: `${BASE_URL}/compare/${ranked[i].slug}-vs-${ranked[j].slug}`,
          lastModified: new Date(
            Math.max(
              new Date(ranked[i].updated_at ?? ranked[i].created_at).getTime(),
              new Date(ranked[j].updated_at ?? ranked[j].created_at).getTime()
            )
          ),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        })
      }
    }
  })

  // Use-case pages
  const useCaseSlugs = [
    'writing', 'image-generation', 'video-creation', 'coding', 'chatbots',
    'marketing', 'music-audio', 'design', 'productivity', 'research',
    'education', 'email-marketing', 'customer-support', 'data-analysis',
    'presentation', 'summarization', 'translation', 'legal',
  ]
  const useCasePages: MetadataRoute.Sitemap = useCaseSlugs.map(slug => ({
    url: `${BASE_URL}/use-case/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    // Blog posts lead the file. Crawlers work top-down, and these were
    // previously last of 63,392 URLs, so they were never reached.
    ...blogPages,
    ...staticPages,
    { url: `${BASE_URL}/alternatives`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/use-case`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...categoryPages,
    ...useCasePages,
    ...toolPages,
    ...alternativesPages,
    ...comparisonPages,
  ]
}
