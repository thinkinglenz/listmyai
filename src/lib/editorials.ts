// Editorials: one long-form piece per listing, written from sources outside
// the vendor's own marketing.
//
// Distinct from /blog, which is topic-led and auto-generated daily. An
// editorial is about one product, cites third-party discussion, and states
// plainly when it found none — that last part matters, because most small
// tools have no independent coverage at all and inventing some is the failure
// mode this whole section exists to avoid.
//
// Owners can suggest corrections; they cannot edit the text. A page a vendor
// can rewrite is vendor copy, and nobody links to vendor copy.
import { createClient } from '@supabase/supabase-js'

export const EDITORIAL_BASE = 'https://listmyai.com/editorial'

/** A third-party reference cited in the body. */
export interface EditorialSource {
  label: string
  url: string
  /** hacker-news | product-hunt | youtube | github | app-store | web */
  kind?: string
  published?: string | null
}

export interface Editorial {
  id: string
  tool_id: string | null
  slug: string
  title: string
  standfirst: string | null
  body_md: string
  sources: EditorialSource[]
  coverage_note: string | null
  status: string
  published_at: string | null
}

/**
 * Thrown when the database cannot be reached, as opposed to a slug with no
 * editorial. The page must render a 5xx for the first and a 404 for the
 * second: a failed query that 404s tells Google to deindex the page.
 */
export class EditorialSourceUnavailable extends Error {}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getEditorial(slug: string): Promise<Editorial | null> {
  const { data, error } = await db()
    .from('editorials')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw new EditorialSourceUnavailable(error.message)
  return (data as Editorial) ?? null
}

export async function listEditorials(limit = 50): Promise<Editorial[]> {
  const { data, error } = await db()
    .from('editorials')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw new EditorialSourceUnavailable(error.message)
  return (data ?? []) as Editorial[]
}

/** Slugs for the sitemap. Returns empty rather than throwing: a sitemap that
 *  fails to build is worse than one briefly missing a section. */
export async function publishedEditorialSlugs(): Promise<{ slug: string; published_at: string | null }[]> {
  try {
    const { data } = await db()
      .from('editorials')
      .select('slug, published_at')
      .eq('status', 'published')
      .limit(1000)
    return data ?? []
  } catch {
    return []
  }
}
