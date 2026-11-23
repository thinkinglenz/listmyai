import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Check, Plug, AlertTriangle, ArrowRight } from 'lucide-react'
import { jobPhrase } from '@/lib/agents'
import EnquiryChat from '@/components/agents/EnquiryChat'
import EnquiryCTA from '@/components/agents/EnquiryCTA'
import {
  allPairs, getPair, pairTitle, pairDescription, pairIntro, pairStakes,
  pairIntegrations, pairRegion, agentsFor, industriesFor,
} from '@/lib/agent-pages'

export const revalidate = 86400
// A pairing outside the map is not a page. Without this, every cross-product
// URL would render on demand and the deliberate exclusions would be
// meaningless — which is how a tidy page set turns into a doorway farm.
export const dynamicParams = false

interface PageProps { params: Promise<{ pair: string }> }

export function generateStaticParams() {
  return allPairs().map(p => ({ pair: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params
  const p = getPair(pair)
  if (!p) return { title: 'Not found' }
  return {
    title: pairTitle(p),
    description: pairDescription(p),
    alternates: { canonical: `/ai-agents/${p.slug}` },
    openGraph: { title: pairTitle(p), description: p.agent.tagline, type: 'website' },
  }
}

export default async function PairPage({ params }: PageProps) {
  const { pair } = await params
  const p = getPair(pair)
  if (!p) notFound()

  const { agent, industry } = p
  const siblings = agentsFor(industry.slug).filter(a => a.slug !== agent.slug).slice(0, 6)
  const otherTrades = industriesFor(agent.slug).filter(i => i.slug !== industry.slug).slice(0, 8)

  // Described as a Service rather than a Product: nothing here is sold with a
  // price, and marking up an offer with no price invites a rich-result
  // warning for a field we deliberately do not publish.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: pairTitle(p),
    serviceType: agent.job,
    description: pairDescription(p),
    provider: { '@type': 'Organization', name: 'ListmyAI', url: 'https://listmyai.com' },
    audience: { '@type': 'Audience', audienceType: industry.name },
    url: `https://listmyai.com/ai-agents/${p.slug}`,
  }

  return (
    <main style={{ background: '#0d1117' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
          <Link href="/agents" className="transition hover:text-white">AI agents</Link>
          <span>/</span>
          <Link href={`/agents/${agent.slug}`} className="transition hover:text-white">{agent.job}</Link>
          <span>/</span>
          <span style={{ color: '#94a3b8' }}>{industry.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            {/* H1 first. The brand was here in capitals, above the only
                heading on the page that carries a search phrase. */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {pairTitle(p)}
            </h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: agent.accent }}>
              {agent.name}
            </p>
            <p className="mt-4 text-base leading-relaxed" style={{ color: '#cbd5e1' }}>
              {pairIntro(p)}
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              {pairRegion(p)}
            </p>

            <div className="mt-8 rounded-2xl p-5" style={{ border: '1px solid #1e2a3a', background: '#161b27' }}>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                <AlertTriangle className="h-3.5 w-3.5" /> What it costs to leave alone
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{pairStakes(p)}</p>
            </div>

            <h2 className="mt-10 text-xl font-bold text-white">
              What {industry.audience} keep asking for
            </h2>
            <ul className="mt-4 space-y-2.5">
              {industry.pains.map(pain => (
                <li key={pain} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full" style={{ background: agent.accent }} />
                  <span>{pain.charAt(0).toUpperCase() + pain.slice(1)}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-xl font-bold text-white">What an {jobPhrase(agent)} does about it</h2>
            <ul className="mt-4 space-y-3">
              {agent.features.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${agent.accent}20` }}>
                    <Check className="h-3 w-3" style={{ color: agent.accent }} />
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{f}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 flex items-center gap-2 text-sm font-bold text-white">
              <Plug className="h-4 w-4" style={{ color: agent.accent }} /> Connects to what you already run
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {pairIntegrations(p).map(w => (
                <span key={w} className="rounded-full px-3 py-1 text-xs"
                  style={{ border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                  {w}
                </span>
              ))}
            </div>

            <p className="mt-8 text-xs leading-relaxed" style={{ color: '#475569' }}>
              Product names above are the property of their respective owners and are listed
              only to describe what an integration could connect to. ListmyAI is independent
              and is not affiliated with, endorsed by or sponsored by any of them.
            </p>
          </div>

          <div id="enquiry" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <EnquiryChat
              agentSlug={agent.slug}
              label={jobPhrase(agent)}
              accent={agent.accent}
              opener={`You are looking at ${agent.job.replace(/^AI /, '').toLowerCase()} for ${industry.lower}. To start — what happens today when ${industry.audience} get in touch, and which part of it takes the most time?`}
            />
            <p className="mt-3 px-1 text-xs leading-relaxed" style={{ color: '#475569' }}>
              We will not share what you write here. If something in our directory already
              does the job, we will tell you that instead.
            </p>
          </div>
        </div>

        {siblings.length > 0 && (
          <section className="mt-20 border-t pt-12" style={{ borderColor: '#1e2a3a' }}>
            <h2 className="text-xl font-bold text-white">Other agents for {industry.lower}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map(a => (
                <Link key={a.slug} href={`/ai-agents/${a.slug}-for-${industry.slug}`}
                  className="rounded-2xl p-5 transition hover:-translate-y-0.5"
                  style={{ border: '1px solid #1e2a3a', background: '#161b27' }}>
                  <p className="font-bold leading-snug text-white">{a.job}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: a.accent }}>{a.name}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748b' }}>{a.tagline}</p>
                </Link>
              ))}
            </div>
            <Link href={`/ai-agents/for/${industry.slug}`}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:gap-2.5"
              style={{ color: agent.accent }}>
              Everything we build for {industry.lower} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {otherTrades.length > 0 && (
          <section className="mt-14">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
              {jobPhrase(agent)} in other trades
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {otherTrades.map(i => (
                <Link key={i.slug} href={`/ai-agents/${agent.slug}-for-${i.slug}`}
                  className="rounded-full px-3.5 py-1.5 text-xs transition hover:text-white"
                  style={{ border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                  {i.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* On a phone the chat is below everything above, so the only
          visible route to it is this. */}
      <EnquiryCTA variant="sticky" accent={agent.accent} targetId="enquiry" />
    </main>
  )
}
