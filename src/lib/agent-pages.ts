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
  const pain = p.industry.pains[stableIndex(p.agent.slug, p.industry.pains.length)]
  // Names the job, not the brand. This paragraph is body copy a search engine
  // reads, and "For Relay the pressure point is" spends the sentence on a word
  // with no demand behind it. It still varies per agent, so the pages for one
  // trade do not collapse into each other.
  return `At ${p.industry.one}, ${p.industry.stakes}. For an ${jobPhrase(p.agent)} the pressure point is where ${pain} — the repetitive part, which is worth handing over rather than hiring around.`
}

/**
 * A small deterministic hash, so the same pairing always picks the same pain.
 * Not security-sensitive; it only has to be stable across builds, or the copy
 * would shuffle on every deploy and look unstable to a crawler.
 */
function stableIndex(key: string, length: number): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return length > 0 ? h % length : 0
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
