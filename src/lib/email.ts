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

export function claimVerificationEmail(toolName: string, claimantName: string, verifyUrl: string, appUrl: string) {
  return BASE(`
    ${H1(`Verify your claim for "${toolName}"`)}
    ${P(`Hi ${claimantName},`)}
    ${P(`We received a request to claim the <strong style="color:#fff">${toolName}</strong> listing on ListmyAI. Since your email matches the tool's domain, we just need you to confirm by clicking the button below.`)}
    ${BTN(verifyUrl, 'Verify & Claim Listing')}
    ${P(`This link expires in <strong style="color:#fff">48 hours</strong>. If you didn't request this, you can safely ignore this email.`)}
    <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid #1e2a3a;border-radius:12px">
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">What happens next?</p>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">Once verified, your listing will be linked to your account. You'll be able to update the description, add promotional offers, view analytics, and more — all <strong style="color:#fff">free for 6 months</strong>.</p>
    </div>
    ${P(`If the button doesn't work, copy and paste this URL into your browser:`)}
    <p style="margin:8px 0;font-size:12px;color:#64748b;word-break:break-all"><a href="${verifyUrl}" style="color:#e94560;text-decoration:none">${verifyUrl}</a></p>
  `)
}

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
    ${P(`If you don't want your product listed, <a href="mailto:listmyai@gmail.com?subject=Remove listing: ${toolName}&body=Please remove ${toolName} (${website}) from ListmyAI." style="color:#e94560">request removal here</a>.`)}
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

export function submissionConfirmationEmail(
  contactName: string,
  toolName: string,
  contactEmail: string,
  appUrl: string,
) {
  return BASE(`
    ${H1(`🎉 "${toolName}" has been submitted!`)}
    ${P(`Hi ${contactName || 'there'},`)}
    ${P(`Thanks for submitting <strong style="color:#fff">${toolName}</strong> to ListmyAI. We've received your listing and our team will review it within <strong style="color:#fff">1–2 business days</strong>.`)}
    ${P(`Once approved, your tool will be live in the directory and visible to thousands of AI enthusiasts. Your <strong style="color:#fff">6-month free listing period</strong> starts from approval.`)}
    <div style="margin:20px 0;padding:16px;background:rgba(233,69,96,0.08);border:1px solid rgba(233,69,96,0.2);border-radius:12px">
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Submitted as</p>
      <p style="margin:0;font-size:14px;color:#fff;font-weight:600">${contactEmail}</p>
    </div>
    ${P(`Want to track your listing, update details, or add a promo code? Create a free account with this email address:`)}
    ${BTN(`${appUrl}/register`, 'Create Your Account')}
    ${P(`Questions? Just reply to this email — we're happy to help.`)}
  `)
}

export function adminNewListingEmail(
  toolName: string,
  website: string,
  contactName: string,
  contactEmail: string,
  category: string,
  pricingModel: string,
  appUrl: string,
) {
  return BASE(`
    ${H1(`🆕 New listing submitted: "${toolName}"`)}
    ${P(`A new AI tool has been submitted and is waiting for your review.`)}
    <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid #1e2a3a;border-radius:12px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:6px 0;color:#64748b;width:120px">Tool name</td><td style="color:#fff;font-weight:600">${toolName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Website</td><td><a href="${website}" style="color:#e94560;text-decoration:none">${website}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Category</td><td style="color:#fff">${category}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Pricing</td><td style="color:#fff">${pricingModel}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Contact name</td><td style="color:#fff">${contactName || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Contact email</td><td><a href="mailto:${contactEmail}" style="color:#e94560;text-decoration:none">${contactEmail}</a></td></tr>
      </table>
    </div>
    ${BTN(`${appUrl}/admin/listings`, 'Review in Admin Panel')}
    ${P(`Approve or reject this listing from the admin panel.`)}
  `)
}

export function welcomeEmail(name: string, appUrl: string) {
  return BASE(`
    ${H1(`Welcome to ListmyAI, ${name || 'there'}! 👋`)}
    ${P(`Your account is all set. You can now manage your AI tool listings, track views, add promo codes, and upgrade your plan.`)}
    ${BTN(`${appUrl}/dashboard`, 'Go to Dashboard')}
    ${P(`If you've already submitted a tool, it will appear in your dashboard once approved.`)}
  `)
}

export function adminNewUserEmail(
  userName: string,
  userEmail: string,
  appUrl: string,
) {
  return BASE(`
    ${H1(`👤 New user registered`)}
    ${P(`A new user has just signed up on ListmyAI.`)}
    <div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid #1e2a3a;border-radius:12px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:6px 0;color:#64748b;width:120px">Name</td><td style="color:#fff;font-weight:600">${userName || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Email</td><td><a href="mailto:${userEmail}" style="color:#e94560;text-decoration:none">${userEmail}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Time</td><td style="color:#fff">${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
      </table>
    </div>
    ${BTN(`${appUrl}/admin/users`, 'View in Admin Panel')}
  `)
}

export function passwordResetEmail(resetUrl: string) {
  return BASE(`
    ${H1(`Reset your password`)}
    ${P(`We received a request to reset your ListmyAI password. Click the button below to choose a new one.`)}
    ${BTN(resetUrl, 'Reset Password')}
    ${P(`This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.`)}
  `)
}
