import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { BEST_PAGES, type BestPageDef } from './best-pages.data'
import { TOPICS, AUDIENCES, type TopicProfile, type AudienceProfile } from './best-content'

// Pages go live in batches, highest research volume first, so each batch can
// be checked in Search Console before the next. Raise this to release more.
export const LIVE_COUNT = 20

export const LIVE_PAGES: BestPageDef[] = BEST_PAGES.slice(0, LIVE_COUNT)
const LIVE = new Set(LIVE_PAGES.map(p => p.slug))

// Below this a page is too thin to deserve indexing; it renders but carries
// noindex until the catalogue fills in.
export const MIN_TOOLS_TO_INDEX = 6

export const YEAR = 2026

export interface ResolvedPage {
  def: BestPageDef
  topic: TopicProfile
  audience: AudienceProfile | null
}

export function resolveBestPage(slug: string): ResolvedPage | null {
  if (!LIVE.has(slug)) return null
  const def = BEST_PAGES.find(p => p.slug === slug)
  if (!def) return null
  const topic = TOPICS[def.topic]
  if (!topic) return null
  const audience = def.audience ? AUDIENCES[def.audience.replace(/ /g, '-')] ?? null : null
  return { def, topic, audience }
}

export function headingFor({ def, topic, audience }: ResolvedPage): string {
  return `Best ${def.free ? 'Free ' : ''}${titleCase(topic.label)}${audience ? ` for ${audience.title}` : ''} in ${YEAR}`
}

function titleCase(s: string) {
  return s.split(' ').map(w => (w === 'AI' || w === 'SEO' ? w : w[0].toUpperCase() + w.slice(1))).join(' ')
}

// ── Keywords ────────────────────────────────────────────────────────────────

// The research file permutes word order mechanically, so many rows are not
// things people type ("for business ai tools", "free online free ai
// software"). Only natural phrasings are shown on the page; all of them still
// map here.
export function naturalKeywords(keywords: string[], max = 12): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of keywords) {
    const k = raw.trim()
    if (/^(for|with|without|online|top|2026)\b/.test(k)) continue
    if (/\b20(1\d|2[0-5])\b/.test(k)) continue // stale years
    if (/\b(top|best)$/.test(k)) continue
    const words = k.split(/\s+/)
    if (new Set(words).size !== words.length) continue
    if ((k.match(/\bfor\b/g) ?? []).length > 1) continue
    const sig = words.filter(w => !['2026', 'best', 'top'].includes(w)).sort().join(' ')
    if (seen.has(sig)) continue
    seen.add(sig)
    out.push(k)
    if (out.length >= max) break
  }
  return out
}

// ── Tools ───────────────────────────────────────────────────────────────────

export interface BestTool {
  id: string
  slug: string
  name: string
  tagline: string
  logo_url: string | null
  website: string
  pricing_model: string | null
  has_free_trial: boolean
  has_api: boolean
  platforms: string[]
  upvotes: number
  rating_avg: number
  rating_count: number
  view_count: number
  categoryName: string | null
  /** Why the tool is on this page, from its own listing text. */
  audienceMatch: string | null
  freeLabel: string | null
  score: number
}

const COLS = 'id, slug, name, tagline, description, logo_url, website, pricing_model, has_free_trial, has_api, platforms, upvotes, rating_avg, rating_count, view_count, categories(name)'

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// PostgREST `or` syntax treats commas and parentheses as structure.
const safe = (t: string) => t.replace(/[,()%]/g, ' ').trim()
const textOr = (terms: string[]) =>
  terms.flatMap(t => [`tagline.ilike.%${safe(t)}%`, `description.ilike.%${safe(t)}%`]).join(',')

// Almost every listing has no pricing recorded, so "free" cannot be read from
// that column alone. These are the signals that exist, strongest first.
const FREE_OR = [
  'pricing_model.in.(free,freemium)',
  'has_free_trial.eq.true',
  'tagline.ilike.%free%',
  'description.ilike.%free plan%',
  'description.ilike.%free tier%',
  'description.ilike.%free version%',
  'description.ilike.%free forever%',
  'description.ilike.%free to use%',
  'description.ilike.%for free%',
].join(',')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function freeLabelOf(t: any): string | null {
  if (t.pricing_model === 'free') return 'Free'
  if (t.pricing_model === 'freemium') return 'Free plan'
  if (t.has_free_trial) return 'Free trial'
  const text = `${t.tagline ?? ''} ${t.description ?? ''}`.toLowerCase()
  if (/\bfree (plan|tier|version|forever|to use)\b|\bfor free\b|\bfree\b/.test(text)) return 'Free option listed'
  return null
}

