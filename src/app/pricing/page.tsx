import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Rocket, ShieldCheck } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { PACKAGES, PACKAGE_ORDER, priceLabel } from '@/lib/billing/packages'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Pricing — Promote your AI tool on ListmyAI',
  description: 'Launch packages, sponsored reviews, category sponsorship and homepage spotlight for AI tools. Listing is free; promotion is paid, delivered automatically and reported with links.',
  alternates: { canonical: 'https://listmyai.com/pricing' },
}

async function listingCount(): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { count } = await createClient(url, key)
    .from('ai_tools').select('id', { count: 'estimated', head: true }).eq('status', 'active')
  return count ?? null
}

export default async function PricingPage() {
  const tools = await listingCount()

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#e94560' }}>Pricing</p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Listing is free. Promotion is paid.</h1>
        <p className="mt-4 text-slate-400">
          We sell placement and promotion — not traffic. Every package below is a thing we do
          for your tool: design the artwork, post it across our channels, write about it, put it
          at the top of a page. You get a report with a link to everything we published.
        </p>
      </div>

      {/* What you are actually buying, in numbers we can show */}
      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: tools ? `${tools.toLocaleString()}+` : '20,000+', l: 'Listings indexed' },
          { v: '5', l: 'Channels we post to' },
          { v: '2', l: 'Stories per launch' },
          { v: '24h', l: 'Spotlight per claim' },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border p-4 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-2xl font-black text-white">{s.v}</p>
            <p className="mt-1 text-xs text-slate-500">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PACKAGE_ORDER.map(id => {
          const p = PACKAGES[id]
          const highlight = id === 'launch_boost'
          return (
            <div key={id} className="flex flex-col rounded-2xl border p-6"
              style={{
                borderColor: highlight ? 'rgba(233,69,96,0.45)' : '#1e2a3a',
                background: highlight ? 'linear-gradient(160deg, rgba(233,69,96,0.08), #161b27 60%)' : '#161b27',
              }}>
              {highlight && (
                <span className="mb-3 self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: '#e94560' }}>
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-bold text-white">{p.name}</h2>
              <p className="mt-1 text-2xl font-black" style={{ color: '#e94560' }}>{priceLabel(p)}</p>
              <p className="mt-2 text-sm text-slate-400">{p.summary}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.includes.map(inc => (
                  <li key={inc} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />{inc}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: highlight ? '#e94560' : 'rgba(255,255,255,0.08)' }}>
                <Rocket className="h-4 w-4" /> {p.recurring ? 'Subscribe' : 'Buy'}
              </Link>
            </div>
          )
        })}
      </div>

      {/* The honesty section. It is also the sales pitch. */}
      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <ShieldCheck className="h-4 w-4" style={{ color: '#10b981' }} /> What we do not promise
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-400">
          <li>
            <span className="font-semibold text-slate-200">We do not sell traffic or guarantee visitors.</span> We are a
            growing directory, not a media site. You can see your listing&apos;s real views and clicks in your dashboard,
            before and after you buy.
          </li>
          <li>
            <span className="font-semibold text-slate-200">Links are marked as sponsored.</span> Google&apos;s rules
            require it for paid placement, and ignoring them would put both of us at risk.
          </li>
          <li>
            <span className="font-semibold text-slate-200">A sponsored review is honest and labelled.</span> We write what
            we find. You do not approve the copy, and every review carries a sponsored label.
          </li>
          <li>
            <span className="font-semibold text-slate-200">Listing stays free.</span> Being in the directory, getting a
            page, and appearing in search costs nothing and always will.
          </li>
        </ul>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Questions, or want something bigger? <Link href="/contact" className="underline" style={{ color: '#e94560' }}>Talk to us</Link>.
      </p>
    </div>
  )
}
