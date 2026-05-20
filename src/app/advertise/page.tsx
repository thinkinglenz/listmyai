import Link from 'next/link'
import { Mail, Zap, BarChart2, Users, Star, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Advertise on ListmyAI — Reach 50,000+ AI Enthusiasts',
  description: 'Sponsor the ListmyAI newsletter, get a featured listing, or run a banner — put your AI tool in front of a highly engaged audience.',
}

const PACKAGES = [
  {
    name: 'Newsletter Sponsor',
    icon: Mail,
    price: '$149',
    period: '/issue',
    color: '#6366f1',
    description: 'Your product featured in our weekly AI Digest newsletter sent to 10,000+ subscribers.',
    features: [
      'Dedicated sponsor section (top placement)',
      '150-word ad copy + your logo',
      'Direct link to your site or landing page',
      'Subject-line mention on sponsored issues',
      'Performance report after send',
    ],
    cta: 'Get in touch',
    href: 'mailto:ads@listmyai.com?subject=Newsletter Sponsorship',
  },
  {
    name: 'Featured Listing',
    icon: Star,
    price: '$49',
    period: '/month',
    color: '#e94560',
    popular: true,
    description: 'Pin your tool at the top of relevant category pages and search results — seen by every visitor.',
    features: [
      'Top placement in category & search results',
      '"Featured" badge on your tool card',
      'Bold border highlight to stand out',
      'Priority indexing for new features',
      'Analytics dashboard access',
    ],
    cta: 'Claim your spot',
    href: 'mailto:ads@listmyai.com?subject=Featured Listing',
  },
  {
    name: 'Homepage Banner',
    icon: BarChart2,
    price: '$299',
    period: '/month',
    color: '#10b981',
    description: 'A dedicated banner slot on the ListmyAI homepage — the highest-traffic page on the site.',
    features: [
      'Rotating banner above the fold',
      'Custom creative (we help design)',
      'Click-through tracking & weekly report',
      'Up to 3 banner variants A/B tested',
      'Featured in homepage "Sponsored" section',
    ],
    cta: 'Reserve your banner',
    href: 'mailto:ads@listmyai.com?subject=Homepage Banner',
  },
]

const STATS = [
  { label: 'Monthly Visitors', value: '50,000+', icon: Users },
  { label: 'Newsletter Subscribers', value: '10,000+', icon: Mail },
  { label: 'Tools Listed', value: '1,000+', icon: Star },
  { label: 'Avg. Session Time', value: '4 min', icon: Zap },
]

export default function AdvertisePage() {
  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: '#1e2a3a', background: 'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)' }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.12) 0%,transparent 70%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
            <Zap className="h-3.5 w-3.5" /> Advertise with ListmyAI
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Reach the people who<br />
            <span style={{ background: 'linear-gradient(90deg,#e94560,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              buy AI tools
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-slate-400">
            ListmyAI is where founders, marketers, and developers discover their next AI tool.
            Put your product in front of a highly intent audience.
          </p>
          <a href="mailto:ads@listmyai.com"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560' }}>
            <Mail className="h-4 w-4" /> Email us to advertise
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b" style={{ borderColor: '#1e2a3a' }}>
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-slate-600" />
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white">Sponsorship Packages</h2>
          <p className="mt-2 text-slate-500">All prices in USD. Custom packages available — just ask.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PACKAGES.map(pkg => (
            <div key={pkg.name}
              className="relative rounded-2xl border p-6 flex flex-col"
              style={{ borderColor: pkg.popular ? 'rgba(233,69,96,0.4)' : '#1e2a3a', background: '#161b27' }}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
                    style={{ background: '#e94560' }}>
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${pkg.color}20` }}>
                <pkg.icon className="h-5 w-5" style={{ color: pkg.color }} />
              </div>

              <h3 className="font-bold text-white text-lg mb-1">{pkg.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{pkg.description}</p>

              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-black text-white">{pkg.price}</span>
                <span className="text-sm text-slate-500">{pkg.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {pkg.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <a href={pkg.href}
                className="block w-full rounded-xl py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: pkg.popular ? '#e94560' : '#1e2a3a', border: pkg.popular ? 'none' : '1px solid #2d3f55' }}>
                {pkg.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Custom / Enterprise */}
        <div className="mt-10 rounded-2xl border p-8 text-center"
          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h3 className="text-xl font-bold text-white mb-2">Need a custom package?</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-md mx-auto">
            We offer custom sponsorship bundles, affiliate partnerships, and white-label integrations for AI companies with larger budgets.
          </p>
          <a href="mailto:ads@listmyai.com?subject=Custom Partnership"
            className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold text-slate-300 transition hover:text-white hover:border-white/30"
            style={{ borderColor: '#2d3f55' }}>
            <Mail className="h-4 w-4" /> Contact us
          </a>
        </div>

        {/* Why advertise */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-white mb-8 text-center">Why advertise on ListmyAI?</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: '🎯', title: 'High-intent audience', body: 'Our visitors are actively searching for AI tools to solve specific problems — they\'re ready to buy, not just browse.' },
              { icon: '🔍', title: 'SEO-driven traffic', body: 'We rank for hundreds of AI tool comparison and review keywords, bringing in organic traffic with purchase intent.' },
              { icon: '📧', title: 'Engaged newsletter', body: 'Our weekly AI Digest has a 40%+ open rate — one of the highest in the AI newsletter space.' },
              { icon: '⚡', title: 'Fast turnaround', body: 'Campaigns can go live within 48 hours of payment. No long sales cycles or agency middlemen.' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm mb-3">Questions? We respond within 24 hours.</p>
          <a href="mailto:ads@listmyai.com"
            className="inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80"
            style={{ color: '#e94560' }}>
            <Mail className="h-4 w-4" /> ads@listmyai.com
          </a>
        </div>
      </div>
    </div>
  )
}
