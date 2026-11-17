import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Sparkles, ShieldCheck, MessageSquareText } from 'lucide-react'
import { AGENTS } from '@/lib/agents'
import AgentCard from '@/components/agents/AgentCard'

// Static content, so it can be cached hard. Nothing here reads the database.
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'AI Agents Built For Your Business',
  description:
    'Twelve AI agents that do a specific job: customer support, lead qualification, booking, invoice extraction, content, outreach, reviews, contracts, inventory, hiring and reporting. Tell us what you need and we will build it.',
  alternates: { canonical: '/agents' },
}

export default function AgentsPage() {
  return (
    <main style={{ background: '#0d1117' }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.12) 0%,transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
            style={{ borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.1)', color: '#e94560' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Built for you, not bought off a shelf
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            AI agents that do{' '}
            <span style={{ background: 'linear-gradient(90deg,#e94560,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              one job properly
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed" style={{ color: '#94a3b8' }}>
            A directory tells you what exists. This is the other half: if nothing on the
            shelf fits how your business actually runs, we build the agent that does.
            Pick the job below and tell us about it — the conversation does the scoping,
            so there is no long back-and-forth afterwards.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#catalogue"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560', boxShadow: '0 0 22px rgba(233,69,96,0.35)' }}
            >
              Browse the agents <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
              style={{ border: '1px solid #1e2a3a', color: '#94a3b8' }}
            >
              Or browse existing tools
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — three honest lines, no promises about time or money */}
      <section className="border-b" style={{ borderColor: '#1e2a3a' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ borderColor: '#1e2a3a' }}>
            {[
              {
                icon: MessageSquareText, color: '#6366f1',
                title: 'You describe the job',
                desc: 'A short conversation, not a twenty-field form. It asks the things that actually change how the agent gets built.',
              },
              {
                icon: ShieldCheck, color: '#10b981',
                title: 'We scope it honestly',
                desc: 'If an off-the-shelf tool in our index already does it, we will say so and point you at it rather than build something you do not need.',
              },
              {
                icon: Sparkles, color: '#e94560',
                title: 'It runs on your systems',
                desc: 'Connected to the inbox, calendar, sheet or CRM you already use. Nothing new for your team to learn.',
              },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.title} className="flex flex-col gap-4 px-6 py-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${s.color}18` }}>
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-white">Pick the job you need done</h2>
        <p className="mt-1.5 text-sm" style={{ color: '#64748b' }}>
          {AGENTS.length} agents. Each one is a starting point, shaped to your business in the enquiry.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map(a => <AgentCard key={a.slug} agent={a} />)}
        </div>

        <p className="mt-10 text-sm leading-relaxed" style={{ color: '#64748b' }}>
          Need something that is not on this list? Pick the closest one and say so in the
          enquiry — most of what we build starts that way.
        </p>
      </section>
    </main>
  )
}
