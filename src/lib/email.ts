// Thin wrapper around Resend. Falls back to console.log in dev when RESEND_API_KEY is absent.

const FROM = 'ListmyAI <noreply@listmyai.com>'

interface SendOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendOptions) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log('[email] No RESEND_API_KEY — would send to', to, ':', subject)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

// ── Email templates ──────────────────────────────────────────────────────────

const BASE = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:Inter,sans-serif;color:#e2e8f0">
  <div style="max-width:560px;margin:40px auto;background:#161b27;border-radius:16px;border:1px solid #1e2a3a;overflow:hidden">
    <div style="background:#e94560;padding:24px 32px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px">ListmyAI</span>
    </div>
    <div style="padding:32px">
      ${content}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #1e2a3a;font-size:12px;color:#64748b">
      ListmyAI — The AI Tools Directory · <a href="https://listmyai.com/unsubscribe" style="color:#e94560;text-decoration:none">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`

const BTN = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:20px;background:#e94560;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px">${label}</a>`

const H1 = (text: string) => `<h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#fff">${text}</h1>`
const P  = (text: string) => `<p style="margin:12px 0;font-size:14px;line-height:1.6;color:#94a3b8">${text}</p>`

export function claimWelcomeEmail(toolName: string, appUrl: string) {
  return BASE(`
    ${H1(`You've claimed "${toolName}"`)}
    ${P(`Welcome to ListmyAI! Your listing is now linked to your account. You can manage it from your dashboard — update the description, add promotions, and track views.`)}
    ${P(`Your listing is <strong style="color:#fff">free for the first 6 months</strong>. We'll remind you before it expires.`)}
    ${BTN(`${appUrl}/dashboard`, 'Go to Dashboard')}
  `)
}

export function autoEnrollWelcomeEmail(toolName: string, website: string, claimUrl: string) {
  return BASE(`
    ${H1(`"${toolName}" has been listed on ListmyAI`)}
    ${P(`We automatically discovered and listed <strong style="color:#fff">${toolName}</strong> (${website}) in our AI tools directory.`)}
    ${P(`If you own this product, claim it for free to manage the listing, add promotional offers, and view analytics.`)}
    ${P(`Listings are free for the first 6 months after claiming.`)}
    ${BTN(claimUrl, 'Claim This Listing')}
    ${P(`If you don't want your product listed, <a href="${claimUrl}?action=remove" style="color:#e94560">request removal here</a>.`)}
  `)
}

export function trialReminderEmail(toolName: string, daysLeft: number, upgradeUrl: string) {
  return BASE(`
    ${H1(`Your free listing expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`)}
    ${P(`Your free period for <strong style="color:#fff">${toolName}</strong> is ending soon. After it expires, your listing will be deprioritized in search results.`)}
    ${P(`Upgrade to keep your listing active and unlock featured placement, promo codes, and detailed analytics.`)}
    ${BTN(upgradeUrl, 'Upgrade Now')}
    ${P(`Questions? Reply to this email — we're happy to help.`)}
  `)
}

export function trialExpiredEmail(toolName: string, upgradeUrl: string) {
  return BASE(`
    ${H1(`Your free listing period has ended`)}
    ${P(`The free period for <strong style="color:#fff">${toolName}</strong> has expired. Your listing is still visible but deprioritized.`)}
    ${BTN(upgradeUrl, 'Reactivate Listing')}
  `)
}
