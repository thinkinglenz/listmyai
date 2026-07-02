import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and cancellation policy for ListmyAI listings and subscriptions.',
  alternates: { canonical: 'https://listmyai.com/refund-policy' },
}

const SECTIONS = [
  {
    title: '1. Overview',
    body: `ListmyAI operates a fair and transparent refund policy. We want you to be satisfied with your listing or subscription. If you are not happy with your purchase for any reason, please contact us and we will do our best to make it right.`,
  },
  {
    title: '2. Free Listings',
    body: `Basic (free) listings are provided at no charge and are therefore not eligible for refunds. If you wish to remove a free listing, please contact listmyai@gmail.com and we will process the removal within 2 business days.`,
  },
  {
    title: '3. Pro Listings ($19/month)',
    body: `Pro listing subscribers may request a full refund within 7 days of their initial purchase. After 7 days, refunds are issued on a pro-rated basis for any unused full months remaining in the billing cycle. Monthly renewals are non-refundable once the renewal period has begun. To cancel auto-renewal, go to your Dashboard → Settings → Billing and click "Cancel Subscription".`,
  },
  {
    title: '4. Sponsored Listings ($99/month)',
    body: `Sponsored listing packages are eligible for a full refund within 48 hours of purchase, provided the listing has not yet been published or promoted. Once a sponsored listing is live and promotion has commenced, refunds are not available. If your listing is rejected for policy violations, a full refund will be issued automatically within 5 business days.`,
  },
  {
    title: '5. Annual Plans',
    body: `If we offer annual billing in the future, annual subscribers will be eligible for a full refund within 14 days of purchase. After 14 days, a pro-rated refund will be calculated based on unused months remaining. No refund will be issued if the account has violated our Terms of Service.`,
  },
  {
    title: '6. Promotions & Deals',
    body: `Listings or upgrades purchased at a promotional or discounted price are non-refundable unless they fall within the standard refund window outlined above. If a discount code was applied, the refund amount will reflect the actual amount paid, not the original list price.`,
  },
  {
    title: '7. Rejected Listings',
    body: `If your listing submission is rejected by our moderation team because it does not meet our quality standards or violates our policies, you will receive a full refund of any fee paid within 5 business days. You will receive an email explaining the reason for rejection.`,
  },
  {
    title: '8. How to Request a Refund',
    body: `To request a refund, email listmyai@gmail.com with:\n• Your registered email address\n• The listing name or order ID\n• The reason for your refund request\n\nWe aim to respond to all refund requests within 2 business days. Approved refunds are processed within 5–10 business days depending on your bank or card issuer.`,
  },
  {
    title: '9. Chargebacks',
    body: `We ask that you contact us before initiating a chargeback with your bank. Chargebacks initiated without prior contact may result in suspension of your ListmyAI account. We take fraud seriously and cooperate fully with financial institutions to resolve disputes fairly.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Refund Policy from time to time. Material changes will be communicated via email or a notice on our website. Continued use of ListmyAI services after changes are posted constitutes acceptance of the revised policy.`,
  },
  {
    title: '11. Contact',
    body: `Questions about refunds? Reach us at listmyai@gmail.com. We typically respond within 24 hours on business days.`,
  },
]

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0d1117', color: '#e2e8f0' }}>
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm transition hover:opacity-80"
            style={{ color: '#e94560' }}>
            ← Back to ListmyAI
          </Link>
          <h1 className="text-4xl font-black text-white">Refund Policy</h1>
          <p className="mt-2 text-slate-500">Last updated: May 2026</p>
        </div>

        {/* Intro box */}
        <div className="mb-10 rounded-2xl border p-5"
          style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.05)' }}>
          <p className="text-sm leading-relaxed text-slate-300">
            <strong className="text-white">Short version:</strong> You can get a full refund within <strong className="text-white">7 days</strong> of purchase for most paid plans. Rejected listings always get a full refund. If you have questions, email <a href="mailto:listmyai@gmail.com" className="underline" style={{ color: '#e94560' }}>listmyai@gmail.com</a>.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 className="mb-2 text-lg font-bold text-white">{s.title}</h2>
              <div className="text-sm leading-relaxed text-slate-400 whitespace-pre-line">{s.body}</div>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-wrap gap-4 border-t pt-8 text-sm" style={{ borderColor: '#1e2a3a' }}>
          {[
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Disclaimer', href: '/disclaimer' },
            { label: 'DMCA', href: '/dmca' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="text-slate-500 transition hover:text-white">{l.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
