import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Eye, Code2, Gift, Star, Layers } from 'lucide-react'
import {
  resolveBestPage, headingFor, headingForDef, fetchBestPageData, buildFaq, relatedPages,
  naturalKeywords, LIVE_PAGES, MIN_TOOLS_TO_INDEX, YEAR, type BestTool,
} from '@/lib/seo/best-pages'
import { formatCount } from '@/lib/utils'

export const revalidate = 86400
export const dynamicParams = false

export function generateStaticParams() {
  return LIVE_PAGES.map(p => ({ slug: p.slug }))
}

interface PageProps { params: Promise<{ slug: string }> }

const BORDER = '#1e2a3a'
const CARD = '#161b27'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = resolveBestPage(slug)
  if (!page) return { title: 'Not found' }
  const data = await fetchBestPageData(page)
  const heading = headingFor(page)
  const top = data.picks.slice(0, 3).map(t => t.name).join(', ')
  const description =
    `${data.stats.matched} ${page.def.free ? 'free ' : ''}${page.topic.label}${page.audience ? ` for ${page.audience.label}` : ''} compared` +
    `${top ? ` — including ${top}` : ''}. Pricing, free plans and API access, updated daily.`
  const url = `https://listmyai.com/best/${slug}`
  return {
    title: heading,
    description,
    keywords: naturalKeywords(page.def.keywords, 10),
    alternates: { canonical: url },
    robots: data.picks.length < MIN_TOOLS_TO_INDEX ? { index: false, follow: true } : undefined,
    openGraph: { title: heading, description, url, type: 'website', siteName: 'ListmyAI' },
    twitter: { card: 'summary_large_image', title: heading, description },
  }
}

