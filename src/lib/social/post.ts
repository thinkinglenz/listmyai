/**
 * Social media posting helpers.
 * Called after a blog post is generated & saved.
 *
 * Required env vars:
 *   TWITTER_API_KEY            – OAuth 1.0a consumer key
 *   TWITTER_API_SECRET         – OAuth 1.0a consumer secret
 *   TWITTER_ACCESS_TOKEN       – OAuth 1.0a access token (your account)
 *   TWITTER_ACCESS_TOKEN_SECRET
 *   FACEBOOK_PAGE_ID           – Numeric page ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN – Page-level token with pages_manage_posts
 *   INSTAGRAM_BUSINESS_ID      – IG business account ID linked to the FB page
 *
 * All functions return { ok: boolean, error?: string } so a failure on one
 * platform never blocks the others or the main cron response.
 */

import crypto from 'crypto'

/**
 * Meta retires a Graph API version roughly two years after release, and a call
 * to a retired one starts failing rather than silently degrading. Keeping it
 * in one place makes the periodic bump a one-line change.
 */
import { instagramCaption, instagramImagePath } from './copy'

const GRAPH_API_VERSION = 'v23.0'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialPost {
  title: string
  excerpt: string
  slug: string
  tags: string[]
  heroImageUrl: string
}

interface SocialResult {
  twitter?: { ok: boolean; id?: string; error?: string }
  facebook?: { ok: boolean; id?: string; error?: string }
  // instagram: needs a linked IG business account, not set up yet
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(s: string): string {
  return encodeURIComponent(s)
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A')
}

function buildHashtags(tags: string[], max = 4): string {
  return tags
    .slice(0, max)
    .map(t => '#' + t.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, ''))
    .join(' ')
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}

// ─── Twitter / X ──────────────────────────────────────────────────────────────
// Implements OAuth 1.0a signing — no SDK needed.

function twitterAuthHeader(
  method: string,
  url: string,
  bodyParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }

  // Collect all params for signature (oauth + body)
  const allParams = { ...oauthParams, ...bodyParams }

  const paramStr = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join('&')

  const sigBase = `${method.toUpperCase()}&${pct(url)}&${pct(paramStr)}`
  const sigKey = `${pct(consumerSecret)}&${pct(accessTokenSecret)}`
  const signature = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64')

  return (
    'OAuth ' +
    Object.entries({ ...oauthParams, oauth_signature: signature })
      .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
      .join(', ')
  )
}

export async function postToTwitter(post: SocialPost): Promise<{ ok: boolean; id?: string; error?: string }> {
  const {
    TWITTER_API_KEY: apiKey,
    TWITTER_API_SECRET: apiSecret,
    TWITTER_ACCESS_TOKEN: accessToken,
    TWITTER_ACCESS_TOKEN_SECRET: accessSecret,
  } = process.env

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { ok: false, error: 'Twitter env vars not configured' }
  }

  const url = `https://listmyai.com/blog/${post.slug}`
  const hashtags = buildHashtags(post.tags, 3)

  // Tweet = title + newline + URL + hashtags, max 280 chars
  // URL counts as 23 chars in Twitter's weighting
  const maxTitle = 280 - 23 - 1 - hashtags.length - 2 // 2 for newlines
  const tweet = `${truncate(post.title, maxTitle)}\n${url}\n${hashtags}`

  const tweetBody = JSON.stringify({ text: tweet })
  const apiUrl = 'https://api.twitter.com/2/tweets'

  // For JSON body POST, OAuth signature body params are empty (JSON body is not form-encoded)
  const authHeader = twitterAuthHeader(
    'POST', apiUrl, {}, apiKey, apiSecret, accessToken, accessSecret
  )

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: tweetBody,
    })

    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: JSON.stringify(data) }
    }
    return { ok: true, id: data.data?.id }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─── Facebook Page ─────────────────────────────────────────────────────────────

export async function postToFacebook(post: SocialPost): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { FACEBOOK_PAGE_ID: pageId, FACEBOOK_PAGE_ACCESS_TOKEN: token } = process.env

  if (!pageId || !token) {
    return { ok: false, error: 'Facebook env vars not configured' }
  }

  const postUrl = `https://listmyai.com/blog/${post.slug}`
  const hashtags = buildHashtags(post.tags, 5)

  const message = [
    `📝 ${post.title}`,
    '',
    truncate(post.excerpt, 200),
    '',
    `🔗 ${postUrl}`,
    '',
    hashtags,
  ].join('\n')

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link: postUrl, access_token: token }),
      }
    )

    const data = await res.json()
    if (!res.ok || data.error) {
      return { ok: false, error: data.error?.message ?? JSON.stringify(data) }
    }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─── Instagram ─────────────────────────────────────────────────────────────────
// Instagram Graph API requires a public image URL.
// Two-step: create container → publish.

