'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Faq { q: string; a: string }

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0)

  if (!faqs || faqs.length === 0) return null

  return (
    <div className="my-10 space-y-3">
      <h2 className="text-2xl font-black text-white">Frequently Asked Questions</h2>
      <div className="divide-y rounded-2xl border overflow-hidden"
        style={{ borderColor: '#1e2a3a' }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ background: '#0f1623' }}>
            <button
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-semibold text-white text-sm leading-relaxed">{faq.q}</span>
              <ChevronDown
                className={`mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-sm leading-relaxed text-slate-400">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
