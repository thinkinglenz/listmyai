// One-off announcement to listing owners: the homepage spotlight is available.
//
// Sent as a service update about a listing the recipient already owns, not as
// a cold pitch — which is why it goes to owners only and never to the wider
// user table. It carries an opt-in link so anyone who wants ongoing marketing
// can say so, and that consent is what future campaigns will rely on.
//
// Defaults to a dry run: POST { "send": true } to actually deliver.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { signOptIn } from '@/lib/marketing/optin-token'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE = 'https://listmyai.com'

function body(firstName: string, toolName: string, email: string): string {
  const optIn = `${SITE}/api/marketing/opt-in?e=${encodeURIComponent(email)}&t=${signOptIn(email)}&n=${encodeURIComponent(firstName)}`
  return `
  <div style="font-family:Inter,-apple-system,sans-serif;background:#0d1117;padding:40px;border-radius:16px;max-width:560px;margin:0 auto">
    <h2 style="color:#fff;margin:0 0 16px;font-size:22px">Your listing can be on our homepage — free</h2>

    <p style="color:#94a3b8;margin:0 0 18px;font-size:14px;line-height:1.65">
      Hi ${firstName}, we've added a spotlight at the top of the ListmyAI homepage — one listing
      at a time, above everything else, for 24 hours.
    </p>

    <div style="background:#161b27;border:1px solid #1e2a3a;border-left:3px solid #e94560;border-radius:8px;padding:16px 18px;margin-bottom:20px">
      <p style="color:#e2e8f0;margin:0 0 6px;font-size:14px;font-weight:600">
        ${toolName} can take the spot right now
      </p>
      <p style="color:#94a3b8;margin:0;font-size:13px;line-height:1.6">
        It's a complimentary placement while we're rolling this out — no card, nothing to pay.
        Claim it from your dashboard, and take it back whenever it's free.
      </p>
    </div>

    <p style="color:#94a3b8;margin:0 0 20px;font-size:14px;line-height:1.65">
      You'll see how many people saw it and clicked through, in your dashboard.
    </p>

    <a href="${SITE}/dashboard#spotlight"
       style="display:inline-block;background:#e94560;color:#fff;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;font-size:14px">
      Claim the spotlight
    </a>

    <!-- Above the footer, where it is actually read. -->
    <div style="margin-top:26px;background:rgba(233,69,96,0.06);border:1px solid rgba(233,69,96,0.25);border-radius:10px;padding:16px 18px">
      <p style="color:#e2e8f0;margin:0 0 8px;font-size:14px;font-weight:600">
        Want first refusal on the next slot?
      </p>
      <p style="color:#94a3b8;margin:0 0 12px;font-size:13px;line-height:1.6">
        We're adding more promotion placements. Tell us to keep you posted and you'll hear
        about them before they go public.
      </p>
      <a href="${optIn}"
         style="display:inline-block;background:rgba(233,69,96,0.15);border:1px solid rgba(233,69,96,0.4);color:#e94560;text-decoration:none;padding:9px 18px;border-radius:7px;font-weight:600;font-size:13px">
        Yes, keep me posted &rarr;
      </a>
    </div>

    <p style="color:#475569;margin:22px 0 0;font-size:11px;line-height:1.6">
      This email is about a listing you own on ListmyAI, so we've sent it whether or not you've
      signed up for marketing. We'll only send you offers if you tap the link above.
    </p>
  </div>`
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const { send = false, limit = 500 } = await req.json().catch(() => ({}))

  // Owners only. Someone with an account but no listing has no listing to
  // promote, so this would be marketing to them rather than a service update.
  const { data: tools, error } = await supabase
    .from('ai_tools')
    .select('name, claimed_by, submitted_by')
    .or('claimed_by.not.is.null,submitted_by.not.is.null')
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // One email per person, naming one of their listings.
  const byUser = new Map<string, string>()
  for (const t of tools ?? []) {
    const owner = t.claimed_by ?? t.submitted_by
    if (owner && !byUser.has(owner)) byUser.set(owner, t.name)
  }

  const recipients: { email: string; name: string; tool: string }[] = []
  for (const [userId, toolName] of byUser) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(userId)
      const email = u?.user?.email
      if (!email) continue
      const full = (u?.user?.user_metadata?.full_name as string) ?? ''
      recipients.push({ email, name: full.split(' ')[0] || 'there', tool: toolName })
    } catch { /* deleted account */ }
  }

  if (!send) {
    return NextResponse.json({
      dryRun: true,
      recipientCount: recipients.length,
      // Why the number is what it is: most registered users never listed
      // anything, and this email is about a listing you own.
      ownedListings: (tools ?? []).length,
      distinctOwners: byUser.size,
      ownersWithoutEmail: byUser.size - recipients.length,
      sample: recipients.slice(0, 5).map(r => ({ email: r.email, tool: r.tool })),
      previewHtml: recipients[0]
        ? body(recipients[0].name, recipients[0].tool, recipients[0].email)
        : null,
    })
  }

  let sent = 0
  const failures: string[] = []
  for (const r of recipients) {
    try {
      await sendEmail({
        to: r.email,
        subject: `${r.tool} can be on the ListmyAI homepage — free`,
        html: body(r.name, r.tool, r.email),
      })
      sent++
      // Gentle pacing so a burst does not trip the provider's rate limit.
      await new Promise(res => setTimeout(res, 120))
    } catch (e) {
      failures.push(`${r.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({ sent, attempted: recipients.length, failures })
}
