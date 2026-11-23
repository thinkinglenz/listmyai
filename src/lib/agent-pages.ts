/**
 * The agent x industry page set.
 *
 * Pairings are listed by hand rather than generated as a full cross-product.
 * Every agent against every industry would be a bigger number and a worse
 * site: "an inventory forecasting agent for law firms" is a page about
 * nothing, and a pile of pages about nothing is what a scaled-content
 * penalty is for. A pairing appears here only when the agent genuinely has
 * something to do in that trade.
 */

import { AGENTS, getAgent, jobPhrase, type Agent } from './agents.ts'
import { INDUSTRIES, getIndustry, type Industry } from './industries.ts'

export const PAIRINGS: Record<string, string[]> = {
  relay: ['ecommerce', 'travel-agencies', 'clinics', 'real-estate', 'restaurants', 'agencies', 'logistics', 'education', 'saas', 'retail', 'fitness', 'automotive', 'insurance', 'salons', 'events', 'pharmacy', 'legal', 'professional-services'],
  sift: ['real-estate', 'travel-agencies', 'agencies', 'education', 'construction', 'saas', 'automotive', 'fitness', 'professional-services', 'insurance', 'events', 'manufacturing', 'legal', 'clinics', 'salons'],
  booked: ['clinics', 'fitness', 'restaurants', 'automotive', 'real-estate', 'education', 'professional-services', 'salons', 'legal', 'travel-agencies', 'events'],
  triage: ['agencies', 'logistics', 'professional-services', 'construction', 'retail', 'real-estate', 'education', 'saas', 'ecommerce', 'travel-agencies', 'legal', 'insurance', 'manufacturing', 'events'],
  ledger: ['professional-services', 'logistics', 'construction', 'retail', 'restaurants', 'automotive', 'ecommerce', 'agencies', 'manufacturing', 'pharmacy', 'insurance', 'clinics', 'travel-agencies'],
  echo: ['agencies', 'ecommerce', 'fitness', 'education', 'restaurants', 'real-estate', 'saas', 'retail', 'travel-agencies', 'salons', 'events', 'clinics'],
  prospect: ['agencies', 'saas', 'logistics', 'professional-services', 'construction', 'education', 'travel-agencies', 'real-estate', 'manufacturing', 'events', 'insurance'],
  pulse: ['restaurants', 'clinics', 'retail', 'fitness', 'automotive', 'travel-agencies', 'ecommerce', 'real-estate', 'education', 'salons', 'pharmacy', 'events', 'legal'],
  clause: ['professional-services', 'construction', 'logistics', 'real-estate', 'agencies', 'saas', 'legal', 'insurance', 'manufacturing', 'events'],
  restock: ['retail', 'ecommerce', 'restaurants', 'automotive', 'logistics', 'pharmacy', 'manufacturing', 'salons', 'clinics'],
  screen: ['agencies', 'retail', 'logistics', 'restaurants', 'clinics', 'construction', 'education', 'fitness', 'saas', 'professional-services', 'travel-agencies', 'salons', 'events'],
  brief: ['ecommerce', 'agencies', 'saas', 'retail', 'restaurants', 'logistics', 'fitness', 'professional-services', 'travel-agencies', 'education', 'clinics', 'manufacturing'],
  orderflow: ['ecommerce', 'retail', 'restaurants', 'pharmacy', 'manufacturing', 'logistics', 'salons'],
  dispatch: ['construction', 'automotive', 'logistics', 'manufacturing', 'events', 'retail'],
  quote: ['construction', 'manufacturing', 'logistics', 'events', 'agencies', 'professional-services', 'automotive', 'insurance', 'legal', 'travel-agencies'],
  collect: ['professional-services', 'agencies', 'construction', 'logistics', 'manufacturing', 'legal', 'clinics', 'education', 'events', 'automotive', 'insurance'],
  revive: ['ecommerce', 'retail', 'fitness', 'salons', 'clinics', 'automotive', 'travel-agencies', 'restaurants', 'education', 'pharmacy'],
  social: ['salons', 'restaurants', 'fitness', 'ecommerce', 'retail', 'clinics', 'events', 'travel-agencies', 'real-estate', 'education'],
  onboard: ['agencies', 'professional-services', 'legal', 'insurance', 'education', 'clinics', 'saas', 'events'],
  intake: ['clinics', 'pharmacy', 'salons', 'legal', 'insurance', 'fitness'],
}

