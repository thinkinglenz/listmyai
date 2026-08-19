// Finds what the AI world is actually talking about today.
//
// Google Trends was the obvious source but its daily list is general public
// interest — a sample run returned "trevon diggs", "nike stock price" and
// nothing AI at all, which would produce off-topic posts. Hacker News carries
// AI stories with vote counts (a genuine popularity signal) and Google News
// carries same-day AI coverage, so those are used instead.

export interface TrendingTopic {
  title: string
  source: 'hackernews' | 'google-news'
  score: number
  url?: string
  keywords: string[]
}

// A story must mention one of these to count as AI, or the blog drifts
// off-topic for a directory of AI tools.
//
// These are matched on word boundaries, not as substrings. Plain `includes`
// made "ai" match av-ai-lable, dom-ai-n and "air", so a GrapheneOS story and a
// browser theremin both scored as top AI news.
const AI_WORDS = [
  'ai', 'a\\.i\\.', 'llm', 'llms', 'gpt', 'chatgpt', 'claude', 'gemini', 'openai',
  'anthropic', 'deepseek', 'mistral', 'llama', 'copilot', 'midjourney',
  'perplexity', 'nvidia', 'artificial intelligence', 'machine learning',
  'stable diffusion', 'hugging face', 'neural network', 'language model',
  'foundation model', 'rag',
]

// Matched from the start of a word so inflections count: "agentic", "agents",
// "fine-tuning", "embeddings", "multimodal".
const AI_PREFIXES = [
  'agentic', 'agent', 'transformer', 'diffusion model', 'embedding',
  'inference', 'fine-tun', 'multimodal', 'prompt engineer', 'neural',
]

const AI_PATTERNS: RegExp[] = [
  ...AI_WORDS.map(w => new RegExp(`\\b${w}\\b`, 'i')),
  ...AI_PREFIXES.map(w => new RegExp(`\\b${w}`, 'i')),
]

// Words too generic to be worth targeting.
const STOPWORDS = new Set([
  'the','a','an','and','or','but','for','with','from','into','that','this','are',
  'was','were','has','have','had','will','can','its','it’s','you','your','our',
  'new','now','how','why','what','when','who','all','not','out','get','more','than',
  'about','after','over','they','their','them','been','just','like','some','only',
])

function isAiRelated(title: string): boolean {
  return AI_PATTERNS.some(re => re.test(title))
}

function extractKeywords(title: string): string[] {
  // Short terms are the valuable ones here — "ai", "llm", "gpt" are exactly
  // what people search — so they survive the length filter.
  const KEEP_SHORT = new Set(['ai', 'llm', 'gpt', 'rag', 'api', 'ml'])

  return Array.from(
    new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s.-]/g, ' ')
        .split(/\s+/)
        // Trim punctuation that clung to the edges ("agent." -> "agent").
        .map(w => w.replace(/^[.-]+|[.-]+$/g, ''))
        .filter(w => w && !STOPWORDS.has(w) && !/^\d+$/.test(w))
        .filter(w => w.length > 2 || KEEP_SHORT.has(w))
    )
  ).slice(0, 8)
}

async function fetchHackerNews(): Promise<TrendingTopic[]> {
  const since = Math.floor(Date.now() / 1000) - 2 * 86400
  const url =
    'https://hn.algolia.com/api/v1/search_by_date?tags=story' +
    `&numericFilters=created_at_i>${since},points>25&hitsPerPage=60`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return []
    const data = await res.json()

    return (data.hits ?? [])
      .filter((h: { title?: string }) => h.title && isAiRelated(h.title))
      .map((h: { title: string; points?: number; url?: string }) => ({
        title: h.title,
        source: 'hackernews' as const,
        // Votes are a real signal of developer interest, which is our audience.
        score: h.points ?? 0,
        url: h.url,
        keywords: extractKeywords(h.title),
      }))
  } catch {
    return []
  }
}

async function fetchGoogleNews(): Promise<TrendingTopic[]> {
  const url =
    'https://news.google.com/rss/search?q=' +
    encodeURIComponent('artificial intelligence OR "AI tools" OR LLM when:1d') +
    '&hl=en-US&gl=US&ceid=US:en'

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return []
    const xml = await res.text()

    const titles = Array.from(xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g))
      .map(m => m[1].trim())
      .slice(1) // first <title> is the feed name

    return titles
      .filter(isAiRelated)
      .map((title, i) => ({
        // Strip the trailing " - Publisher" that Google News appends.
        title: title.replace(/\s+-\s+[^-]+$/, '').trim(),
        source: 'google-news' as const,
        // No vote data here, so rank by feed position (relevance order).
        score: Math.max(1, 40 - i),
        keywords: extractKeywords(title),
      }))
  } catch {
    return []
  }
}

/**
 * Today's AI topics, most notable first. Returns an empty array if both
 * sources fail, so callers must have a fallback.
 */
export async function fetchTrendingAiTopics(): Promise<TrendingTopic[]> {
  const [hn, news] = await Promise.all([fetchHackerNews(), fetchGoogleNews()])

  const seen = new Set<string>()
  return [...hn, ...news]
    .filter(t => {
      // Collapse near-duplicates covering the same story.
      const fingerprint = t.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45)
      if (seen.has(fingerprint)) return false
      seen.add(fingerprint)
      return t.title.length > 15
    })
    .sort((a, b) => b.score - a.score)
}