// The database filter is a loose substring match, so it also returns "deep
// learning" libraries for students and "SOAP notes" for anyone taking notes.
// This is the strict check: a term must start a word, and machine-learning
// phrases are removed first because "learning" there means something else.
const NOT_AUDIENCE = /\b(deep|machine|reinforcement|federated|transfer|supervised) learning\b|\bcase stud(y|ies)\b/g
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function matchTerm(text: string, terms: string[]): string | null {
  const clean = text.toLowerCase().replace(NOT_AUDIENCE, ' ')
  return terms.find(term => new RegExp(`\\b${escapeRe(term)}`).test(clean)) ?? null
}

function isOnTopic(tagline: string, topic: TopicProfile): boolean {
  if (!topic.terms.length) return true
  if (topic.exclude && matchTerm(tagline, topic.exclude)) return false
  return Boolean(matchTerm(tagline, topic.terms))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shape(t: any, audience: AudienceProfile | null): BestTool {
  const text = `${t.tagline ?? ''} ${t.description ?? ''}`
  const hit = audience ? matchTerm(text, audience.terms) : null
  const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories
  const upvotes = t.upvotes ?? 0
  const views = t.view_count ?? 0
  const rating = t.rating_avg ?? 0
  const tagHit = audience ? Boolean(matchTerm(t.tagline ?? '', audience.terms)) : false
  const score =
    (tagHit ? 60 : hit ? 35 : 0) +
    Math.log10(upvotes + 1) * 12 +
    Math.log10(views + 1) * 6 +
    rating * 2 +
    (t.logo_url ? 3 : 0) +
    (t.pricing_model ? 4 : 0)
  return {
    id: String(t.id), slug: t.slug, name: t.name, tagline: t.tagline ?? '',
    logo_url: t.logo_url ?? null, website: t.website ?? '',
    pricing_model: t.pricing_model ?? null, has_free_trial: Boolean(t.has_free_trial),
    has_api: Boolean(t.has_api), platforms: t.platforms ?? [],
    upvotes, rating_avg: rating, rating_count: t.rating_count ?? 0, view_count: views,
    categoryName: cat?.name ?? null, audienceMatch: hit, freeLabel: freeLabelOf(t), score,
  }
}

export interface BestPageData {
  picks: BestTool[]
  /** Popular in the topic but without an audience signal of their own. */
  alsoPopular: BestTool[]
  stats: {
    matched: number
    freeOptions: number
    withApi: number
    withTrial: number
    rated: number
    topViewed: BestTool | null
    categories: { name: string; count: number }[]
  }
  updatedAt: string
}

// Metadata and the page body both need this; cache() makes it one set of
// queries per request instead of two.
export const fetchBestPageData = cache(async ({ def, topic, audience }: ResolvedPage): Promise<BestPageData> => {
  const sb = client()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (limit: number): any => {
    let q = sb.from('ai_tools').select(COLS).eq('status', 'active')
    if (topic.terms.length) q = q.or(textOr(topic.terms))
    if (def.free) q = q.or(FREE_OR)
    return q.order('upvotes', { ascending: false }).limit(limit)
  }

  // Multiple `or` groups are ANDed by PostgREST, so audience matches are the
  // topic ∩ audience ∩ free set, fetched separately so a niche tool with few
  // upvotes is not pushed out by the generic top of the topic.
  const [audienceRes, topicRes] = await Promise.all([
    audience ? base(120).or(textOr(audience.terms)) : Promise.resolve({ data: [] }),
    base(audience ? 60 : 120),
  ])

  const byId = new Map<string, BestTool>()
  const audienceOnTopic: BestTool[] = []
  const audienceOffTopic: BestTool[] = []
  for (const t of audienceRes.data ?? []) {
    const shaped = shape(t, audience)
    if (!shaped.audienceMatch) continue
    byId.set(shaped.id, shaped)
    ;(isOnTopic(t.tagline ?? '', topic) ? audienceOnTopic : audienceOffTopic).push(shaped)
  }
  const byScore = (a: BestTool, b: BestTool) => b.score - a.score
  const audienceTools = [...audienceOnTopic.sort(byScore), ...audienceOffTopic.sort(byScore)]

  // A tool belongs to the topic when its tagline says so. Descriptions are
  // only a fallback: a video model's description mentions "developers"
  // because it has an API, which does not make it a coding tool.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onTopic = (t: any) => isOnTopic(t.tagline ?? '', topic)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ranked = (rows: any[]) => rows.map(t => shape(t, audience)).sort((a, b) => b.score - a.score)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topicRows: any[] = (topicRes.data ?? []).filter((t: any) => !byId.has(String(t.id)))
  const topicTools = [
    ...ranked(topicRows.filter(onTopic)),
    ...ranked(topicRows.filter(t => !onTopic(t))),
  ]

  const picks = audience ? audienceTools.slice(0, 30) : topicTools.slice(0, 30)
  const alsoPopular = audience ? topicTools.slice(0, 12) : topicTools.slice(30, 42)
  const all = [...picks, ...alsoPopular]

  const catCounts = new Map<string, number>()
  for (const t of picks) if (t.categoryName) catCounts.set(t.categoryName, (catCounts.get(t.categoryName) ?? 0) + 1)

  return {
    picks,
    alsoPopular,
    stats: {
      matched: picks.length,
      freeOptions: all.filter(t => t.freeLabel).length,
      withApi: all.filter(t => t.has_api).length,
      withTrial: all.filter(t => t.has_free_trial).length,
      rated: all.filter(t => t.rating_count > 0).length,
      topViewed: [...all].sort((a, b) => b.view_count - a.view_count)[0] ?? null,
      categories: [...catCounts.entries()].map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5),
    },
    updatedAt: new Date().toISOString(),
  }
})

