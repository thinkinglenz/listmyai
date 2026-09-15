// Meta webhook for the Instagram account: comments and DMs.
//
// GET  — the one-time verification handshake when the webhook is added in the
//        Meta app dashboard.
// POST — events. Every request is checked against the app secret signature,
//        because this endpoint sends messages on the account's behalf.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { handleComment, handleLinkRequest, LINK_PAYLOAD } from '@/lib/social/instagram-dm'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams
  const expected = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  if (expected && q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === expected) {
    return new NextResponse(q.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

function signatureValid(raw: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(raw).digest('hex'))
  const given = Buffer.from(header.slice('sha256='.length))
  return expected.length === given.length && timingSafeEqual(expected, given)
}

// A DM reply counts as asking for the link when it says so, so people who type
// instead of tapping the button are not ignored.
const ASKS_FOR_LINK = /\b(link|yes|yeah|yep|send|followed|done|ok|okay)\b/i

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!signatureValid(raw, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = JSON.parse(raw) } catch { return NextResponse.json({ ok: true }) }
  if (body.object !== 'instagram') return NextResponse.json({ ok: true })

  const results: string[] = []

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue
      const v = change.value ?? {}
      // Replies to comments carry parent_id; answering those too would DM
      // people who were only talking to someone else.
      if (!v.id || !v.media?.id || !v.from?.id || v.parent_id) continue
      results.push(await handleComment({
        commentId: v.id, mediaId: v.media.id, fromId: v.from.id, username: v.from.username, text: v.text,
      }).catch(e => `error: ${e}`))
    }

    for (const m of entry.messaging ?? []) {
      const senderId = m.sender?.id
      if (!senderId || m.message?.is_echo) continue
      const payload: string | undefined = m.postback?.payload
      if (payload?.startsWith(LINK_PAYLOAD)) {
        results.push(await handleLinkRequest(senderId, payload.slice(LINK_PAYLOAD.length) || null).catch(e => `error: ${e}`))
      } else if (m.message?.text && ASKS_FOR_LINK.test(m.message.text)) {
        results.push(await handleLinkRequest(senderId, null).catch(e => `error: ${e}`))
      }
    }
  }

  // Always 200 once the signature checks out: Meta retries failures and
  // eventually disables a webhook that keeps returning errors.
  return NextResponse.json({ ok: true, results })
}
