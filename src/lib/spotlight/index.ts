// Homepage spotlight.
//
// One tool holds the slot for 24 hours. Anyone can take it by bidding above the
// current holder. With no live bid, the newest approved listing occupies it for
// free, so the box is never empty and every new tool gets some exposure.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const MIN_BID_CENTS = 100 // $1

export interface Spotlight {
  toolId: string
  name: string
  slug: string
  tagline: string
  categoryName: string | null
  logoUrl: string | null
  /** null when nobody has paid and the newest listing is filling the slot. */
  bidId: string | null
  amountCents: number
  expiresAt: string | null
  isPaid: boolean
}

export async function getCurrentSpotlight(): Promise<Spotlight | null> {
  const { data: bid } = await supabase
    .from('spotlight_bids')
    .select('id, amount_cents, expires_at, tool_id, ai_tools(id, name, slug, tagline, status, logo_url, cover_url, categories(name))')
    .is('outbid_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('amount_cents', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bidTool = (bid as any)?.ai_tools
  const tool = Array.isArray(bidTool) ? bidTool[0] : bidTool

  // A tool deactivated after winning must not keep the slot.
  if (bid && tool && tool.status === 'active') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = (tool as any).categories
    return {
      toolId: tool.id,
      name: tool.name,
      slug: tool.slug,
      tagline: tool.tagline ?? '',
      categoryName: (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? null,
      // Logo first: it is square and reads well small. cover_url is a wide
      // screenshot and would be mostly cropped away at this size.
      logoUrl: tool.logo_url || tool.cover_url || null,
      bidId: bid.id,
      amountCents: bid.amount_cents,
      expiresAt: bid.expires_at,
      isPaid: true,
    }
  }

  // Free fallback: newest approved listing.
  const { data: newest } = await supabase
    .from('ai_tools')
    .select('id, name, slug, tagline, logo_url, cover_url, categories(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!newest) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cat = (newest as any).categories
  return {
    toolId: newest.id,
    name: newest.name,
    slug: newest.slug,
    tagline: newest.tagline ?? '',
    categoryName: (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? null,
    logoUrl: newest.logo_url || newest.cover_url || null,
    bidId: null,
    amountCents: 0,
    expiresAt: null,
    isPaid: false,
  }
}

/** What the next bid must beat, in cents. */
export async function getMinimumNextBid(): Promise<number> {
  const current = await getCurrentSpotlight()
  return current?.isPaid ? current.amountCents + MIN_BID_CENTS : MIN_BID_CENTS
}
