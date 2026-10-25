// Telling an owner their editorial is live.
//
// Only ever called when a human publishes one from /admin/editorials. It is
// transactional — it concerns the recipient's own listing — so it does not go
// through the marketing path and is not gated on marketing consent, matching
// how listing-edit notices already work.
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function notifyOwnerOfEditorial(
  toolId: string | null,
  editorialSlug: string,
  title: string,
): Promise<{ ok: boolean; emailed?: boolean; skipped?: string }> {
  if (!toolId) return { ok: false, skipped: 'Editorial is not linked to a listing' }

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('name, slug, claimed, claimed_by')
    .eq('id', toolId)
    .maybeSingle()

  // An unclaimed listing has nobody to tell, exactly as with listing edits.
  if (!tool?.claimed || !tool.claimed_by) return { ok: false, skipped: 'Listing is not claimed' }

  const url = `https://listmyai.com/editorial/${editorialSlug}`

  // The in-app record first: it is the durable copy, and it should exist even
  // if the mail bounces.
  await supabase.from('notifications').insert({
    user_id: tool.claimed_by,
    type: 'editorial_published',
    title: `We published an editorial about ${tool.name}`,
    body: 'Written independently from third-party sources. If anything is wrong, send us a correction.',
    link: `/editorial/${editorialSlug}`,
  })

  const { data: userRes } = await supabase.auth.admin.getUserById(tool.claimed_by)
  const email = userRes?.user?.email
  if (!email) return { ok: true, emailed: false }

  try {
    await sendEmail({
      to: email,
      subject: `We wrote about ${tool.name}`,
      html: `
        <div style="font-family:Inter,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:560px;margin:0 auto">
          <h2 style="color:#fff;margin:0 0 14px">${title}</h2>
          <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 18px">
            We've published an editorial about <strong style="color:#fff">${tool.name}</strong>.
            It was written independently, from sources outside your own marketing, and it was not
            paid for. Where we found no independent coverage, the piece says so.
          </p>
          <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 22px">
            You didn't approve it and you can't edit it &mdash; that's what makes it worth reading.
            But if something in it is wrong, tell us and we'll correct the page.
          </p>
          <a href="${url}" style="display:inline-block;background:#e94560;color:#fff;text-decoration:none;
             padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px">Read the editorial</a>
          <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:24px 0 0">
            While you're here: your dashboard has a Promote section, and everything in it is free
            during our launch &mdash; including 24 hours in the homepage spotlight.
          </p>
          <p style="margin:14px 0 0">
            <a href="https://listmyai.com/dashboard" style="color:#e94560;font-size:14px">Open your dashboard</a>
          </p>
          <p style="color:#5b6678;font-size:12px;line-height:1.6;margin:26px 0 0">
            You're getting this because you claimed ${tool.name} on ListmyAI.
          </p>
        </div>`,
    })
    return { ok: true, emailed: true }
  } catch {
    // The notification row is already written, so the owner still sees it.
    return { ok: true, emailed: false }
  }
}
