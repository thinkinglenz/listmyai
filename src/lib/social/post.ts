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

export interface ToolAnnouncement {
  name: string
  slug: string
  tagline: string
  category?: string
}

/**
 * Announces a newly approved tool on Facebook and Instagram.
 *
 * Facebook gets a link post and scrapes the tool page's own OpenGraph image.
 * Instagram cannot post links at all, so it gets the rendered square card and
 * carries the URL in the caption instead.
 */
export async function announceToolToSocial(
  tool: ToolAnnouncement
): Promise<{ facebook: { ok: boolean; id?: string; error?: string }; instagram: { ok: boolean; id?: string; error?: string } }> {
  const toolUrl = `https://listmyai.com/tools/${tool.slug}`
  const imageUrl = `https://listmyai.com/api/tool-social/${tool.slug}`
  const tags = [tool.category, 'AI', 'AITools', 'ArtificialIntelligence'].filter(Boolean) as string[]

  const { FACEBOOK_PAGE_ID: pageId, FACEBOOK_PAGE_ACCESS_TOKEN: token, INSTAGRAM_BUSINESS_ID: igId } = process.env

  const facebook = await (async () => {
    if (!pageId || !token) return { ok: false, error: 'Facebook env vars not configured' }
    const message = [
      `🚀 New on ListmyAI: ${tool.name}`,
      '',
      truncate(tool.tagline, 200),
      '',
      `🔗 ${toolUrl}`,
      '',
      buildHashtags(tags, 5),
    ].join('\n')

    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link: toolUrl, access_token: token }),
      })
      const data = await res.json()
      if (!res.ok || data.error) return { ok: false, error: data.error?.message ?? JSON.stringify(data) }
      return { ok: true, id: data.id }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })()

  const instagram = await (async () => {
    if (!igId || !token) return { ok: false, error: 'Instagram env vars not configured' }
    const caption = [
      `🚀 New on ListmyAI: ${tool.name}`,
      '',
      truncate(tool.tagline, 180),
      '',
      `Find it at ${toolUrl}`,
      '',
      buildHashtags(tags, 8),
    ].join('\n')

    try {
      const containerRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
      })
      const container = await containerRes.json()
      if (!containerRes.ok || container.error) {
        return { ok: false, error: container.error?.message ?? JSON.stringify(container) }
      }

      const publishRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: token }),
      })
      const published = await publishRes.json()
      if (!publishRes.ok || published.error) {
        return { ok: false, error: published.error?.message ?? JSON.stringify(published) }
      }
      return { ok: true, id: published.id }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })()

  return { facebook, instagram }
}
