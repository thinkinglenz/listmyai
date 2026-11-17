import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { INDUSTRIES, getIndustry } from '@/lib/industries'
import { agentsFor } from '@/lib/agent-pages'

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
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: a.accent }}>{a.name}</p>
              <h3 className="mt-1.5 text-lg font-bold text-white">{a.job}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{a.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5"
                style={{ color: a.accent }}>
                See it for {i.lower} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

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
    </main>
  )
}
