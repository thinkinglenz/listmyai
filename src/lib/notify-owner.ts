// Tells a listing owner that an admin changed their listing.
//
// Claimed listings only, by design: an unclaimed tool has no owner to inform,
// and scraped entries would generate mail nobody asked for.
//
// This is transactional — it concerns the recipient's own listing — so it does
// not go through the marketing path and is not gated on marketing consent.

import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  tagline: 'Tagline',
  description: 'Description',
  website: 'Website',
  logo_url: 'Logo',
  cover_url: 'Preview image',
  category_id: 'Category',
  status: 'Status',
  pricing_model: 'Pricing model',
}

export async function notifyOwnerOfEdit(toolId: string, changedFields: string[]) {
  const fields = changedFields.filter(f => f in FIELD_LABELS)
  if (fields.length === 0) return { ok: false, skipped: 'No notifiable fields changed' }

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('name, slug, claimed, claimed_by')
    .eq('id', toolId)
    .maybeSingle()

  if (!tool?.claimed || !tool.claimed_by) {
    return { ok: false, skipped: 'Listing is not claimed' }
  }

  const { data: userRes } = await supabase.auth.admin.getUserById(tool.claimed_by)
  const email = userRes?.user?.email
  const listingUrl = `https://listmyai.com/dashboard/edit/${tool.slug}`
  const changed = fields.map(f => FIELD_LABELS[f]).join(', ')

  // The in-app record first: it is the durable copy, and it should exist even
  // if the mail bounces.
  await supabase.from('notifications').insert({
    user_id: tool.claimed_by,
    type: 'listing_edited',
    title: `Your listing "${tool.name}" was updated`,
    body: `A ListmyAI admin updated: ${changed}. Review the changes and edit anything that isn't right.`,
    link: `/dashboard/edit/${tool.slug}`,
  })

  if (!email) return { ok: true, emailed: false }

  try {
    await sendEmail({
      to: email,
      subject: `Your ListmyAI listing "${tool.name}" was updated`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:520px;margin:0 auto">
          <h2 style="color:#fff;margin:0 0 14px">We updated your listing</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 18px">
            A ListmyAI admin made changes to <strong style="color:#fff">${tool.name}</strong>
            to keep the directory accurate.
          </p>
          <div style="background:#161b27;border:1px solid #1e2a3a;border-left:3px solid #e94560;border-radius:8px;padding:14px 16px;margin-bottom:20px">
            <p style="color:#e2e8f0;margin:0;font-size:14px">Changed: ${changed}</p>
          </div>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px">
            You own this listing, so you can change anything back or refine it yourself.
          </p>
          <a href="${listingUrl}"
             style="display:inline-block;background:#e94560;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            Review your listing
          </a>
          <p style="color:#475569;font-size:12px;margin:26px 0 0">
            This is a notification about your own listing, not marketing.
          </p>
        </div>`,
    })
    return { ok: true, emailed: true }
  } catch (err) {
    console.warn('[notify-owner] email failed:', err)
    return { ok: true, emailed: false }
  }
}
