import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { INDUSTRIES, getIndustry } from '@/lib/industries'
import { agentsFor } from '@/lib/agent-pages'
import { CUSTOM_INTAKE } from '@/lib/agents'
import EnquiryChat from '@/components/agents/EnquiryChat'
import EnquiryCTA from '@/components/agents/EnquiryCTA'

export const revalidate = 86400
export const dynamicParams = false

interface PageProps { params: Promise<{ industry: string }> }

export function generateStaticParams() {
  return INDUSTRIES.map(i => ({ industry: i.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry } = await params
  const i = getIndustry(industry)
  if (!i) return { title: 'Not found' }
  const count = agentsFor(i.slug).length
  return {
    title: `AI Agents for ${i.name}`,
    description: `${count} AI agents built for ${i.lower}, where ${i.pains[0]}. Each one connects to the systems you already run.`,
    alternates: { canonical: `/ai-agents/for/${i.slug}` },
  }
}

export default async function IndustryHub({ params }: PageProps) {
  const { industry } = await params
  const i = getIndustry(industry)
  if (!i) notFound()

  const agents = agentsFor(i.slug)
  const others = INDUSTRIES.filter(x => x.slug !== i.slug)

  return (
    <main style={{ background: '#0d1117' }}>
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)' }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.12) 0%,transparent 70%)' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
            <Link href="/agents" className="transition hover:text-white">AI agents</Link>
            <span>/</span>
            <span style={{ color: '#94a3b8' }}>{i.name}</span>
          </nav>

          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            AI agents for {i.lower}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed" style={{ color: '#94a3b8' }}>
            At {i.one}, {i.audience} arrive through {i.channels.slice(0, 3).join(', ').toLowerCase()},
            and the load lands {i.rhythm}. {i.stakes.charAt(0).toUpperCase() + i.stakes.slice(1)}.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {i.systems.map(s => (
              <span key={s} className="rounded-full px-3 py-1 text-xs"
                style={{ border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-white">
          {agents.length} agents built for this trade
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: '#64748b' }}>
          Only the ones that genuinely have a job to do here. Pick the closest and describe your setup.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(a => (
            <Link key={a.slug} href={`/ai-agents/${a.slug}-for-${i.slug}`}
              className="group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-0.5"
              style={{ border: '1px solid #1e2a3a', background: '#161b27' }}>
              <h3 className="text-lg font-bold leading-snug text-white">{a.job}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: a.accent }}>{a.name}</p>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{a.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5"
                style={{ color: a.accent }}>
                See it for {i.lower} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        {/* A hub page listing agents with no way to enquire was a dead end:
            the visitor had to pick one, load another page and find the form. */}
        <section id="enquiry" className="mt-16 grid scroll-mt-24 gap-10 rounded-3xl p-6 sm:p-8 lg:grid-cols-[1fr_1fr]"
          style={{ border: '1px solid #1e2a3a', background: '#0b0f16' }}>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Tell us how your {i.lower} setup actually works
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Describe the job in your own words and the questions adapt to what you say.
              By the end we have what we need, and you have not filled in a form.
            </p>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#64748b' }}>
              If something in our directory already does it, we will point you at that instead.
            </p>
          </div>
          <EnquiryChat
            agentSlug={CUSTOM_INTAKE.slug}
            label="custom AI agent"
            accent="#e94560"
            opener={`You are looking at AI agents for ${i.lower}. What happens today when ${i.audience} get in touch, and which part of it takes the most time?`}
          />
        </section>

        <section className="mt-16 border-t pt-10" style={{ borderColor: '#1e2a3a' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Other trades</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {others.map(x => (
              <Link key={x.slug} href={`/ai-agents/for/${x.slug}`}
                className="rounded-full px-3.5 py-1.5 text-xs transition hover:text-white"
                style={{ border: '1px solid #1e2a3a', background: 'rgba(255,255,255,0.03)', color: '#94a3b8' }}>
                {x.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <EnquiryCTA variant="sticky" targetId="enquiry" />
    </main>
  )
}