export async function postToInstagram(post: SocialPost): Promise<{ ok: boolean; id?: string; error?: string }> {
  const {
    INSTAGRAM_BUSINESS_ID: igId,
    FACEBOOK_PAGE_ACCESS_TOKEN: token,
  } = process.env

  if (!igId || !token) {
    return { ok: false, error: 'Instagram env vars not configured' }
  }

  const postUrl = `https://listmyai.com/blog/${post.slug}`
  const hashtags = buildHashtags(post.tags, 8)

  const caption = [
    `✨ ${post.title}`,
    '',
    truncate(post.excerpt, 180),
    '',
    `Read more → ${postUrl}`,
    '',
    hashtags,
  ].join('\n')

  try {
    // Step 1: create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: post.heroImageUrl,
          caption,
          access_token: token,
        }),
      }
    )

    const containerData = await containerRes.json()
    if (!containerRes.ok || containerData.error) {
      return { ok: false, error: containerData.error?.message ?? JSON.stringify(containerData) }
    }

    const containerId: string = containerData.id
    if (!containerId) return { ok: false, error: 'No container ID returned' }

    // Step 2: publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerId, access_token: token }),
      }
    )

    const publishData = await publishRes.json()
    if (!publishRes.ok || publishData.error) {
      return { ok: false, error: publishData.error?.message ?? JSON.stringify(publishData) }
    }
    return { ok: true, id: publishData.id }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ─── Master function ───────────────────────────────────────────────────────────
// Facebook + Instagram skipped — can be re-enabled when Meta Page/Business
// verification is complete. Just add postToFacebook() and postToInstagram()
// back into the Promise.allSettled() call and set the env vars in Vercel.

export async function postToAllSocial(post: SocialPost): Promise<SocialResult> {
  // allSettled, not all: one network failing must never stop the others, and
  // none of them may fail the blog generation that called this.
  const [twitter, facebook] = await Promise.allSettled([
    postToTwitter(post),
    postToFacebook(post),
  ])

  return {
    twitter: twitter.status === 'fulfilled' ? twitter.value : { ok: false, error: String(twitter.reason) },
    facebook: facebook.status === 'fulfilled' ? facebook.value : { ok: false, error: String(facebook.reason) },
  }
}

// ─── Tool announcements ────────────────────────────────────────────────────────

/**
 * A Facebook post id is "<pageId>_<postId>", which maps onto a public URL.
 * Instagram returns only a media id, and its permalink needs a separate call —
 * done at post time because it is cheap here and impossible later without
 * storing the id anyway.
 */
function facebookPostUrl(postId: string): string | null {
  const [pageId, id] = postId.split('_')
  return pageId && id ? `https://www.facebook.com/${pageId}/posts/${id}` : null
}

async function instagramPermalink(mediaId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}?fields=permalink&access_token=${token}`,
      { signal: AbortSignal.timeout(8_000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.permalink ?? null
  } catch {
    return null
  }
}

export interface ToolAnnouncement {
  name: string
  slug: string
  tagline: string
  category?: string
  /** Headline for the Instagram creative and caption; see lib/social/hook. */
  hook?: string | null
}

type NetResult = { ok: boolean; id?: string; error?: string; url?: string | null }

async function graphPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`)
  return data
}

