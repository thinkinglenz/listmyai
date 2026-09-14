import type { Metadata } from 'next'
import Link from 'next/link'
import { LIVE_PAGES, headingForDef, YEAR } from '@/lib/seo/best-pages'

export const metadata: Metadata = {
  title: `Best AI Tools in ${YEAR} — Guides by Use and Audience`,
  description: 'Hand-picked guides to the best AI tools for students, freelancers, businesses, developers and more — including free options, compared with live data.',
  alternates: { canonical: 'https://listmyai.com/best' },
}

export default function BestIndex() {
  const groups = [
    { title: 'By audience', pages: LIVE_PAGES.filter(p => p.audience) },
    { title: 'Free tools', pages: LIVE_PAGES.filter(p => !p.audience && p.free) },
    { title: 'By category', pages: LIVE_PAGES.filter(p => !p.audience && !p.free) },
  ].filter(g => g.pages.length)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black text-white sm:text-4xl">Best AI Tools in {YEAR}</h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Guides built from ListmyAI’s live directory — ranked by real visitor views, upvotes and ratings, with free
        plans and API access checked for every tool.
      </p>
      {groups.map(g => (
        <section key={g.title} className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-white">{g.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.pages.map(p => (
              <Link key={p.slug} href={`/best/${p.slug}`} className="rounded-xl border p-4 font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                {headingForDef(p)}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
