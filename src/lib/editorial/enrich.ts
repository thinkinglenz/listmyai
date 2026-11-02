// Raw material for an editorial beyond what Hacker News says.
//
// Everything here is read from a real URL or a real API response, never
// generated. The writer is handed it as quoted material and told it is the
// company's own words (site text) or plain facts (GitHub stats), so a thin
// piece becomes a longer one without anything being invented.
import { createClient } from '@supabase/supabase-js'
import { matchKind, bareDomain, type Hit } from './research.ts'
import type { EditorialSource } from '@/lib/editorials'

const FETCH_TIMEOUT_MS = 8000
const MAX_HTML_CHARS = 400_000

// ── Fetching a vendor's own site ─────────────────────────────

/**
 * Is this a URL we are willing to fetch from the server?
 *
 * The address comes from a listing that anyone could have submitted, so a
 * hostile one could point at localhost or a cloud metadata endpoint. Refuse
 * anything that is not a plain public http(s) hostname. This does not defend
 * against DNS that resolves a public name to a private address; the fetch
 * result is only ever turned into text for the writer and never returned.
 */
export function isPublicHttpUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null
  let u: URL
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const h = u.hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return null
  if (!h.includes('.') && !h.includes(':')) return null
  if (h.includes(':') || h.startsWith('[')) return null // any IPv6 literal
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    if (a === 10 || a === 127 || a === 0 || a >= 224) return null
    if (a === 169 && b === 254) return null
    if (a === 172 && b >= 16 && b <= 31) return null
    if (a === 192 && b === 168) return null
    if (a === 100 && b >= 64 && b <= 127) return null
  }
  return u
}

async function getHtml(url: URL): Promise<{ html: string; finalUrl: URL } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'ListmyAI-Editorial/1.0 (+https://listmyai.com)', accept: 'text/html' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const finalUrl = isPublicHttpUrl(res.url)
    if (!finalUrl) return null // redirected somewhere we would not have fetched
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('html')) return null
    return { html: (await res.text()).slice(0, MAX_HTML_CHARS), finalUrl }
  } catch {
    return null
  }
}

function decode(s: string): string {
  return s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ')
}

/** Visible text of a page: scripts, styles and markup removed. */
export function pageText(html: string): string {
  return decode(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<(nav|footer)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim()
}

function metaDescription(html: string): string | null {
  const m = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i)
  const c = m?.[0].match(/content=["']([^"']*)["']/i)
  return c ? decode(c[1]).trim() : null
}

export interface SitePage { url: string; title: string | null; description: string | null; text: string }

export interface SiteInfo {
  pages: SitePage[]
  /** github.com/owner/repo links found on the company's own pages. */
  githubRepos: string[]
}

const PAGE_PATHS = ['', '/pricing', '/about', '/features']
const TEXT_PER_PAGE = 3500

/** The company's own words: homepage plus the usual pricing/about pages. */
export async function fetchSite(website: string | null): Promise<SiteInfo> {
  const base = isPublicHttpUrl(website)
  if (!base) return { pages: [], githubRepos: [] }

  const pages: SitePage[] = []
  const repos = new Set<string>()
  const seen = new Set<string>()

  for (const path of PAGE_PATHS) {
    const target = new URL(path || '/', base.origin)
    if (seen.has(target.href)) continue
    seen.add(target.href)
    const got = await getHtml(target)
    if (!got) continue
    // A path that quietly redirects to the homepage would repeat it.
    if (path && got.finalUrl.pathname === '/' ) continue

    const text = pageText(got.html)
    if (text.length < 200) continue
    const title = got.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    pages.push({
      url: got.finalUrl.href,
      title: title ? decode(title).replace(/\s+/g, ' ').trim().slice(0, 160) : null,
      description: metaDescription(got.html),
      text: text.slice(0, TEXT_PER_PAGE),
    })
    for (const r of githubReposIn(got.html)) repos.add(r)
  }
  return { pages, githubRepos: [...repos].slice(0, 2) }
}

const NOT_REPOS = new Set(['sponsors', 'features', 'about', 'pricing', 'login', 'join', 'topics', 'orgs', 'marketplace', 'collections', 'settings', 'apps'])

/** owner/repo pairs linked from a page. */
export function githubReposIn(html: string): string[] {
  const out: string[] = []
  const re = /href=["']https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?=[/"'?#])/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const [owner, repo] = [m[1], m[2].replace(/\.git$/, '')]
    if (NOT_REPOS.has(owner.toLowerCase())) continue
    const full = `${owner}/${repo}`
    if (!out.includes(full)) out.push(full)
  }
  return out
}

// ── GitHub ───────────────────────────────────────────────────

export interface RepoFacts {
  url: string
  fullName: string
  description: string | null
  stars: number
  language: string | null
  license: string | null
  pushedAt: string | null
}

