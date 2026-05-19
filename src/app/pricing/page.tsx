import Link from 'next/link'
import { Check, Zap, Star, Shield, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'for 6 months',
    desc: 'Everything you need to get discovered',
    color: '#64748b',
    cta: 'Get Started Free',
    href: '/register',
    highlight: false,
    features: [
      'Standard directory listing',
      'Basic tool profile page',
      'Category & tag placement',
      'View & upvote counters',
      'Community reviews',
      'ListmyAI badge',
    ],
    missing: [
      'Featured placement',
      'Promo code listings',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    desc: 'Maximise visibility and conversions',
    color: '#e94560',
    cta: 'Start with Pro',
    href: '/register?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      '⭐ Featured placement in directory',
      'Promo codes & deals listing',
      'Full analytics dashboard',
      'Click-through & referrer tracking',
      'Priority review queue',
      'Verified badge',
      'Priority email support',
    ],
    missing: [],
  },
  {
    name: 'Sponsored',
    price: '$99',
    period: 'per month',
    desc: 'Maximum exposure for serious growth',
    color: '#f59e0b',
    cta: 'Contact Sales',
    href: 'mailto:hello@listmyai.com',
    highlight: false,
    badge: 'Best Exposure',
    features: [
      'Everything in Pro',
      '🏆 Homepage banner placement',
      'Newsletter feature (12k+ subscribers)',
      'Category page hero slot',
      'Dedicated landing page',
      'Social media shoutout',
      'Direct sales introduction',
      'Dedicated account manager',
    ],
    missing: [],
  },
]

const FAQ = [
  {
    q: 'Is the free 6 months really free?',
    a: 'Yes — no credit card required. Every new listing gets a standard directory placement free for the first 6 months. After that, you can stay on the free tier with reduced visibility or upgrade to Pro.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Pro and Sponsored plans are month-to-month with no contracts. Cancel from your dashboard at any time.',
  },
  {
    q: 'What counts as "featured placement"?',
    a: 'Pro listings appear at the top of search results and directory pages, are included in the "Top AI Tools" homepage section, and receive a Featured badge that increases click-through rates significantly.',
  },
  {
    q: 'How does the Sponsored newsletter feature work?',
    a: 'We send a weekly digest to 12,000+ subscribers. Sponsored tools get a dedicated section in one edition per month, including your logo, description, and a direct link.',
  },
  {
    q: 'We were auto-enrolled — do we have to pay?',
    a: 'No. Auto-enrolled tools are listed for free indefinitely at the standard (free) tier. You only pay if you want featured placement or additional benefits.',
  },
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Zap className="h-3.5 w-3.5" /> First 6 months free — no card needed
        </div>
        <h1 className="text-4xl font-black text-white">Simple, transparent pricing</h1>
        <p className="mt-3 text-slate-400">Start free. Upgrade when you need more visibility.</p>
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map(plan => (
          <div key={plan.name} className="relative flex flex-col rounded-2xl border p-6"
            style={{
              borderColor: plan.highlight ? plan.color : '#1e2a3a',
              background: plan.highlight ? 'rgba(233,69,96,0.05)' : '#161b27',
              boxShadow: plan.highlight ? '0 0 40px rgba(233,69,96,0.12)' : 'none',
            }}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: plan.color }}>
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="mb-5">
              <p className="text-sm font-semibold" style={{ color: plan.color }}>{plan.name}</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="mb-1 text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{plan.desc}</p>
            </div>

            <Link href={plan.href}
              className="mb-6 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: plan.highlight ? plan.color : '#1e2a3a', border: plan.highlight ? 'none' : '1px solid #2d3748' }}>
              {plan.cta} <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex-1 space-y-2.5">
              {plan.features.map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />
                  <span className="text-slate-300">{f}</span>
                </div>
              ))}
              {plan.missing.map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm opacity-35">
                  <div className="mt-1.5 h-4 w-4 flex-shrink-0 flex items-center justify-center">
                    <div className="h-px w-3 bg-slate-600" />
                  </div>
                  <span className="text-slate-500 line-through">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
        {['No contracts — cancel anytime', 'No credit card for Free tier', 'Listings go live in minutes', 'GDPR compliant'].map(t => (
          <span key={t} className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-slate-600" /> {t}
          </span>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <h2 className="mb-8 text-center text-2xl font-black text-white">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <p className="font-semibold text-white">{q}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
        <Star className="mx-auto mb-3 h-8 w-8" style={{ color: '#e94560' }} />
        <h2 className="text-xl font-bold text-white">Still not sure? Start free.</h2>
        <p className="mt-2 text-slate-400">List your AI tool today — free for 6 months, no card required. Upgrade when you&apos;re ready.</p>
        <Link href="/submit"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.25)' }}>
          Submit Your AI Tool Free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
