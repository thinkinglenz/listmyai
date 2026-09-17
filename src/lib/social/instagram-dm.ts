// Instagram comment → DM automation.
//
//   1. Someone comments on a post about a tool.
//   2. We reply publicly ("check your DMs") and send a private reply with a
//      "Send me the link" button.
//   3. They tap it. That tap is a message to us, which is what Instagram
//      requires before it will say whether a person follows the account.
//   4. Followers get the tool's link; everyone else is asked to follow and
//      tap again.
//
// Instagram allows one private reply per comment, within 7 days of it. After
// the person taps the button a normal 24-hour messaging window is open, so
// the link and any follow-up can be sent.

import { createClient } from '@supabase/supabase-js'

const GRAPH = 'https://graph.facebook.com/v23.0'
const SITE = 'https://listmyai.com'
export const LINK_PAYLOAD = 'SEND_LINK:'

function env() {
  const { FACEBOOK_PAGE_ID: pageId, FACEBOOK_PAGE_ACCESS_TOKEN: token, INSTAGRAM_BUSINESS_ID: igId } = process.env
  return { pageId, token, igId }
}

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface Tool { id: string; slug: string; name: string; tagline: string | null }

async function graph(path: string, init?: { method?: string; body?: unknown }) {
  const { token } = env()
  const url = `${GRAPH}/${path}${path.includes('?') ? '&' : '?'}access_token=${token}`
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `Graph ${res.status}`)
  return data
}

// ── Which tool is this post about? ───────────────────────────────────────────

const TOOL_SELECT = 'id, slug, name, tagline'

export async function toolForMedia(mediaId: string): Promise<Tool | null> {
  const supabase = db()

  // Posts published by the automation are recorded with their media id.
  const { data: posted } = await supabase
    .from('tool_social_posts')
    .select(`ai_tools(${TOOL_SELECT})`)
    .eq('network', 'instagram')
    .eq('post_id', mediaId)
    .limit(1)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromLog = (posted as any)?.ai_tools
  if (fromLog) return Array.isArray(fromLog) ? fromLog[0] : fromLog

  // Posted by hand: the caption carries the tool's URL (the admin caption
  // includes it for exactly this reason), or on older posts at least its name.
  let caption = ''
  try {
    caption = (await graph(`${mediaId}?fields=caption`)).caption ?? ''
  } catch {
    return null
  }

  let tool: Tool | null = null
  const slug = caption.match(/listmyai\.com\/tools\/([a-z0-9][a-z0-9-]*)/i)?.[1]
  if (slug) {
    const { data } = await supabase.from('ai_tools').select(TOOL_SELECT).eq('slug', slug.toLowerCase()).maybeSingle()
    tool = data
  }
  if (!tool) {
    // Captions carry a "Name — tagline" line. The headline above it may also
    // contain a dash, so every such line is tried against real listings.
    const names = [...caption.matchAll(/^\s*(?:🚀\s*)?([^\n—–]{2,60}?)\s+[—–]\s/gm)].map(m => m[1].trim())
    for (const name of names) {
      const { data } = await supabase.from('ai_tools').select(TOOL_SELECT)
        .ilike('name', name.replace(/[%_\\]/g, c => `\\${c}`)).eq('status', 'active').limit(1).maybeSingle()
      if (data) { tool = data; break }
    }
  }

  // Remember it, so the next comment on this post skips the lookup.
  if (tool) {
    await supabase.from('tool_social_posts').insert({
      tool_id: tool.id, network: 'instagram', post_id: mediaId, source: 'manual',
    }).then(() => {}, () => {})
  }
  return tool
}

// ── Messages ────────────────────────────────────────────────────────────────

function linkButtonMessage(text: string, payload: string) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text.slice(0, 640),
        buttons: [{ type: 'postback', title: 'Send me the link', payload }],
      },
    },
  }
}

const UTM = 'utm_source=instagram&utm_medium=dm&utm_campaign=comment_to_dm'

function linkMessage(text: string, tool: Tool | null) {
  const url = tool ? `${SITE}/tools/${tool.slug}?${UTM}` : `${SITE}/?${UTM}`
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: text.slice(0, 640),
        buttons: [{ type: 'web_url', url, title: tool ? `Open ${tool.name}`.slice(0, 20) : 'Open ListmyAI' }],
      },
    },
  }
}

async function sendMessage(recipient: { id: string } | { comment_id: string }, message: unknown) {
  const { pageId } = env()
  return graph(`${pageId}/messages`, { method: 'POST', body: { recipient, message } })
}

// ── Step 1: a comment arrived ───────────────────────────────────────────────

export interface CommentEvent {
  commentId: string
  mediaId: string
  fromId: string
  username?: string
  text?: string
}