/**
 * Facts about a repository the company itself links to. Linked from the
 * vendor's own site, so it is certainly theirs; it is not independent
 * coverage and is never presented as such.
 */
export async function fetchRepo(fullName: string): Promise<RepoFacts | null> {
  try {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'ListmyAI-Editorial' }
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = await res.json()
    if (r.archived || r.private) return null
    return {
      url: r.html_url,
      fullName: r.full_name,
      description: r.description ?? null,
      stars: Number(r.stargazers_count) || 0,
      language: r.language ?? null,
      license: r.license?.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : null,
      pushedAt: r.pushed_at ? String(r.pushed_at).slice(0, 10) : null,
    }
  } catch {
    return null
  }
}

// ── YouTube (only with a key) ────────────────────────────────

export interface Video { id: string; title: string; channel: string; published: string | null; certain: boolean }

/**
 * Videos about the tool. Needs YOUTUBE_API_KEY; without one this returns
 * nothing, which is a normal outcome. A video counts only when its title or
 * description carries the tool's domain, or its name (long enough to be
 * distinctive) on a word boundary: the same rule as Hacker News, for the same
 * reason.
 */
export async function fetchVideos(name: string, website: string | null): Promise<Video[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []
  const domain = bareDomain(website)
  try {
    const q = encodeURIComponent(domain ? `${name} ${domain}` : name)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${q}&key=${key}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    )
    if (!res.ok) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json()
    const out: Video[] = []
    for (const it of json.items ?? []) {
      const s = it.snippet ?? {}
      const asHit: Hit = {
        objectID: String(it.id?.videoId ?? ''), title: s.title ?? null, story_title: null,
        comment_text: s.description ?? null, url: null, created_at: null, points: 0,
      }
      const kind = matchKind(asHit, name, domain)
      if (!kind || !asHit.objectID) continue
      out.push({
        id: asHit.objectID, title: decode(String(s.title ?? '')), channel: String(s.channelTitle ?? ''),
        published: s.publishedAt ? String(s.publishedAt).slice(0, 10) : null, certain: kind === 'domain',
      })
    }
    return out.slice(0, 3)
  } catch {
    return []
  }
}

// ── Links to the rest of ListmyAI ────────────────────────────

export interface InternalLinks {
  toolPath: string
  alternativesPath: string
  category: { name: string; slug: string } | null
  related: { name: string; slug: string }[]
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/** Real pages on this site that exist for the tool, its category and peers. */
export async function internalLinks(toolId: string, slug: string): Promise<InternalLinks> {
  const links: InternalLinks = { toolPath: `/tools/${slug}`, alternativesPath: `/alternatives/${slug}`, category: null, related: [] }
  try {
    const sb = db()
    const { data: t } = await sb.from('ai_tools').select('category_id, categories(name, slug)').eq('id', toolId).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = Array.isArray(t?.categories) ? t?.categories[0] : t?.categories
    if (c?.slug) links.category = { name: c.name, slug: c.slug }
    if (t?.category_id) {
      const { data: peers } = await sb.from('ai_tools').select('name, slug')
        .eq('status', 'active').eq('category_id', t.category_id).neq('id', toolId)
        .order('upvotes', { ascending: false }).limit(4)
      links.related = (peers ?? []) as { name: string; slug: string }[]
    }
  } catch { /* the basic tool and alternatives links still stand */ }
  return links
}

/**
 * A closing section of links, written by code and not by the model, so every
 * editorial carries them and none of them can be invented.
 */
export function relatedSection(toolName: string, l: InternalLinks): string {
  const lines = [
    `- [${toolName} on ListmyAI](${l.toolPath}): listing, pricing and details`,
    `- [Alternatives to ${toolName}](${l.alternativesPath})`,
  ]
  if (l.category) lines.push(`- [More tools in ${l.category.name}](/directory?category=${l.category.slug})`)
  if (l.related.length) {
    lines.push(`- Similar tools: ${l.related.map(r => `[${r.name}](/tools/${r.slug})`).join(', ')}`)
  }
  return `### More on ListmyAI\n\n${lines.join('\n')}`
}

/** Strips a trailing related section so re-running never doubles it. */
export function withRelatedSection(body: string, section: string): string {
  const idx = body.lastIndexOf('### More on ListmyAI')
  const clean = idx >= 0 ? body.slice(0, idx).trimEnd() : body.trimEnd()
  return `${clean}\n\n${section}\n`
}

/** Keywords from the model, cleaned: short phrases, no duplicates, max 8. */
export function cleanKeywords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of raw) {
    if (typeof k !== 'string') continue
    const v = k.toLowerCase().replace(/\s+/g, ' ').trim()
    if (v.length < 3 || v.length > 60 || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out.slice(0, 8)
}

export type { EditorialSource }
