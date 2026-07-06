import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, Mail, Megaphone, Star, Crown, Layout, Send,
  Users, TrendingUp, BarChart3, Check, Zap, Trophy, MousePointerClick,
  ShieldCheck, Tag, Newspaper, Share2, Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Advertise on ListmyAI — Sponsorships, Banners & Newsletter',
  description: 'Reach 50,000+ monthly AI buyers, developers, and decision makers. Sponsorships, homepage banners, newsletter spots, and featured placements on the ListmyAI directory.',
  openGraph: {
    title: 'Advertise on ListmyAI — Reach 50k+ AI Buyers Monthly',
    description: 'Sponsorships, banners, newsletter spots, and featured placements on the leading AI tools directory.',
    url: 'https://listmyai.com/advertise',
  },
  alternates: { canonical: 'https://listmyai.com/advertise' },
}

// ── Audience stats (edit anytime) ─────────────────────────────────────────────
const STATS = [
  { label: 'Monthly visitors',     value: '50K+',   icon: Users },
  { label: 'Newsletter subs',      value: '12K+',   icon: Mail },
  { label: 'AI tools listed',      value: '19,000+',   icon: Sparkles },
  { label: 'Avg. CTR on features', value: '4.8%',   icon: MousePointerClick },
]

const AUDIENCE = [
  { label: 'Founders & operators',          pct: 38 },
  { label: 'Developers & engineers',        pct: 27 },
  { label: 'Marketing & growth',            pct: 19 },
  { label: 'Designers & creators',          pct: 11 },
  { label: 'Researchers & students',        pct: 5  },
]

// ── Placement / ad packages ──────────────────────────────────────────────────
type Tier = {
  key: string
  name: string
  price: string
  unit: string
  desc: string
  icon: React.ElementType
  color: string
  badge?: string
  bullets: string[]
  cta: string
}

const PACKAGES: Tier[] = [
  {
    key: 'featured',
    name: 'Featured Listing',
    price: '$49',
    unit: '/month',
    icon: Star,
    color: '#3b82f6',
    desc: 'Permanent top-of-category placement with a Featured badge across the directory.',
    bullets: [
      'Featured pin on /directory & category pages',
      '“Top AI Tools Right Now” homepage slot',
      'Verified badge + analytics dashboard',
      'Promo codes & deals listing',
      '~2–4x click-through vs. standard',
    ],
    cta: 'Get Featured',
  },
  {
    key: 'sponsored',
    name: 'Sponsored Listing',
    price: '$199',
    unit: '/month',
    icon: Crown,
    color: '#e94560',
    badge: 'Most Popular',
    desc: 'Pinned to the top of the homepage and your chosen category — clearly labeled as Sponsored.',
    bullets: [
      'Top-of-homepage pinned placement',
      '#1 slot in one category of your choice',
      'Sponsored badge + custom tagline',
      'Newsletter mention (1× per month)',
      'Direct lead delivery via email',
      'Analytics + monthly performance report',
    ],
    cta: 'Become a Sponsor',
  },
  {
    key: 'banner',
    name: 'Homepage Banner',
    price: '$299',
    unit: '/week',
    icon: Megaphone,
    color: '#f59e0b',
    desc: 'A premium banner unit at the top of the homepage — your message, your design, your link.',
    bullets: [
      'Above-the-fold homepage banner',
      'Site-wide retargeting eligible',
      'Custom creative (we’ll help design)',
      'Click + impression tracking',
      'Limited to 2 advertisers per week',
    ],
    cta: 'Reserve a Slot',
  },
  {
    key: 'newsletter',
    name: 'Newsletter Sponsor',
    price: '$149',
    unit: '/send',
    icon: Newspaper,
    color: '#8b5cf6',
    desc: 'Dedicated section in our weekly newsletter to 12k+ AI builders and buyers.',
    bullets: [
      '12K+ engaged subscribers',
      'Avg. open rate 34% · CTR 6.2%',
      'Logo, 60-word pitch, custom CTA',
      'UTM tracking link included',
      'One sponsor per send',
    ],
    cta: 'Sponsor the Newsletter',
  },
  {
    key: 'review',
    name: 'Sponsored Review',
    price: '$399',
    unit: 'one-time',
    icon: Trophy,
    color: '#10b981',
    desc: 'A long-form, SEO-optimized review article on your tool. Permanent backlink — yours forever.',
    bullets: [
      '800–1,200 word editorial review',
      'Featured screenshots & comparisons',
      'Permanent SEO backlink (do-follow)',
      'Shared on socials at launch',
      'Indexed by Google within ~7 days',
    ],
    cta: 'Request a Review',
  },
  {
    key: 'social',
    name: 'Social Boost',
    price: '$99',
    unit: 'one-time',
    icon: Share2,
    color: '#0ea5e9',
    desc: 'Dedicated post on our X / LinkedIn / Reddit channels with your launch.',
    bullets: [
      'Native posts across our channels',
      'Tagged with audience-fit hashtags',
      'Pinned for 24 hours',
      'Engagement report after 72h',
    ],
    cta: 'Boost My Launch',
  },
]

