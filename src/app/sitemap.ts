import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://listmyai.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all active tools
  const { data: tools } = await supabase
    .from('ai_tools')
    .select('slug, updated_at, created_at')
    .in('status', ['active', 'approved', 'claimed', 'verified'])
    .order('created_at', { ascending: false })

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/find`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = (tools ?? []).map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: new Date(tool.updated_at ?? tool.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map(cat => ({
    url: `${BASE_URL}/directory?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...toolPages, ...categoryPages]
}