async function igPublish(igId: string, token: string, body: Record<string, unknown>): Promise<NetResult> {
  try {
    const container = await graphPost(`${igId}/media`, { ...body, access_token: token })
    const published = await graphPost(`${igId}/media_publish`, { creation_id: container.id, access_token: token })
    return { ok: true, id: published.id }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// Threads accepts clickable links, so its post carries the URL. It needs its
// own token (Threads use case), read from THREADS_ACCESS_TOKEN.
async function postToThreads(text: string, imageUrl: string): Promise<NetResult> {
  const token = process.env.THREADS_ACCESS_TOKEN
  if (!token) return { ok: false, error: 'THREADS_ACCESS_TOKEN not configured' }
  const base = 'https://graph.threads.net/v1.0'
  try {
    const call = async (path: string, init?: RequestInit) => {
      const res = await fetch(`${base}/${path}`, init)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json().catch(() => ({}))
      if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`)
      return data
    }
    const form = (o: Record<string, string>) => ({ method: 'POST', body: new URLSearchParams({ ...o, access_token: token }) })
    const container = await call('me/threads', form({ media_type: 'IMAGE', image_url: imageUrl, text: text.slice(0, 500) }))
    // Threads fetches the image asynchronously; publishing before it is
    // ready fails, so wait for the container to finish.
    for (let i = 0; i < 10; i++) {
      const st = await call(`${container.id}?fields=status,error_message&access_token=${token}`)
      if (st.status === 'FINISHED') break
      if (st.status === 'ERROR') throw new Error(st.error_message ?? 'Threads could not process the image')
      await new Promise(r => setTimeout(r, 3000))
    }
    const published = await call('me/threads_publish', form({ creation_id: container.id }))
    const meta = await call(`${published.id}?fields=permalink&access_token=${token}`).catch(() => null)
    return { ok: true, id: published.id, url: meta?.permalink ?? null }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

/**
 * Announces a newly approved tool: Facebook post and story, Instagram post
 * and story, and Threads. Every network gets the designed card; Facebook and
 * Threads also carry the link, which Instagram cannot make clickable.
 * Networks are independent: one failing never stops the others.
 */
export async function announceToolToSocial(
  tool: ToolAnnouncement
): Promise<{
  facebook: NetResult
  instagram: NetResult
  facebookStory: NetResult
  instagramStory: NetResult
  threads: NetResult
  links: { network: string; postId: string; postUrl: string | null }[]
}> {
  const toolUrl = `https://listmyai.com/tools/${tool.slug}`
  const postImage = instagramImagePath(tool.slug, tool.hook, 'https://listmyai.com')
  const storyImage = postImage.replace('format=portrait', 'format=story')
  const tags = [tool.category, 'AI', 'AITools', 'ArtificialIntelligence'].filter(Boolean) as string[]
  const { FACEBOOK_PAGE_ID: pageId, FACEBOOK_PAGE_ACCESS_TOKEN: token, INSTAGRAM_BUSINESS_ID: igId } = process.env
  const noMeta: NetResult = { ok: false, error: 'Facebook/Instagram env vars not configured' }

  // The cards take seconds to render cold. Build both first so the networks'
  // downloads hit the cached copies instead of timing out.
  await Promise.all([postImage, storyImage].map(u =>
    fetch(u, { signal: AbortSignal.timeout(45_000) }).catch(() => null)))

  const headline = tool.hook ? `${tool.hook} ⚡` : `🚀 New on ListmyAI: ${tool.name}`
  const fbMessage = [
    headline, '', `${tool.name} — ${truncate(tool.tagline, 200)}`, '',
    `👉 ${toolUrl}`, '', buildHashtags(tags, 5),
  ].join('\n')
  const threadsText = [
    headline, '', `${tool.name} — ${truncate(tool.tagline, 180)}`, '', toolUrl,
  ].join('\n')

  const facebook = (async (): Promise<NetResult> => {
    if (!pageId || !token) return noMeta
    try {
      // A photo post shows our card; a link post would show whatever image
      // the tool page's own metadata points at.
      const r = await graphPost(`${pageId}/photos`, { url: postImage, caption: fbMessage, access_token: token })
      const postId = r.post_id ?? r.id
      return { ok: true, id: postId, url: facebookPostUrl(postId) }
    } catch (e) { return { ok: false, error: String(e) } }
  })()

  const facebookStory = (async (): Promise<NetResult> => {
    if (!pageId || !token) return noMeta
    try {
      const photo = await graphPost(`${pageId}/photos`, { url: storyImage, published: false, access_token: token })
      const story = await graphPost(`${pageId}/photo_stories`, { photo_id: photo.id, access_token: token })
      return { ok: true, id: story.post_id ?? photo.id }
    } catch (e) { return { ok: false, error: String(e) } }
  })()

  const instagram = !igId || !token ? Promise.resolve(noMeta) : igPublish(igId, token, {
    image_url: postImage,
    caption: instagramCaption({
      name: tool.name, tagline: truncate(tool.tagline, 180), hook: tool.hook,
      slug: tool.slug, category: tool.category,
    }),
  })

  const instagramStory = !igId || !token ? Promise.resolve(noMeta)
    : igPublish(igId, token, { image_url: storyImage, media_type: 'STORIES' })

  const threads = postToThreads(threadsText, postImage)

  const [fb, fbs, ig, igs, th] = await Promise.all([facebook, facebookStory, instagram, instagramStory, threads])

  // Permalinks, so an owner can open the actual post rather than take our word.
  const links: { network: string; postId: string; postUrl: string | null }[] = []
  if (fb.ok && fb.id) links.push({ network: 'facebook', postId: fb.id, postUrl: fb.url ?? null })
  if (ig.ok && ig.id && token) links.push({ network: 'instagram', postId: ig.id, postUrl: await instagramPermalink(ig.id, token) })
  if (igs.ok && igs.id) links.push({ network: 'instagram_story', postId: igs.id, postUrl: null })
  if (fbs.ok && fbs.id) links.push({ network: 'facebook_story', postId: fbs.id, postUrl: null })
  if (th.ok && th.id) links.push({ network: 'threads', postId: th.id, postUrl: th.url ?? null })

  for (const [name, r] of Object.entries({ facebook: fb, facebookStory: fbs, instagram: ig, instagramStory: igs, threads: th })) {
    if (!r.ok) console.warn(`[announce] ${name} failed: ${r.error}`)
  }

  return { facebook: fb, instagram: ig, facebookStory: fbs, instagramStory: igs, threads: th, links }
}