export interface Pair { agent: Agent; industry: Industry; slug: string }

/**
 * "relay-for-clinics". Safe to split on "-for-" because no agent or industry
 * slug contains that sequence — asserted in the tests, so a future slug that
 * breaks the parser fails the build rather than producing dead URLs.
 */
export function pairSlug(agentSlug: string, industrySlug: string): string {
  return `${agentSlug}-for-${industrySlug}`
}

export function allPairs(): Pair[] {
  const out: Pair[] = []
  for (const [agentSlug, industrySlugs] of Object.entries(PAIRINGS)) {
    const agent = getAgent(agentSlug)
    if (!agent) continue
    for (const industrySlug of industrySlugs) {
      const industry = getIndustry(industrySlug)
      if (!industry) continue
      out.push({ agent, industry, slug: pairSlug(agentSlug, industrySlug) })
    }
  }
  return out
}

export function getPair(slug: string): Pair | undefined {
  const at = slug.indexOf('-for-')
  if (at < 0) return undefined
  const agent = getAgent(slug.slice(0, at))
  const industry = getIndustry(slug.slice(at + 5))
  if (!agent || !industry) return undefined
  // A pairing that is not in the map is not a page. Otherwise every
  // combination would resolve and the deliberate exclusions would mean
  // nothing.
  if (!PAIRINGS[agent.slug]?.includes(industry.slug)) return undefined
  return { agent, industry, slug }
}

/** Agents that have a page for this industry, in catalogue order. */
export function agentsFor(industrySlug: string): Agent[] {
  return AGENTS.filter(a => PAIRINGS[a.slug]?.includes(industrySlug))
}

/** Industries this agent has a page for, in industry order. */
export function industriesFor(agentSlug: string): Industry[] {
  const allowed = PAIRINGS[agentSlug] ?? []
  return INDUSTRIES.filter(i => allowed.includes(i.slug))
}

// ── Page copy ────────────────────────────────────────────────────────────────
// Composed from both profiles so no two pages read alike. The agent supplies
// what it does; the industry supplies who is asking, through which channel,
// on what systems, and what it costs when it goes wrong.

export function pairTitle(p: Pair): string {
  return `${p.agent.job} for ${p.industry.name}`
}

export function pairDescription(p: Pair): string {
  // Written to be read, not to be counted. A description crammed with repeats
  // of the phrase is rewritten by the search engine anyway, so the only thing
  // stuffing achieves is a worse snippet.
  return `${p.agent.tagline} Built for ${p.industry.lower}, where ${p.industry.pains[0]}. ${p.agent.outcome}`
}

/** The opening paragraph. Industry-specific, not a template with a swap. */
export function pairIntro(p: Pair): string {
  const channels = humanList(p.industry.channels.slice(0, 3))
  return `At ${p.industry.one}, ${p.industry.audience} arrive through ${channels}, and the load lands ${p.industry.rhythm}. ${capitalise(p.industry.pains[0])}. ${p.agent.outcome}`
}

/**
 * The "why this matters here" paragraph.
 *
 * It used to depend on the industry alone, which meant every agent offered to
 * the same trade carried an identical block — eighteen pages sharing a
 * paragraph is the duplication this page set exists to avoid. It now draws on
 * both profiles, and picks which of the trade's pains to lead on from the
 * agent, so the pages for one industry emphasise different things.
 */
export function pairStakes(p: Pair): string {
  const pain = mostRelevantPain(p)
  return `At ${p.industry.one}, ${p.industry.stakes}. For an ${jobPhrase(p.agent)} the pressure point is where ${pain} — the repetitive part, which is worth handing over rather than hiring around.`
}

/**
 * Which of a trade's pains this particular agent is actually about.
 *
 * This used to pick one by hashing the agent slug, which is stable but
 * meaningless — and it showed: the dispatch page for contractors led on
 * "contract terms are signed without anyone reading page nine", a sentence
 * about a different agent entirely. Picking at random is the thing that makes
 * a generated page read as generated.
 *
 * Scoring on shared words between the agent's own copy and each pain is crude,
 * but it is the difference between a relevant sentence and a wrong one, and it
 * falls back to the first pain rather than inventing anything.
 */
