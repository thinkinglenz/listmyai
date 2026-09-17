// Homepage spotlight.
//
// Priority 1: a paid holder keeps the slot for 24 hours.
// Priority 2: with nobody paying, newly approved listings take turns, oldest
//             approval first, FREE_TURN_MS each, so every new tool gets its
//             own time in the box however many are approved in a day.
// Otherwise:  the most recently featured listing stays, so the box is never
//             empty.
//
// A turn starts the first time the box is served with that tool, so turns are
// never used up while nobody is looking, and a paid holder pauses the queue.

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
  website: string | null
  coverUrl: string | null
  /** null when nobody has paid and the newest listing is filling the slot. */
  bidId: string | null
  amountCents: number
  expiresAt: string | null
  isPaid: boolean
}

export async function getCurrentSpotlight(): Promise<Spotlight | null> {
  const { data: bid } = await supabase
    .from('spotlight_bids')
    .select('id, amount_cents, expires_at, tool_id, ai_tools(id, name, slug, tagline, status, website, logo_url, cover_url, categories(name))')
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
      // cover_url is an admin-chosen image and outranks anything automatic;
      // see the card for the screenshot fallback chain.
      logoUrl: tool.logo_url || null,
      website: tool.website || null,
      coverUrl: tool.cover_url || null,
      bidId: bid.id,
      amountCents: bid.amount_cents,
      expiresAt: bid.expires_at,
      isPaid: true,
    }
  }

  return freeTurn()
}

/** How long each newly approved listing holds the free slot. */
export const FREE_TURN_MS = 6 * 60 * 60 * 1000

// Listings approved before the queue existed are not owed a turn; without a
// cut-off all 20,000 would line up.
const QUEUE_SINCE = '2026-09-16T00:00:00Z'

const FREE_COLS = 'id, name, slug, tagline, website, logo_url, cover_url, spotlight_turn_at, categories(name)'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFree(t: any, turnStartedAt: string | null): Spotlight {
  const cat = t.categories
  return {
    toolId: t.id,
    name: t.name,
    slug: t.slug,
    tagline: t.tagline ?? '',
    categoryName: (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? null,
    logoUrl: t.logo_url || null,
    website: t.website || null,
    coverUrl: t.cover_url || null,
    bidId: null,
    amountCents: 0,
    // Shown as a countdown, so visitors see the slot rotate.
    expiresAt: turnStartedAt ? new Date(new Date(turnStartedAt).getTime() + FREE_TURN_MS).toISOString() : null,
    isPaid: false,
  }
}

async function currentTurn() {
  const { data } = await supabase
    .from('ai_tools')
    .select(FREE_COLS)
    .eq('status', 'active')
    .gt('spotlight_turn_at', new Date(Date.now() - FREE_TURN_MS).toISOString())
    .order('spotlight_turn_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

async function freeTurn(): Promise<Spotlight | null> {
  const live = await currentTurn()
  if (live) return toFree(live, live.spotlight_turn_at)

  // Next in line: the earliest-approved listing that has not had a turn.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: next } = await supabase
      .from('ai_tools')
      .select(FREE_COLS)
      .eq('status', 'active')
      .is('spotlight_turn_at', null)
      .gte('published_at', QUEUE_SINCE)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (!next) break

    // Only claims the turn if nobody else did in the meantime; two visitors
    // arriving together must not start two turns.
    const startedAt = new Date().toISOString()
    const { data: claimed } = await supabase
      .from('ai_tools')
      .update({ spotlight_turn_at: startedAt })
      .eq('id', next.id)
      .is('spotlight_turn_at', null)
      .select('id')
    if (claimed?.length) return toFree(next, startedAt)

    const raced = await currentTurn()
    if (raced) return toFree(raced, raced.spotlight_turn_at)
  }

  // Queue empty: keep the last featured listing rather than an empty box.
  const { data: last } = await supabase
    .from('ai_tools')
    .select(FREE_COLS)
    .eq('status', 'active')
    .not('spotlight_turn_at', 'is', null)
    .order('spotlight_turn_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (last) return toFree(last, null)

  const { data: newest } = await supabase
    .from('ai_tools')
    .select(FREE_COLS)
    .eq('status', 'active')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  return newest ? toFree(newest, null) : null
}

/** The price is flat, so this is always the same figure. */
export async function getMinimumNextBid(): Promise<number> {
  return MIN_BID_CENTS
}