export async function handleComment(ev: CommentEvent): Promise<string> {
  const { igId, pageId, token } = env()
  if (!igId || !pageId || !token) return 'not configured'
  if (ev.fromId === igId) return 'own comment'

  const supabase = db()

  // Claim the (post, person) pair first. The unique constraints make a
  // duplicate webhook or a second comment a no-op instead of a second DM.
  const { error: claimErr } = await supabase.from('instagram_comment_dms').insert({
    comment_id: ev.commentId, media_id: ev.mediaId, ig_user_id: ev.fromId,
    username: ev.username ?? null, comment_text: ev.text?.slice(0, 500) ?? null,
  })
  if (claimErr) return 'already handled'

  const tool = await toolForMedia(ev.mediaId)
  const who = ev.username ? `@${ev.username}` : 'there'

  // Checking whether someone follows the account needs Advanced Access to
  // instagram_manage_messages ("recipient user does not have role on app"
  // otherwise), so until Meta grants it every commenter gets the link now,
  // with a nudge to follow. INSTAGRAM_FOLLOW_GATE=on restores the
  // tap-to-check flow for followers only.
  const gated = process.env.INSTAGRAM_FOLLOW_GATE === 'on'

  try {
    if (gated || !tool) {
      const text = tool
        ? `Hey ${who}! 👋 Thanks for commenting. Tap below (or just reply "${tool.name}") and we'll send you the link.`
        : `Hey ${who}! 👋 Thanks for commenting. Tap below and we'll send you the link.`
      await sendMessage({ comment_id: ev.commentId }, linkButtonMessage(text, `${LINK_PAYLOAD}${tool?.slug ?? ''}`))
    } else {
      await sendMessage({ comment_id: ev.commentId }, linkMessage(
        `Hey ${who}! 👋 Here's ${tool.name}${tool.tagline ? ` — ${tool.tagline}` : ''}\n\nFollow @listmyai so you never miss a new AI tool 🚀`,
        tool,
      ))
    }
    await supabase.from('instagram_comment_dms')
      .update({
        tool_id: tool?.id ?? null,
        status: !tool ? 'no_tool' : gated ? 'invited' : 'link_sent',
        updated_at: new Date().toISOString(),
      })
      .eq('comment_id', ev.commentId)
  } catch (e) {
    await supabase.from('instagram_comment_dms')
      .update({ status: 'failed', error: String(e).slice(0, 500), updated_at: new Date().toISOString() })
      .eq('comment_id', ev.commentId)
    return `private reply failed: ${e}`
  }

  // Public reply, so others see that commenting works. Best-effort.
  await graph(`${ev.commentId}/replies`, {
    method: 'POST',
    body: { message: `Sent to your DMs ${who} 📩` },
  }).catch(() => {})

  return tool && !gated ? 'link sent' : 'invited'
}

// ── Step 2: they tapped "Send me the link" (or replied in the DM) ──────────

export async function handleLinkRequest(senderId: string, slug: string | null): Promise<string> {
  const { igId, token } = env()
  if (!igId || !token) return 'not configured'
  if (senderId === igId) return 'own message'

  const supabase = db()

  // A typed reply has no payload, so use the tool from their latest comment.
  let tool: Tool | null = null
  if (slug) {
    const { data } = await supabase.from('ai_tools').select(TOOL_SELECT).eq('slug', slug).maybeSingle()
    tool = data
  } else {
    const { data } = await supabase.from('instagram_comment_dms')
      .select(`ai_tools(${TOOL_SELECT})`).eq('ig_user_id', senderId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rel = (data as any)?.ai_tools
    tool = rel ? (Array.isArray(rel) ? rel[0] : rel) : null
  }

  // Only possible now that they have messaged us.
  let follows = false
  try {
    follows = Boolean((await graph(`${senderId}?fields=is_user_follow_business`)).is_user_follow_business)
  } catch {
    follows = false
  }

  const setStatus = (status: string) =>
    supabase.from('instagram_comment_dms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('ig_user_id', senderId)
      .in('status', ['invited', 'asked_to_follow', 'no_tool'])
      .then(() => {}, () => {})

  if (!follows) {
    await sendMessage({ id: senderId }, linkButtonMessage(
      `This link is for our followers 💜 Follow @listmyai, then tap the button again and it's yours.`,
      `${LINK_PAYLOAD}${tool?.slug ?? ''}`,
    ))
    await setStatus('asked_to_follow')
    return 'asked to follow'
  }

  await sendMessage({ id: senderId }, linkMessage(
    tool
      ? `Here you go! 🚀 ${tool.name}${tool.tagline ? ` — ${tool.tagline}` : ''}`
      : `Here you go! 🚀 Discover 20,000+ AI tools on ListmyAI.`,
    tool,
  ))
  await setStatus('link_sent')
  return 'link sent'
}

// ── DM a tool's name ────────────────────────────────────────────────────────

// Posts say: DM us "Short.now" for the link. People type it loosely — quoted,
// lower-case, with a "please" — so compare on letters and digits only.
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export async function toolNamedIn(text: string): Promise<string | null> {
  const cleaned = text.replace(/["“”'‘’]/g, ' ').replace(/\b(link|please|pls|send|me|the|for|to)\b/gi, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.length > 60) return null
  const target = squash(cleaned)
  if (target.length < 2) return null

  const supabase = db()
  // Exact name first (case-insensitive), then the slug form.
  const escaped = cleaned.replace(/[%_\\]/g, m => `\\${m}`)
  const { data: byName } = await supabase.from('ai_tools').select('slug, name')
    .eq('status', 'active').ilike('name', escaped).limit(5)
  const hit = (byName ?? []).find(t => squash(t.name) === target) ?? byName?.[0]
  if (hit) return hit.slug

  const { data: bySlug } = await supabase.from('ai_tools').select('slug')
    .eq('status', 'active').in('slug', [target, cleaned.toLowerCase().replace(/\s+/g, '-')]).limit(1)
  if (bySlug?.[0]) return bySlug[0].slug

  // Names like "Short.now" squash to "shortnow"; compare against tools whose
  // name starts the same way rather than scanning the whole catalogue.
  const { data: similar } = await supabase.from('ai_tools').select('slug, name')
    .eq('status', 'active').ilike('name', `${escaped.slice(0, 3)}%`).limit(200)
  return (similar ?? []).find(t => squash(t.name) === target)?.slug ?? null
}
