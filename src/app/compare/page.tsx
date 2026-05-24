'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search, X, Check, ArrowRight, Loader2, RefreshCw, ExternalLink,
  Sparkles, Crown, Minus,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ToolOption {
  slug: string
  name: string
  tagline?: string
  category?: string
  pricing_model?: string
  starting_price?: string
  rating_avg?: number
  rating_count?: number
  website?: string
  logo_url?: string
}

interface MatrixRow {
  label: string
  a: string
  b: string
  highlight?: 'a' | 'b' | 'tie' | 'none'
}

interface DimensionWinner {
  dimension: string
  winner: 'a' | 'b' | 'tie'
  reason: string
}

interface ComparisonResult {
  summary: string
  matrix: MatrixRow[]
  winners: DimensionWinner[]
  pros_a: string[]
  cons_a: string[]
  pros_b: string[]
  cons_b: string[]
  best_for_a: string
  best_for_b: string
  tagline_a: string
  tagline_b: string
  description_a: string
  description_b: string
}

interface ToolDetails extends ToolOption {
  logo_url?: string
  description?: string
}

// ─── Tool Picker ──────────────────────────────────────────────────────────────
function ToolPicker({ label, selected, onSelect, onClear }: {
  label: string
  selected: ToolOption | null
  onSelect: (t: ToolOption) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ToolOption[]>([])
  const [searching, setSearching] = useState(false)
  const [popular, setPopular] = useState<ToolOption[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load popular tools on open
  useEffect(() => {
    if (!open || popular.length) return
    ;(async () => {
      const { data } = await getSupabase()
        .from('ai_tools')
        .select('slug, name, tagline, pricing_model, starting_price, logo_url')
        .eq('status', 'active')
        .order('upvotes', { ascending: false })
        .limit(10)
      setPopular((data ?? []) as ToolOption[])
    })()
  }, [open, popular.length])

  // Search Supabase
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      // Clear results on next tick to avoid sync setState in effect.
      const id = setTimeout(() => setResults([]), 0)
      return () => clearTimeout(id)
    }
    let cancelled = false
    const t = setTimeout(async () => {
      if (cancelled) return
      setSearching(true)
      const { data } = await getSupabase()
        .from('ai_tools')
        .select('slug, name, tagline, pricing_model, starting_price, rating_avg, rating_count, website, logo_url')
        .eq('status', 'active')
        .ilike('name', `%${trimmed}%`)
        .limit(10)
      if (cancelled) return
      setResults((data ?? []) as ToolOption[])
      setSearching(false)
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="rounded-2xl border-2 p-5 transition" style={{ borderColor: 'rgba(233,69,96,0.5)', background: 'linear-gradient(135deg, #1a1f2e 0%, #161b27 100%)' }}>
          <div className="flex items-start gap-3">
            {selected.logo_url ? (
              <Image src={selected.logo_url} alt={selected.name} width={48} height={48} className="rounded-xl object-contain bg-white/5 p-1" unoptimized />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-lg font-black text-slate-500">
                {selected.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="truncate text-lg font-black text-white">{selected.name}</p>
              {selected.tagline && (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{selected.tagline}</p>
              )}
            </div>
            <button onClick={onClear} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border-2 border-dashed p-5 text-left transition hover:border-red-500/40 hover:bg-white/5"
          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
          <div className="mt-2 flex items-center gap-2 text-slate-400">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search for a tool…</span>
          </div>
        </button>
      )}

      {!selected && open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border shadow-2xl"
          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="border-b p-2" style={{ borderColor: '#1e2a3a' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a tool name…"
                className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none"
                style={{ borderColor: '#1e2a3a', background: '#0d1117' }}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              </div>
            )}
            {!searching && !query && popular.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Popular</p>
                {popular.map(t => (
                  <button key={t.slug} onClick={() => { onSelect(t); setOpen(false); setQuery('') }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/5">
                    {t.logo_url ? (
                      <Image src={t.logo_url} alt="" width={28} height={28} className="rounded-md object-contain bg-white/5" unoptimized />
                    ) : (
                      <div className="h-7 w-7 rounded-md bg-white/5" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{t.name}</p>
                      {t.tagline && <p className="truncate text-xs text-slate-500">{t.tagline}</p>}
                    </div>
                  </button>
                ))}
              </>
            )}
            {!searching && results.map(t => (
              <button key={t.slug} onClick={() => { onSelect(t); setOpen(false); setQuery('') }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/5">
                {t.logo_url ? (
                  <Image src={t.logo_url} alt="" width={28} height={28} className="rounded-md object-contain bg-white/5" unoptimized />
                ) : (
                  <div className="h-7 w-7 rounded-md bg-white/5" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{t.name}</p>
                  {t.tagline && <p className="truncate text-xs text-slate-500">{t.tagline}</p>}
                </div>
              </button>
            ))}
            {!searching && query && results.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">No tools found. Try a different name.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cell renderer ────────────────────────────────────────────────────────────
function MatrixCell({ value, isHighlighted, side }: { value: string; isHighlighted: boolean; side: 'a' | 'b' }) {
  return (
    <div className="px-4 py-3 text-sm" style={{
      background: isHighlighted ? (side === 'a' ? 'rgba(233,69,96,0.08)' : 'rgba(99,102,241,0.08)') : 'transparent',
    }}>
      <div className="flex items-center gap-2">
        {isHighlighted && (
          <Crown className="h-3.5 w-3.5 shrink-0" style={{ color: side === 'a' ? '#e94560' : '#818cf8' }} />
        )}
        <span className={isHighlighted ? 'font-bold text-white' : 'text-slate-300'}>{value}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const [toolA, setToolA] = useState<ToolOption | null>(null)
  const [toolB, setToolB] = useState<ToolOption | null>(null)
  const [useCase, setUseCase] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [fullA, setFullA] = useState<ToolDetails | null>(null)
  const [fullB, setFullB] = useState<ToolDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runComparison() {
    if (!toolA || !toolB) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tool_a: toolA.slug, tool_b: toolB.slug, use_case: useCase || undefined }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error ?? 'Comparison failed. Please try again.')
      } else {
        setResult(json.comparison)
        setFullA(json.tool_a)
        setFullB(json.tool_b)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setToolA(null); setToolB(null); setUseCase('')
    setResult(null); setFullA(null); setFullB(null); setError(null)
  }

  const canCompare = toolA && toolB && toolA.slug !== toolB.slug

  // Score totals (one point per dimension winner, half for ties)
  const aWins = result?.winners.filter(w => w.winner === 'a').length ?? 0
  const bWins = result?.winners.filter(w => w.winner === 'b').length ?? 0
  const ties = result?.winners.filter(w => w.winner === 'tie').length ?? 0

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
            <Sparkles className="h-3.5 w-3.5" /> Side-by-side comparison
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Compare AI Tools</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Pick any two tools — get a fact-based side-by-side breakdown of pricing,
            features, and what each is actually best for. No fake scores.
          </p>
        </div>

        {/* Tool pickers */}
        <div className="relative mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 justify-center sm:flex">
            <span className="rounded-full border px-3 py-1 text-xs font-black text-slate-400"
              style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
              VS
            </span>
          </div>
          <ToolPicker label="Tool A" selected={toolA} onSelect={setToolA} onClear={() => { setToolA(null); setResult(null) }} />
          <ToolPicker label="Tool B" selected={toolB} onSelect={setToolB} onClear={() => { setToolB(null); setResult(null) }} />
        </div>

        {/* Optional use case */}
        {canCompare && !result && (
          <input
            value={useCase}
            onChange={e => setUseCase(e.target.value)}
            placeholder="Optional: what do you need this for? (e.g. 'writing SEO blog posts')"
            className="mb-4 w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-red-500/40"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}
          />
        )}

        {/* CTA */}
        {canCompare && !result && (
          <button
            onClick={runComparison}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#e94560' }}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Building comparison…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Compare Now</>
            )}
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border p-10 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: '#e94560' }} />
            <p className="font-semibold text-white">Building comparison…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border p-6 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="mb-3 text-red-400">{error}</p>
            <button onClick={() => setError(null)}
              className="mx-auto flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        )}

        {/* Results */}
        {result && toolA && toolB && fullA && fullB && (
          <div className="mt-10 space-y-6">
            {/* Hero comparison */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
              {[
                { tool: fullA, accent: '#e94560', side: 'a' as const, wins: aWins },
                null,
                { tool: fullB, accent: '#818cf8', side: 'b' as const, wins: bWins },
              ].map((item, i) => {
                if (!item) {
                  return (
                    <div key={i} className="hidden flex-col items-center justify-center px-4 sm:flex">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-600">{ties > 0 ? `${ties} tied` : ''}</div>
                      <div className="my-2 text-2xl font-black text-slate-700">VS</div>
                    </div>
                  )
                }
                const { tool, accent, side, wins } = item
                return (
                  <div key={tool.slug} className="rounded-2xl border-2 p-5"
                    style={{ borderColor: `${accent}55`, background: '#161b27' }}>
                    <div className="flex items-start gap-3">
                      {tool.logo_url ? (
                        <Image src={tool.logo_url} alt={tool.name} width={56} height={56} className="rounded-xl bg-white/5 p-1 object-contain" unoptimized />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-2xl font-black" style={{ color: accent }}>
                          {tool.name[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link href={`/tools/${tool.slug}`} className="line-clamp-1 text-lg font-black text-white transition hover:text-red-400">
                          {tool.name}
                        </Link>
                        {(side === 'a' ? result.tagline_a : result.tagline_b) && (
                          <p className="line-clamp-2 text-xs text-slate-400">
                            {side === 'a' ? result.tagline_a : result.tagline_b}
                          </p>
                        )}
                      </div>
                    </div>
                    {(aWins + bWins) > 0 && (
                      <div className="mt-4 flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: `${accent}10` }}>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
                          Wins
                        </span>
                        <span className="text-2xl font-black" style={{ color: accent }}>{wins}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Quick take */}
            {result.summary && (
              <div className="rounded-2xl border p-5"
                style={{ borderColor: 'rgba(233,69,96,0.25)', background: 'rgba(233,69,96,0.04)' }}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: '#e94560' }}>Quick take</p>
                <p className="leading-relaxed text-slate-200">{result.summary}</p>
              </div>
            )}

            {/* Feature matrix */}
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="grid grid-cols-[160px_1fr_1fr] border-b text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: '#1e2a3a' }}>
                <div className="px-4 py-3 text-slate-500">Feature</div>
                <div className="border-l px-4 py-3 text-center" style={{ borderColor: '#1e2a3a', color: '#e94560' }}>{toolA.name}</div>
                <div className="border-l px-4 py-3 text-center" style={{ borderColor: '#1e2a3a', color: '#818cf8' }}>{toolB.name}</div>
              </div>
              {result.matrix.map((row, i) => (
                <div key={i} className="grid grid-cols-[160px_1fr_1fr] border-b last:border-b-0"
                  style={{ borderColor: '#1e2a3a' }}>
                  <div className="bg-white/[0.02] px-4 py-3 text-sm font-medium text-slate-400">{row.label}</div>
                  <div className="border-l" style={{ borderColor: '#1e2a3a' }}>
                    <MatrixCell value={row.a} isHighlighted={row.highlight === 'a'} side="a" />
                  </div>
                  <div className="border-l" style={{ borderColor: '#1e2a3a' }}>
                    <MatrixCell value={row.b} isHighlighted={row.highlight === 'b'} side="b" />
                  </div>
                </div>
              ))}
            </div>

            {/* Dimension winners */}
            {result.winners.length > 0 && (
              <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Who wins where</p>
                <div className="space-y-3">
                  {result.winners.map((w, i) => {
                    const winnerName = w.winner === 'tie' ? 'Tie' : (w.winner === 'a' ? toolA.name : toolB.name)
                    const accent = w.winner === 'a' ? '#e94560' : w.winner === 'b' ? '#818cf8' : '#64748b'
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${accent}15` }}>
                          {w.winner === 'tie'
                            ? <Minus className="h-4 w-4" style={{ color: accent }} />
                            : <Crown className="h-4 w-4" style={{ color: accent }} />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white">
                            {w.dimension}: <span style={{ color: accent }}>{winnerName}</span>
                          </p>
                          <p className="text-xs text-slate-400">{w.reason}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pros & cons */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {([
                { tool: toolA, side: 'a' as const, accent: '#e94560', pros: result.pros_a, cons: result.cons_a, best: result.best_for_a, desc: result.description_a },
                { tool: toolB, side: 'b' as const, accent: '#818cf8', pros: result.pros_b, cons: result.cons_b, best: result.best_for_b, desc: result.description_b },
              ]).map(({ tool, accent, pros, cons, best, desc }) => (
                <div key={tool.slug} className="flex flex-col gap-4 rounded-2xl border p-5"
                  style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                      {tool.name}
                    </p>
                    {desc && <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-400">{desc}</p>}
                  </div>

                  {pros.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strengths</p>
                      <ul className="space-y-1.5">
                        {pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cons.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">Limitations</p>
                      <ul className="space-y-1.5">
                        {cons.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto rounded-xl border-t pt-3" style={{ borderColor: '#1e2a3a' }}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Best for</p>
                    <p className="text-xs leading-relaxed text-slate-300">{best}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/tools/${tool.slug}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold text-white transition hover:bg-white/5"
                      style={{ borderColor: '#1e2a3a' }}>
                      View profile <ArrowRight className="h-3 w-3" />
                    </Link>
                    {tool.website && (
                      <a href={tool.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                        style={{ background: accent }}>
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reset */}
            <div className="pt-2 text-center">
              <button onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white">
                <RefreshCw className="h-4 w-4" /> Compare different tools
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!canCompare && !loading && !result && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border py-16 text-center"
            style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
            <p className="mb-2 text-sm text-slate-400">Pick two tools above to see how they stack up</p>
            <Link href="/directory" className="mt-2 text-xs hover:underline" style={{ color: '#e94560' }}>
              Browse all tools in the directory →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
