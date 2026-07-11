'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface EnrichmentData {
  verdict: string
  tool_a_pros: string[]
  tool_a_cons: string[]
  tool_b_pros: string[]
  tool_b_cons: string[]
  faqs: { q: string; a: string }[]
}

interface Props {
  slug: string
  toolAName: string
  toolBName: string
}

export default function ComparisonEnrichment({ slug, toolAName, toolBName }: Props) {
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEnrichment() {
      try {
        const res = await fetch(`/api/comparisons/enrich/${slug}`)
        if (!res.ok) {
          if (res.status !== 404) console.error(`Enrichment fetch failed: ${res.status}`)
          setLoading(false)
          return
        }
        const data = await res.json()
        setEnrichment(data)
      } catch (err) {
        console.error('Enrichment fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnrichment()
  }, [slug])

  if (loading || !enrichment) return null

  return (
    <>
      {/* Verdict */}
      {enrichment.verdict && (
        <section className="mb-10 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: 'rgba(16,185,129,0.04)' }}>
          <div className="flex gap-3">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full mt-0.5" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Our Take</h3>
              <p className="text-sm leading-relaxed text-slate-300">{enrichment.verdict}</p>
            </div>
          </div>
        </section>
      )}

      {/* Pros & Cons */}
      {(enrichment.tool_a_pros.length > 0 || enrichment.tool_a_cons.length > 0 ||
        enrichment.tool_b_pros.length > 0 || enrichment.tool_b_cons.length > 0) && (
        <section className="mb-10 grid gap-6 sm:grid-cols-2">
          {/* Tool A */}
          <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <h3 className="font-bold text-white mb-4">{toolAName}</h3>
            {enrichment.tool_a_pros.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-emerald-400 uppercase mb-2">Pros</p>
                <ul className="space-y-1.5">
                  {enrichment.tool_a_pros.map((pro, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span style={{ color: '#10b981' }}>+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {enrichment.tool_a_cons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase mb-2">Cons</p>
                <ul className="space-y-1.5">
                  {enrichment.tool_a_cons.map((con, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span style={{ color: '#ef4444' }}>−</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tool B */}
          <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <h3 className="font-bold text-white mb-4">{toolBName}</h3>
            {enrichment.tool_b_pros.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-emerald-400 uppercase mb-2">Pros</p>
                <ul className="space-y-1.5">
                  {enrichment.tool_b_pros.map((pro, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span style={{ color: '#10b981' }}>+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {enrichment.tool_b_cons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase mb-2">Cons</p>
                <ul className="space-y-1.5">
                  {enrichment.tool_b_cons.map((con, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span style={{ color: '#ef4444' }}>−</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* AI-Generated FAQs */}
      {enrichment.faqs.length > 0 && (
        <section className="mb-10 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-5 text-lg font-bold text-white flex items-center gap-2">
            Common Questions
            <span className="text-xs font-normal text-slate-500 bg-slate-900 rounded px-2 py-1">AI-generated</span>
          </h2>
          <div className="space-y-4">
            {enrichment.faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
                <p className="font-semibold text-white">{faq.q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