function mostRelevantPain(p: Pair): string {
  const agentWords = new Set(
    tokenise(`${p.agent.job} ${p.agent.tagline} ${p.agent.outcome} ${p.agent.features.join(' ')}`),
  )
  let best = p.industry.pains[0]
  let bestScore = -1
  // Forward order, strict >, so an exact tie keeps the earliest pain and the
  // copy never shuffles between builds.
  for (const pain of p.industry.pains) {
    let score = 0
    for (const w of new Set(tokenise(pain))) if (agentWords.has(w)) score++
    if (score > bestScore) { bestScore = score; best = pain }
  }
  return best
}

// Words common enough to match everything carry no signal.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'from', 'are', 'not', 'but', 'they',
  'their', 'your', 'you', 'who', 'what', 'when', 'which', 'has', 'have', 'had',
  'into', 'out', 'off', 'all', 'any', 'one', 'two', 'its', 'it', 'is', 'of',
  'to', 'in', 'on', 'at', 'as', 'by', 'or', 'a', 'an', 'be', 'so', 'up',
  'every', 'most', 'same', 'than', 'then', 'them', 'this', 'these', 'those',
  'can', 'will', 'does', 'do', 'get', 'gets', 'keep', 'keeps', 'take', 'takes',
  // Connectives, added after they produced a wrong match: the dispatch
  // agent's "kept informed without anyone running the board" scored against
  // the contracts pain's "signed without anyone reading page nine" purely on
  // "without" and "anyone", and beat the pain that was actually about it.
  // Words this common appear in every sentence, so they are noise by
  // definition — matching on them is matching on nothing.
  'without', 'anyone', 'someone', 'nobody', 'everyone', 'while', 'before',
  'after', 'still', 'already', 'actually', 'often', 'usually', 'something',
  'anything', 'nothing', 'there', 'here', 'never', 'always', 'another',
])

function tokenise(text: string): string[] {
  return text.toLowerCase().match(/[a-z]{3,}/g)?.filter(w => !STOPWORDS.has(w)).map(singular) ?? []
}

/**
 * Crudest possible singular: drop a trailing "s".
 *
 * Needed because the match is exact-word, and the copy naturally disagrees on
 * number — the trade's pain says "supplier invoices pile up" while the agent
 * is an "AI Invoice Extraction Agent". Without this they never match, and the
 * invoice agent leads on some unrelated pain instead. "ss" is left alone so
 * "business" does not become "busines".
 */
function singular(w: string): string {
  return w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w
}

/**
 * What it connects to: the agent's own targets plus the software this trade
 * already runs, de-duplicated and case-insensitive so "Email" does not appear
 * twice with different capitalisation.
 */
export function pairIntegrations(p: Pair): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of [...p.agent.worksWith, ...p.industry.systems]) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/**
 * The North America line.
 *
 * Google removed country targeting for generic domains in 2022, so there is
 * no setting that aims this site at the US and Canada. The only signals left
 * are in the words: naming the countries, and naming the software those
 * businesses actually run — Toast, Jobber, ServiceTitan, QuickBooks Online,
 * Square. A page that lists the right tools reads as written for that market
 * because it was.
 *
 * One sentence, in the body, on a page that is already about one trade. The
 * version of this that does not work is a separate near-identical page per
 * country, which is duplication wearing a flag.
 */
export function pairRegion(p: Pair): string {
  const stack = p.industry.systems.slice(0, 3).join(', ')
  return `Most ${p.industry.lower} we build this for are in the United States and Canada, running ${stack}. It connects to what you already use rather than asking you to move.`
}

function humanList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * Capitalise the first LETTER, not the first character. Several pains open
 * with a quoted phrase — '"where is my order" arrives…' — and capitalising
 * position zero there uppercases the quote mark and leaves the word lowercase.
 */
function capitalise(s: string): string {
  const at = s.search(/[a-z]/i)
  if (at < 0) return s
  return s.slice(0, at) + s.charAt(at).toUpperCase() + s.slice(at + 1)
}
