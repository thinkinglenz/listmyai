// IndexNow submission.
//
// Google deliberately has no "index this now" API — theirs accepts only job
// postings and broadcast events — so Google discovery still depends on the
// sitemap. IndexNow is the real thing for everyone else: Bing, Yandex, Seznam
// and Naver pick URLs up within minutes, and Bing's index is what backs
// ChatGPT Search and Copilot, so this is the route into AI search results.

const KEY = 'f2dff6d15923ed848a65a876acd8e41a'
const HOST = 'listmyai.com'

export const INDEXNOW_KEY = KEY

/**
 * Submits URLs to IndexNow. Never throws: indexing is an optimisation, and a
 * failure here must not take down whatever published the content.
 */
export async function submitToIndexNow(urls: string[]): Promise<{ ok: boolean; status?: number; error?: string }> {
  const list = urls.filter(u => u.startsWith(`https://${HOST}/`) || u === `https://${HOST}`)
  if (list.length === 0) return { ok: false, error: 'No submittable URLs' }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: list.slice(0, 10_000), // per-request cap
      }),
      signal: AbortSignal.timeout(15_000),
    })

    // 200 accepted, 202 accepted but key still being verified.
    if (res.status === 200 || res.status === 202) return { ok: true, status: res.status }
    return { ok: false, status: res.status, error: await res.text().catch(() => '') }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
