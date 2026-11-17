import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Check, Plug, Building2 } from 'lucide-react'
import { AGENTS, getAgent, jobPhrase } from '@/lib/agents'
import EnquiryChat from '@/components/agents/EnquiryChat'

export const revalidate = 86400

interface PageProps { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return AGENTS.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) return { title: 'Not found' }

  // The brand is not in the title at all. A title is roughly sixty useful
  // characters and "— Relay" spends six of them on a word with no search
  // demand behind it.
  return {
    title: agent.job,
    description: `${agent.tagline} ${agent.outcome}`,
    alternates: { canonical: `/agents/${agent.slug}` },
    openGraph: {
      title: agent.job,
      description: agent.tagline,
      type: 'website',
    },
  }
}

export default async function AgentPage({ params }: PageProps) {
  const { slug } = await params
  const agent = getAgent(slug)
  if (!agent) notFound()

  const others = AGENTS.filter(a => a.slug !== agent.slug).slice(0, 3)

  return (
    <main style={{ background: '#0d1117' }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link href="/agents"
          className="inline-flex items-center gap-1.5 text-sm transition hover:text-white"
          style={{ color: '#64748b' }}>
          <ArrowLeft className="h-4 w-4" /> All agents
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: what it is */}
          <div>
            {/* Was the brand name in capitals, directly above the H1 — the
                most prominent line on the page spent on a word nobody
                searches. The H1 keyword leads now and the brand is a quiet
                label underneath it. */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {agent.job}
            </h1>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: agent.accent }}>
              {agent.name}
            </p>
            <p className="mt-3 text-lg leading-relaxed" style={{ color: '#cbd5e1' }}>
              {agent.tagline}
            </p>

            <div className="mt-8 rounded-2xl p-5" style={{ border: '1px solid #1e2a3a', background: '#161b27' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                The problem
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{agent.problem}</p>
              <h2 className="mt-6 text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                What changes
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{agent.outcome}</p>
            </div>

            <h2 className="mt-10 text-xl font-bold text-white">What an {jobPhrase(agent)} does</h2>
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

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Plug className="h-4 w-4" style={{ color: agent.accent }} /> Connects to
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.worksWith.map(w => (
                    <span key={w} className="rounded-full px-3 py-1 text-xs"
                      style={{ border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Building2 className="h-4 w-4" style={{ color: agent.accent }} /> Used in
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {agent.industries.map(i => (
                    <span key={i} className="rounded-full px-3 py-1 text-xs"
                      style={{ border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Naming a product as an integration target is not a claim of any
                relationship with it. Said here as well as in the footer,
                because this page names more of them than any other. */}
            <p className="mt-8 text-xs leading-relaxed" style={{ color: '#475569' }}>
              Product names above are the property of their respective owners and are listed
              only to describe what an integration could connect to. ListmyAI is independent
              and is not affiliated with, endorsed by or sponsored by any of them.
            </p>
          </div>

          {/* Right: the enquiry */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <EnquiryChat
              agentSlug={agent.slug}
              label={jobPhrase(agent)}
              accent={agent.accent}
              opener={`Let's work out what your ${agent.job.replace(/^AI /, '').toLowerCase()} needs to handle. To start — what happens today, and what part of it is costing you the most time?`}
            />
            <p className="mt-3 px-1 text-xs leading-relaxed" style={{ color: '#475569' }}>
              We will not share what you write here. If something in our directory already
              does the job, we will tell you that instead.
            </p>
          </div>
        </div>

        {/* Other agents */}
        <section className="mt-20 border-t pt-12" style={{ borderColor: '#1e2a3a' }}>
          <h2 className="text-xl font-bold text-white">Other agents</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map(o => (
              <Link key={o.slug} href={`/agents/${o.slug}`}
                className="rounded-2xl p-5 transition hover:-translate-y-0.5"
                style={{ border: '1px solid #1e2a3a', background: '#161b27' }}>
                <p className="font-bold leading-snug text-white">{o.job}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: o.accent }}>{o.name}</p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748b' }}>{o.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
