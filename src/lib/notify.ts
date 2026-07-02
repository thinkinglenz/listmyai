// Owner engagement notifications — emails the owner of a claimed/submitted
// listing when it receives an upvote, rating, comment, or a views milestone.
import { createClient } from '@supabase/supabase-js'
import { sendEmail, ownerEngagementEmail } from './email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type EngagementEvent =
  | { type: 'upvote' }
  | { type: 'rating'; rating: number }
  | { type: 'comment'; authorName: string; body: string }
  | { type: 'views'; count: number }

interface ToolRef { id?: string; slug?: string }

/**
 * Fire-and-forget: never throws. Call as notifyToolOwner(...).catch(() => {})
 * anyway to be safe in route handlers.
 */
export async function notifyToolOwner(ref: ToolRef, event: EngagementEvent) {
  try {
    let query = supabase
      .from('ai_tools')
      .select('id, slug, name, claimed_by, submitted_by, contact_email')
    if (ref.id) query = query.eq('id', ref.id)
    else if (ref.slug) query = query.eq('slug', ref.slug)
    else return

    const { data: tool } = await query.maybeSingle()
    if (!tool) return

    // Only notify listings that actually have an owner
    const ownerId = tool.claimed_by || tool.submitted_by
    let ownerEmail: string | null = null
    if (ownerId) {
      const { data } = await supabase.auth.admin.getUserById(ownerId)
      ownerEmail = data?.user?.email ?? null
    }
    ownerEmail = ownerEmail ?? tool.contact_email ?? null
    if (!ownerEmail) return

    const toolUrl = `${APP_URL}/tools/${tool.slug}`
    let subject = ''
    let headline = ''
    let bodyText = ''
    let detailHtml = ''

    switch (event.type) {
      case 'upvote':
        subject = `👍 ${tool.name} just received an upvote`
        headline = `Someone upvoted ${tool.name}!`
        bodyText = `A visitor on ListmyAI just upvoted your listing. Upvotes push your tool higher in the trending rankings.`
        break
      case 'rating':
        subject = `⭐ New ${event.rating}-star rating for ${tool.name}`
        headline = `${tool.name} got a ${event.rating}-star rating!`
        bodyText = `A visitor just rated your listing ${event.rating} out of 5 stars.`
        break
      case 'comment':
        subject = `💬 New comment on ${tool.name}`
        headline = `${event.authorName} commented on ${tool.name}`
        bodyText = `A new comment was just published on your listing:`
        detailHtml = `
          <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid #1e2a3a;border-radius:12px">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#e2e8f0">&ldquo;${escapeHtml(event.body).slice(0, 500)}&rdquo;</p>
            <p style="margin:8px 0 0;font-size:12px;color:#64748b">— ${escapeHtml(event.authorName)}</p>
          </div>`
        break
      case 'views':
        subject = `🎉 ${tool.name} just crossed ${event.count.toLocaleString()} views`
        headline = `${event.count.toLocaleString()} views and counting!`
        bodyText = `Your listing on ListmyAI has now been viewed ${event.count.toLocaleString()} times. Log in to see your stats, add a promo code, or refresh your listing details.`
        break
    }

    await sendEmail({
      to: ownerEmail,
      subject,
      html: ownerEngagementEmail(tool.name, headline, bodyText, detailHtml, toolUrl),
    })
  } catch (err) {
    console.error('[notifyToolOwner]', err)
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