function Logo({ tool, size = 48 }: { tool: BestTool; size?: number }) {
  return tool.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={tool.logo_url} alt={`${tool.name} logo`} width={size} height={size} loading="lazy"
      className="shrink-0 rounded-xl border object-cover" style={{ borderColor: BORDER, width: size, height: size, background: '#0d1117' }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-xl border font-bold text-white"
      style={{ borderColor: BORDER, width: size, height: size, background: '#0d1117' }}>
      {tool.name.charAt(0).toUpperCase()}
    </span>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Eye; value: string | number; label: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}>
      <Icon className="h-4 w-4 text-slate-500" />
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

const PRICE: Record<string, string> = {
  free: 'Free', freemium: 'Freemium', free_trial: 'Free trial', subscription: 'Subscription',
  pay_per_use: 'Pay per use', one_time: 'One-time', enterprise: 'Enterprise',
}

export default async function BestPage({ params }: PageProps) {
  const { slug } = await params
  const page = resolveBestPage(slug)
  if (!page) notFound()

  const { def, topic, audience } = page
  const data = await fetchBestPageData(page)
  const heading = headingFor(page)
  const faq = buildFaq(page, data)
  const related = relatedPages(page)
  const searches = naturalKeywords(def.keywords, 14)
  const who = audience ? ` for ${audience.label}` : ''
  const updated = new Date(data.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const topPicks = data.picks.slice(0, 10)
  const url = `https://listmyai.com/best/${slug}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      url,
      dateModified: data.updatedAt,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: topPicks.length,
        itemListElement: topPicks.map((t, i) => ({
          '@type': 'ListItem', position: i + 1, name: t.name, url: `https://listmyai.com/tools/${t.slug}`,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ListmyAI', item: 'https://listmyai.com' },
        { '@type': 'ListItem', position: 2, name: 'Best AI tools', item: 'https://listmyai.com/best' },
        { '@type': 'ListItem', position: 3, name: heading, item: url },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/best" className="flex items-center gap-1 transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Best AI tools
          </Link>
          <span>/</span>
          <span className="truncate text-slate-300">{heading}</span>
        </nav>

        {/* Hero */}
        <header className="mb-8 rounded-2xl border p-6 sm:p-8" style={{ borderColor: BORDER, background: CARD }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#e94560' }}>
            Updated {updated}
          </p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{heading}</h1>
          <div className="mt-4 max-w-3xl space-y-3 leading-relaxed text-slate-300">
            <p>{topic.what}</p>
            {audience && <p>{audience.needs}</p>}
            {def.free && (
              <p>
                Every tool below lists a free plan, free trial or free option. Free tiers change often and usually cap
                usage, so each entry shows exactly what kind of free access its listing records.
              </p>
            )}
          </div>
        </header>

        {/* Stats */}
        <section aria-label="At a glance" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Layers} value={data.stats.matched} label={`${topic.label}${who} compared`} />
          <Stat icon={Gift} value={data.stats.freeOptions} label="with a free plan, trial or option" />
          <Stat icon={Code2} value={data.stats.withApi} label="offer API access" />
          <Stat icon={Eye} value={data.stats.topViewed?.name ?? '—'} label="most viewed on ListmyAI" />
        </section>

        {topPicks.length === 0 ? (
          <div className="mb-10 rounded-2xl border p-10 text-center" style={{ borderColor: BORDER, background: CARD }}>
            <p className="font-semibold text-white">We are still building this list</p>
            <p className="mt-1 text-sm text-slate-500">New tools are added every day. Browse the <Link href="/directory" className="underline">directory</Link> meanwhile.</p>
          </div>
        ) : (
          <>
            {/* Ranked picks */}
            <section className="mb-12">
              <h2 className="mb-2 text-2xl font-bold text-white">
                Top {topPicks.length} {def.free ? 'free ' : ''}{topic.label}{who}
              </h2>
              <p className="mb-6 text-sm text-slate-500">Ranked by ListmyAI upvotes, visitor views and ratings{audience ? `, favouring tools whose listings are built for ${audience.label}` : ''}.</p>
              <ol className="space-y-4">
                {topPicks.map((t, i) => (
                  <li key={t.id} id={t.slug} className="rounded-2xl border p-5" style={{ borderColor: BORDER, background: CARD }}>
                    <div className="flex items-start gap-4">
                      <span className="mt-1 w-6 shrink-0 text-lg font-black text-slate-600">{i + 1}</span>
                      <Logo tool={t} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-white">
                          <Link href={`/tools/${t.slug}`} className="hover:underline">{t.name}</Link>
                        </h3>
                        {t.tagline && <p className="mt-1 text-sm leading-relaxed text-slate-400">{t.tagline}</p>}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {t.freeLabel && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">{t.freeLabel}</span>}
                          {t.pricing_model && PRICE[t.pricing_model] && t.freeLabel !== PRICE[t.pricing_model] && (
                            <span className="rounded-full border px-2.5 py-1 text-slate-400" style={{ borderColor: BORDER }}>{PRICE[t.pricing_model]}</span>
                          )}
                          {t.has_api && <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-indigo-300">API</span>}
                          {t.categoryName && <span className="rounded-full border px-2.5 py-1 text-slate-400" style={{ borderColor: BORDER }}>{t.categoryName}</span>}
                          {t.rating_count > 0 && (
                            <span className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-amber-300" style={{ borderColor: BORDER }}>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {t.rating_avg.toFixed(1)}
                            </span>
                          )}
                          {t.view_count > 0 && <span className="rounded-full border px-2.5 py-1 text-slate-500" style={{ borderColor: BORDER }}>{formatCount(t.view_count)} views</span>}
                        </div>
                        {audience && t.audienceMatch && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Its listing mentions “{t.audienceMatch}”, a good sign it is built for {audience.label}.
                          </p>
                        )}
                      </div>
                      <Link href={`/tools/${t.slug}`} className="hidden shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/5 sm:block" style={{ borderColor: BORDER }}>
                        Details
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Comparison table */}
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-white">{titleOf(topic.label)}{who}: comparison</h2>
              <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: BORDER }}>
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500" style={{ background: CARD }}>
                    <tr>
                      <th className="px-4 py-3">Tool</th>
                      <th className="px-4 py-3">Pricing</th>
                      <th className="px-4 py-3">Free access</th>
                      <th className="px-4 py-3">API</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Upvotes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPicks.map(t => (
                      <tr key={t.id} className="border-t" style={{ borderColor: BORDER }}>
                        <td className="px-4 py-3 font-semibold text-white"><Link href={`/tools/${t.slug}`} className="hover:underline">{t.name}</Link></td>
                        <td className="px-4 py-3 text-slate-400">{(t.pricing_model && PRICE[t.pricing_model]) || 'See website'}</td>
                        <td className="px-4 py-3 text-slate-400">{t.freeLabel ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{t.has_api ? 'Yes' : '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{t.categoryName ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{formatCount(t.upvotes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Longer list */}
            {data.picks.length > 10 && (
              <MoreGrid title={`More ${topic.label}${who}`} tools={data.picks.slice(10, 34)} />
            )}
            {data.alsoPopular.length > 0 && (
              // Kept apart from the audience list: these are popular overall,
              // not tools whose listings speak to this audience.
              <MoreGrid title={`Most popular ${topic.label} on ListmyAI`} tools={data.alsoPopular} />
            )}
          </>
        )}

        {/* Buying guide */}
        <section className="mb-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border p-6" style={{ borderColor: BORDER, background: CARD }}>
            <h2 className="mb-4 text-xl font-bold text-white">
              How to choose {topic.label === 'AI tools' ? 'an AI tool' : `an ${topic.singular}`}{who}
            </h2>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-300">
              {[...(audience?.priorities ?? []), ...topic.criteria].map(c => (
                <li key={c} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{c}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: BORDER, background: CARD }}>
            <h2 className="mb-4 text-xl font-bold text-white">How we built this list</h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-400">
              <p>
                We searched ListmyAI’s directory of active AI tool listings for {topic.label === 'AI tools' ? 'every category' : topic.label}
                {audience ? `, then looked for tools whose own descriptions address ${audience.label}` : ''}
                {def.free ? ', keeping only those that record a free plan, free trial or free option' : ''}.
              </p>
              <p>
                The order reflects upvotes and views from ListmyAI visitors and ratings from signed-in users. Sponsored
                placement does not change the ranking on this page.
              </p>
              {data.stats.categories.length > 0 && (
                <p>
                  Most picks come from {data.stats.categories.map(c => `${c.name} (${c.count})`).join(', ')}.
                </p>
              )}
              <p>Pricing and free plans change often — confirm on each tool’s website before you subscribe.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mb-12 rounded-2xl border p-6" style={{ borderColor: BORDER, background: CARD }}>
            <h2 className="mb-5 text-xl font-bold text-white">Frequently asked questions</h2>
            <div className="space-y-4">
              {faq.map(f => (
                <div key={f.q} className="rounded-xl border p-4" style={{ borderColor: BORDER, background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="font-semibold text-white">{f.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Searches this page answers */}
        {searches.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-3 text-lg font-bold text-white">People also search for</h2>
            <ul className="flex flex-wrap gap-2">
              {searches.map(s => (
                <li key={s} className="rounded-full border px-3 py-1.5 text-sm text-slate-400" style={{ borderColor: BORDER }}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Related */}
        <section className="rounded-2xl border p-6" style={{ borderColor: BORDER, background: CARD }}>
          <h2 className="mb-4 text-lg font-bold text-white">Related guides</h2>
          <div className="flex flex-wrap gap-2">
            {related.map(p => (
              <Link key={p.slug} href={`/best/${p.slug}`} className="rounded-full border px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" style={{ borderColor: BORDER }}>
                {headingForDef(p).replace(` in ${YEAR}`, '')}
              </Link>
            ))}
            {topic.useCase && (
              <Link href={`/use-case/${topic.useCase}`} className="rounded-full border px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" style={{ borderColor: BORDER }}>
                All {topic.label}
              </Link>
            )}
            {(def.topic === 'ai-chatbots' || def.topic === 'ai-tools' || def.topic === 'ai-writing-tools') && (
              <Link href="/alternatives/chatgpt" className="rounded-full border px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" style={{ borderColor: BORDER }}>
                ChatGPT alternatives
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function MoreGrid({ title, tools }: { title: string; tools: BestTool[] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(t => (
          <Link key={t.id} href={`/tools/${t.slug}`} className="flex items-start gap-3 rounded-xl border p-4 transition hover:bg-white/5" style={{ borderColor: BORDER, background: CARD }}>
            <Logo tool={t} size={36} />
            <span className="min-w-0">
              <span className="block font-semibold text-white">{t.name}</span>
              <span className="line-clamp-2 text-xs text-slate-500">{t.tagline}</span>
              {t.freeLabel && <span className="mt-1 block text-[11px] text-emerald-400">{t.freeLabel}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function titleOf(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
