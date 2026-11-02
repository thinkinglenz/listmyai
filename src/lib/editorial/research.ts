// Finding what other people have said about a tool.
//
// The entire value of an editorial is that it is built from sources outside
// the vendor's own marketing. That makes one rule absolute: every source here
// is a real URL returned by a real search, and the writer is given only these.
// A model asked to "find discussion" invents plausible links, and a cited link
// that 404s is worse than no citation at all.
//
// Hacker News only, for now. Its Algolia index is public, free and needs no
// key or approval, which no other source we want is. Reddit requires an OAuth
// app and Responsible Builder approval; Product Hunt, YouTube and GitHub each
// need keys. Those are a later addition, not a blocker — and when a tool has
// no HN coverage, the honest move is to say so, which is what coverage_note
// exists for.
import type { EditorialSource } from '@/lib/editorials'

const ALGOLIA = 'https://hn.algolia.com/api/v1/search'

export interface Hit {
  objectID: string
  title: string | null
  story_title: string | null
  comment_text: string | null
  url: string | null
  created_at: string | null
  points: number | null
  /** How we decided this hit is about the tool. */
  _match?: 'domain' | 'name'
}

/** A site's bare domain, for matching mentions that use the URL not the name. */
export function bareDomain(website: string | null): string | null {
  if (!website) return null
  try {
    return new URL(website).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function text(h: Hit): string {
  return [h.title, h.story_title, h.comment_text].filter(Boolean).join(' ').toLowerCase()
}

/**
 * Is this hit really about the tool?
 *
 * This gate is the difference between an editorial and a libel. The first
 * version matched a bare substring and, searching for a tool called ZeroLog,
 * returned six results: five about "Zerologon", a Windows privilege-escalation
 * CVE, and one about Uber's Go logging library of the same name. Published,
 * that would have cited a Microsoft security flaw as independent coverage of a
 * Swiss AI company, and then mailed the company a link to it.
 *
 * So: a hit that carries the tool's own domain is certainly about the tool. A
 * hit that merely contains the name is accepted only when the name is long
 * enough to be distinctive, and then only on a word boundary, so "zerolog"
 * never matches "zerologon". Everything else is dropped. Finding nothing is a
 * fine outcome — coverage_note exists to say so.
 */
const NAME_ONLY_MIN_LENGTH = 8

function nameAppears(body: string, name: string): boolean {
  const esc = name.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // \b alone is wrong here: a name ending in a non-word character would never
  // close, so anchor on "not a word character, or the end".
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(body)
}

export function matchKind(h: Hit, name: string, domain: string | null): 'domain' | 'name' | null {
  const body = text(h)
  if (domain && (body.includes(domain) || (h.url ?? '').toLowerCase().includes(domain))) return 'domain'
  const n = name.trim()
  if (n.length < NAME_ONLY_MIN_LENGTH) return null
  return nameAppears(body, n) ? 'name' : null
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/\s+/g, ' ').trim()
}

export interface Research {
  sources: EditorialSource[]
  /** The matched text, so the writer can quote accurately instead of guessing. */
  excerpts: { url: string; when: string | null; certain: boolean; text: string }[]
}

export async function researchTool(name: string, website: string | null): Promise<Research> {
  const domain = bareDomain(website)
  const queries = [name, domain].filter(Boolean) as string[]

  const hits = new Map<string, Hit>()
  for (const q of queries) {
    const url = `${ALGOLIA}?query=${encodeURIComponent(q)}&tags=(story,comment)&hitsPerPage=25`
    let res: Response
    try {
      res = await fetch(url, { headers: { accept: 'application/json' } })
    } catch {
      continue // a search that fails yields no sources; it must not invent any
    }
    if (!res.ok) continue
    const json = (await res.json()) as { hits?: Hit[] }
    for (const h of json.hits ?? []) {
      const kind = matchKind(h, name, domain)
      if (kind) hits.set(h.objectID, { ...h, _match: kind })
    }
  }

  const ranked = [...hits.values()]
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, 6)

  const sources: EditorialSource[] = ranked.map(h => ({
    label: h.title ?? h.story_title ?? 'Hacker News discussion',
    url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    kind: 'hacker-news',
    published: h.created_at ? h.created_at.slice(0, 10) : null,
  }))

  const excerpts = ranked.map(h => ({
    url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    when: h.created_at ? h.created_at.slice(0, 10) : null,
    // 'name' means the name matched but the domain did not: it could be a
    // different product sharing the name, and the writer is told to check.
    certain: h._match === 'domain',
    text: strip(h.comment_text ?? h.title ?? h.story_title ?? '').slice(0, 600),
  })).filter(e => e.text.length > 0)

  return { sources, excerpts }
}
