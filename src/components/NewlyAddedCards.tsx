'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { imageChain } from '@/components/SpotlightBox'

export interface NewTool {
  slug: string
  name: string
  tagline: string
  category: string | null
  logoUrl: string | null
  coverUrl: string | null
  website: string | null
}

function Card({ tool }: { tool: NewTool }) {
  const sources = imageChain(tool.coverUrl, tool.website, tool.slug)
  const [i, setI] = useState(0)
  const [logoOk, setLogoOk] = useState(Boolean(tool.logoUrl))
  const img = useRef<HTMLImageElement>(null)

  // The image is in the server HTML and may fail before React attaches
  // onError; a finished image with no width is one that failed.
  useEffect(() => {
    const el = img.current
    if (el?.complete && el.naturalWidth === 0) setI(n => Math.min(n + 1, sources.length - 1))
  }, [i, sources.length])

  return (
    <Link href={`/tools/${tool.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5"
      style={{
        borderColor: 'rgba(233,69,96,0.22)',
        background: 'linear-gradient(160deg, rgba(233,69,96,0.08) 0%, rgba(15,23,42,0.8) 50%, rgba(13,17,23,0.95) 100%)',
        boxShadow: '0 18px 50px -28px rgba(233,69,96,0.45)',
      }}>
      <div className="relative m-3 mb-0 overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 9', background: '#0d1117' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={sources[i]} alt={`${tool.name} preview`} loading="lazy"
          onError={() => setI(n => Math.min(n + 1, sources.length - 1))}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: 'rgba(233,69,96,0.9)' }}>
          <Sparkles className="h-3 w-3" /> New
        </span>
      </div>
      <div className="flex flex-1 items-start gap-3 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
          {tool.logoUrl && logoOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tool.logoUrl} alt="" className="h-full w-full object-cover" onError={() => setLogoOk(false)} />
          ) : (
            <span className="text-lg font-black text-white">{tool.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-white group-hover:text-brand-red">{tool.name}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{tool.tagline}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            {tool.category
              ? <span className="truncate rounded-full px-2 py-0.5 text-[10px] font-medium text-slate-400" style={{ background: 'rgba(255,255,255,0.06)' }}>{tool.category}</span>
              : <span />}
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-brand-red" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function NewlyAddedCards({ tools }: { tools: NewTool[] }) {
  if (tools.length === 0) return null
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" /> Newly added
        </p>
        <Link href="/directory?sort=newest" className="text-xs font-semibold text-slate-400 hover:text-white">See all new tools →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {tools.map(t => <Card key={t.slug} tool={t} />)}
      </div>
    </div>
  )
}
