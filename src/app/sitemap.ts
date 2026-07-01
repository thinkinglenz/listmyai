import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://listmyai.com'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all active tools
  const { data: tools } = await supabase
    .from('ai_tools')
    .select('slug, updated_at, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50000)

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
  const toolPages: MetadataRoute.Sitemap = (tools ?? []).map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: new Date(tool.updated_at ?? tool.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(p => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map(cat => ({
    url: `${BASE_URL}/directory?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Alternatives pages (one per tool)
  const alternativesPages: MetadataRoute.Sitemap = (tools ?? []).map(tool => ({
    url: `${BASE_URL}/alternatives/${tool.slug}`,
    lastModified: new Date(tool.updated_at ?? tool.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

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
    ...staticPages,
    { url: `${BASE_URL}/alternatives`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${BASE_URL}/use-case`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...toolPages,
    ...alternativesPages,
    ...blogPages,
    ...categoryPages,
    ...useCasePages,
  ]
}