// ── Related pages ───────────────────────────────────────────────────────────

export function relatedPages({ def }: ResolvedPage): BestPageDef[] {
  const score = (p: BestPageDef) =>
    (p.topic === def.topic ? 2 : 0) + (p.audience === def.audience ? 2 : 0) + (p.free === def.free ? 1 : 0)
  return LIVE_PAGES.filter(p => p.slug !== def.slug)
    .map(p => ({ p, s: score(p) }))
    .filter(x => x.s >= 2)
    .sort((a, b) => b.s - a.s || b.p.volume - a.p.volume)
    .slice(0, 10)
    .map(x => x.p)
}

export function headingForDef(def: BestPageDef): string {
  const topic = TOPICS[def.topic]
  const audience = def.audience ? AUDIENCES[def.audience.replace(/ /g, '-')] ?? null : null
  return topic ? headingFor({ def, topic, audience }) : def.slug
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

export function buildFaq(page: ResolvedPage, data: BestPageData): { q: string; a: string }[] {
  const { def, topic, audience } = page
  const who = audience ? ` for ${audience.label}` : ''
  const kw = def.keywords.join(' ')
  const names = (list: BestTool[], n = 5) => list.slice(0, n).map(t => t.name).join(', ')
  const freeList = [...data.picks, ...data.alsoPopular].filter(t => t.freeLabel)
  const faq: { q: string; a: string }[] = []

  if (data.picks.length) {
    faq.push({
      q: `What are the best ${def.free ? 'free ' : ''}${topic.label}${who} in ${YEAR}?`,
      a: `Based on ListmyAI listings, upvotes and views, the leading ${def.free ? 'free ' : ''}${topic.label}${who} are ${names(data.picks)}. Each is compared above with its pricing, free options and API access.`,
    })
  }
  if (freeList.length) {
    faq.push({
      q: `Are there free ${topic.label}${who}?`,
      a: `Yes — ${freeList.length} of the tools on this page list a free plan, free trial or free option, including ${names(freeList)}. Free plans usually limit usage or features, so check each tool’s pricing page before relying on it.`,
    })
  }
  if (/\bonline\b/.test(kw)) {
    const web = data.picks.filter(t => t.platforms.some(p => /web/i.test(p)))
    faq.push({
      q: `Can I use these ${topic.label} online without installing anything?`,
      a: web.length
        ? `Many can. ${web.length} of the top picks are listed as web apps, including ${names(web, 4)}, so they run in the browser.`
        : `Most tools in this category run in the browser. Check each listing for desktop or mobile apps if you need them.`,
    })
  }
  if (/\bapi\b/.test(kw) || audience?.label === 'developers' || def.topic === 'ai-coding-tools') {
    const api = [...data.picks, ...data.alsoPopular].filter(t => t.has_api)
    if (api.length) {
      faq.push({
        q: `Which ${topic.label} have an API?`,
        a: `${api.length} of the tools here list API access, including ${names(api, 4)}. An API lets you build the tool into your own apps and workflows.`,
      })
    }
  }
  if (audience) {
    faq.push({
      q: `What should ${audience.label} look for in ${topic.label === 'AI tools' ? 'an AI tool' : `an ${topic.singular}`}?`,
      a: [...audience.priorities, topic.criteria[0]].join(' '),
    })
  } else {
    faq.push({
      q: `How do I choose the right ${topic.singular}?`,
      a: topic.criteria.join(' '),
    })
  }
  if (data.stats.topViewed && data.stats.topViewed.view_count > 0) {
    faq.push({
      q: `Which of these is most viewed on ListmyAI?`,
      a: `${data.stats.topViewed.name} is currently the most-viewed tool on this page among ListmyAI visitors.`,
    })
  }
  return faq
}