// ── Bundles ──────────────────────────────────────────────────────────────────
const BUNDLES = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$249',
    unit: '/month',
    discount: 'Save 14%',
    includes: ['Featured Listing', 'Newsletter mention', 'Social Boost'],
    color: '#3b82f6',
  },
  {
    key: 'growth',
    name: 'Growth',
    price: '$599',
    unit: '/month',
    discount: 'Save 22%',
    includes: ['Sponsored Listing', 'Newsletter Sponsor', 'Sponsored Review (one-time)'],
    color: '#e94560',
    highlight: true,
  },
  {
    key: 'launch',
    name: 'Launch',
    price: '$1,499',
    unit: 'one-time',
    discount: 'Save 28%',
    includes: ['Homepage Banner (4 weeks)', 'Sponsored Review', 'Newsletter Sponsor', 'Social Boost'],
    color: '#f59e0b',
  },
]

const FAQ = [
  {
    q: 'What kind of audience visits ListmyAI?',
    a: 'Mostly founders, operators, developers, and growth teams actively shopping for AI tools — typically with budget authority. Around 70% are US/Canada/EU; the rest is global.',
  },
  {
    q: 'How are sponsored placements labeled?',
    a: 'Every paid placement is clearly marked “Sponsored” or “Featured” per FTC guidelines. We don’t deceive our readers — sponsors win because they get exposure to a high-intent audience, not because we hide what’s an ad.',
  },
  {
    q: 'Can I see analytics?',
    a: 'Yes. Every sponsor gets a dashboard with impressions, clicks, CTR, top referrers, and conversion events (if you share a tracking pixel). We also send a monthly summary email.',
  },
  {
    q: 'What ad formats and sizes do you accept?',
    a: 'Homepage banners are 1200×300 (desktop) and 800×400 (mobile). Newsletter slots use a 1200×630 hero image plus a 60-word copy block. We can design creative for you if needed.',
  },
  {
    q: 'Can I cancel?',
    a: 'Monthly placements are month-to-month — cancel anytime before the next renewal. One-time placements (Review, Banner week, Social Boost) are non-refundable once the work has been published.',
  },
  {
    q: 'Do you accept advertisers outside of AI?',
    a: 'Our audience is here for AI tools. We accept developer infra, data, hiring platforms, and SaaS that genuinely complement the AI builder workflow. Off-topic ads get declined.',
  },
]

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">

      {/* Hero */}
      <div className="mb-14 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Megaphone className="h-3.5 w-3.5" /> Advertise on ListmyAI
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
          Reach <span style={{ color: '#e94560' }}>50,000+</span> AI buyers, builders & decision makers — every month.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          ListmyAI is where founders, developers, and growth teams discover what to try next.
          Get your AI tool, product, or service in front of an audience that&apos;s ready to buy.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.25)' }}>
            Book a Placement <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#packages"
            className="rounded-xl border px-6 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
            style={{ borderColor: '#1e2a3a' }}>
            See packages
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(s => (
          <div key={s.label} className="rounded-2xl border p-5 text-center"
            style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
            <s.icon className="mx-auto mb-2 h-5 w-5" style={{ color: '#e94560' }} />
            <div className="text-3xl font-black text-white">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Audience breakdown */}
      <div className="mb-16 rounded-2xl border p-6 sm:p-8"
        style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
        <div className="mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" style={{ color: '#e94560' }} />
          <h2 className="text-xl font-bold text-white">Who you&apos;ll reach</h2>
        </div>
        <div className="space-y-3">
          {AUDIENCE.map(a => (
            <div key={a.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-300">{a.label}</span>
                <span className="font-mono font-bold text-white">{a.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: '#1e2a3a' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${a.pct * 2}%`, background: 'linear-gradient(90deg,#e94560,#f59e0b)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div id="packages" className="mb-16 scroll-mt-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white">Ad placements & sponsorships</h2>
          <p className="mt-2 text-slate-400">Pick a single placement or combine them. Every package is transparent — no hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.map(p => (
            <div key={p.key} className="relative flex flex-col rounded-2xl border p-6"
              style={{
                borderColor: p.badge ? p.color : '#1e2a3a',
                background: p.badge ? 'rgba(233,69,96,0.04)' : '#161b27',
                boxShadow: p.badge ? `0 0 28px ${p.color}22` : 'none',
              }}>
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{ background: p.color }}>
                  {p.badge}
                </span>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${p.color}15` }}>
                  <p.icon className="h-5 w-5" style={{ color: p.color }} />
                </div>
                <h3 className="font-black text-white">{p.name}</h3>
              </div>

              <div className="mb-3 flex items-end gap-1.5">
                <span className="text-3xl font-black text-white">{p.price}</span>
                <span className="mb-1 text-sm text-slate-500">{p.unit}</span>
              </div>
              <p className="mb-5 text-sm text-slate-400">{p.desc}</p>

              <ul className="mb-6 flex-1 space-y-2">
                {p.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.color }} />
                    {b}
                  </li>
                ))}
              </ul>

              <Link href={`/contact?package=${encodeURIComponent(p.key)}`}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: p.color }}>
                {p.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Bundles */}
      <div className="mb-16">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
            <Tag className="h-3 w-3" /> Save when you bundle
          </div>
          <h2 className="text-3xl font-black text-white">Bundle packages</h2>
          <p className="mt-2 text-slate-400">Combine placements for a coordinated launch or sustained presence.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BUNDLES.map(b => (
            <div key={b.name} className="relative flex flex-col rounded-2xl border p-6"
              style={{
                borderColor: b.highlight ? b.color : '#1e2a3a',
                background: b.highlight ? 'rgba(233,69,96,0.05)' : '#161b27',
              }}>
              {b.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{ background: b.color }}>
                  Best Value
                </span>
              )}
              <h3 className="font-black text-white">{b.name}</h3>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="text-3xl font-black text-white">{b.price}</span>
                <span className="mb-1 text-sm text-slate-500">{b.unit}</span>
              </div>
              <span className="mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                style={{ background: `${b.color}15`, color: b.color }}>
                {b.discount}
              </span>
              <ul className="mt-5 mb-6 flex-1 space-y-2">
                {b.includes.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: b.color }} /> {item}
                  </li>
                ))}
              </ul>
              <Link href={`/contact?package=${encodeURIComponent(b.key)}`}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: b.color }}>
                Get {b.name} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Why advertise */}
      <div className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          { icon: TrendingUp, title: 'High-intent traffic', body: 'Visitors come to ListmyAI specifically looking for AI tools. They have problems to solve and budget to spend.' },
          { icon: ShieldCheck, title: 'Transparent labeling', body: 'All sponsored placements are clearly marked. Your ad reaches readers who understand and respect the model.' },
          { icon: Layout, title: 'Premium placement', body: 'No banner farms, no clickbait. Your message sits beside the tools your audience already trusts.' },
        ].map(c => (
          <div key={c.title} className="rounded-2xl border p-6"
            style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
            <c.icon className="mb-3 h-6 w-6" style={{ color: '#e94560' }} />
            <h3 className="font-bold text-white">{c.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{c.body}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-black text-white">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border p-5"
              style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              <p className="font-bold text-white">{q}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="rounded-2xl border p-8 text-center sm:p-12"
        style={{
          borderColor: 'rgba(233,69,96,0.3)',
          background: 'linear-gradient(135deg,rgba(233,69,96,0.08),rgba(245,158,11,0.04))',
        }}>
        <Zap className="mx-auto mb-3 h-8 w-8" style={{ color: '#e94560' }} />
        <h2 className="text-2xl font-black text-white sm:text-3xl">Ready to reach 50k+ AI buyers?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Tell us a bit about your tool and what you&apos;d like to accomplish. We&apos;ll send a custom plan and creative recommendations within 24 hours.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560', boxShadow: '0 0 24px rgba(233,69,96,0.3)' }}>
            <Send className="h-4 w-4" /> Get in Touch
          </Link>
          <Link href="/submit"
            className="rounded-xl border px-6 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
            style={{ borderColor: '#1e2a3a' }}>
            Just want to list? Submit free
          </Link>
        </div>
      </div>
    </div>
  )
}
