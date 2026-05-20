'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, X, Check, ArrowRight, Loader2, Zap, Trophy, RefreshCw } from 'lucide-react'
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
}

interface ScoreDimension {
  a: number
  b: number
  label: string
}

interface ComparisonResult {
  winner: string
  summary: string
  scores: Record<string, ScoreDimension>
  pros_a: string[]
  cons_a: string[]
  pros_b: string[]
  cons_b: string[]
  best_for_a: string
  best_for_b: string
  verdict: string
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ scoreA, scoreB, label, winnerSlug, slugA }: {
  scoreA: number; scoreB: number; label: string; winnerSlug: string; slugA: string
}) {
  const aWins = scoreA > scoreB
  const bWins = scoreB > scoreA
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span style={{ color: aWins ? '#e94560' : '#64748b' }}>{scoreA}/10</span>
          <span className="text-slate-700">vs</span>
          <span style={{ color: bWins ? '#e94560' : '#64748b' }}>{scoreB}/10</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${scoreA * 10}%`, background: aWins ? '#e94560' : '#334155' }} />
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${scoreB * 10}%`, background: bWins ? '#e94560' : '#334155' }} />
        </div>
      </div>
    </div>
  )
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
  const ref = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search Supabase
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const { data } = await getSupabase()
        .from('ai_tools')
        .select('slug, name, tagline, pricing_model, starting_price, rating_avg, rating_count, website')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .limit(8)
      setResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(233,69,96,0.35)', background: '#161b27' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</p>
              <p className="font-bold text-white">{selected.name}</p>
              {selected.tagline && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{selected.tagline}</p>}
              {(selected.pricing_model || selected.starting_price) && (
                <p className="text-xs text-slate-600 mt-1">
                  {selected.pricing_model}{selected.starting_price ? ` · from ${selected.starting_price}` : ''}
                </p>
              )}
            </div>
            <button onClick={onClear} className="text-slate-600 hover:text-slate-300 transition p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border p-4 text-left transition hover:border-red-500/30"
          style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">{label}</p>
          <div className="flex items-center gap-2 text-slate-500">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search for a tool…</span>
          </div>
        </button>
      )}

      {!selected && open && (
        <div className="absolute z-40 w-full mt-2 rounded-2xl border shadow-2xl overflow-hidden"
          style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="p-2 border-b" style={{ borderColor: '#1e2a3a' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
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
          <div className="max-h-60 overflow-y-auto">
            {searching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              </div>
            )}
            {!searching && results.map(t => (
              <button key={t.slug} onClick={() => { onSelect(t); setOpen(false); setQuery('') }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/5">
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  {t.tagline && <p className="text-xs text-slate-500 line-clamp-1">{t.tagline}</p>}
                </div>
              </button>
            ))}
            {!searching && query && results.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">No tools found. Try a different name.</p>
            )}
            {!query && (
              <p className="py-6 text-center text-xs text-slate-500">Start typing to search…</p>
            )}
          </div>
        </div>
      )}
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
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setToolA(null)
    setToolB(null)
    setUseCase('')
    setResult(null)
    setError(null)
  }

  const canCompare = toolA && toolB && toolA.slug !== toolB.slug

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Nav */}
      <div className="border-b" style={{ borderColor: '#1e2a3a' }}>
        <nav className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold" style={{ color: '#e94560' }}>← ListmyAI</Link>
          <Link href="/directory" className="text-sm text-slate-500 hover:text-white transition">Browse all tools</Link>
        </nav>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
            <Zap className="h-3.5 w-3.5" /> Data-Driven Comparison
          </div>
          <h1 className="text-4xl font-black text-white">Compare AI Tools</h1>
          <p className="mt-2 text-slate-500">Pick two tools — get an instant, data-driven comparison based on real community data</p>
        </div>

        {/* Tool pickers */}
        <div className="relative grid grid-cols-2 gap-4 mb-4">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-10">
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
          <div className="mb-4">
            <input
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              placeholder="Optional: describe your use case (e.g. 'write blog posts for my SaaS')"
              className="w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-red-500/40"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}
            />
          </div>
        )}

        {/* CTA */}
        {canCompare && !result && (
          <button
            onClick={runComparison}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#e94560' }}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Comparing…</>
            ) : (
              <><Zap className="h-4 w-4" /> Compare Now</>
            )}
          </button>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-8 rounded-2xl border p-10 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#e94560' }} />
            <p className="text-white font-semibold mb-1">Comparing both tools…</p>
            <p className="text-slate-500 text-sm">Analysing community data, features, and pricing</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border p-6 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-red-400 mb-3">{error}</p>
            <button onClick={() => setError(null)}
              className="text-sm text-slate-500 hover:text-white transition flex items-center gap-1.5 mx-auto">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        )}

        {/* Results */}
        {result && toolA && toolB && (
          <div className="mt-8 space-y-5">
            {/* Winner banner */}
            <div className="rounded-2xl border p-5"
              style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.06)' }}>
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-5 w-5" style={{ color: '#e94560' }} />
                <p className="font-bold text-white">
                  {result.winner === 'tie'
                    ? "It's a tie!"
                    : `Winner: ${result.winner === toolA.slug ? toolA.name : toolB.name}`}
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Score table */}
            <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="grid grid-cols-3 mb-4 text-xs font-bold uppercase tracking-wide">
                <span className="text-slate-600">Dimension</span>
                <span className="text-center" style={{ color: '#e94560' }}>{toolA.name}</span>
                <span className="text-center text-slate-400">{toolB.name}</span>
              </div>
              <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {Object.entries(result.scores).map(([key, dim]) => (
                  <ScoreBar
                    key={key}
                    label={dim.label}
                    scoreA={dim.a}
                    scoreB={dim.b}
                    winnerSlug={result.winner}
                    slugA={toolA.slug}
                  />
                ))}
              </div>
            </div>

            {/* Pros & cons */}
            <div className="grid grid-cols-2 gap-4">
              {([
                { tool: toolA, pros: result.pros_a, cons: result.cons_a },
                { tool: toolB, pros: result.pros_b, cons: result.cons_b },
              ] as const).map(({ tool, pros, cons }) => (
                <div key={tool.slug} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <h4 className="font-bold text-white mb-4">{tool.name}</h4>
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Pros</p>
                    <ul className="space-y-2">
                      {pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-400" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Cons</p>
                    <ul className="space-y-2">
                      {cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <X className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-400" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Best for */}
            <div className="grid grid-cols-2 gap-4">
              {([
                { tool: toolA, best: result.best_for_a },
                { tool: toolB, best: result.best_for_b },
              ] as const).map(({ tool, best }) => (
                <div key={tool.slug} className="rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Best for</p>
                  <p className="text-sm text-slate-300">{best}</p>
                  <Link href={`/tools/${tool.slug}`}
                    className="mt-3 flex items-center gap-1 text-xs font-semibold transition hover:opacity-80"
                    style={{ color: '#e94560' }}>
                    View {tool.name} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Final verdict */}
            <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4" style={{ color: '#e94560' }} />
                <p className="font-bold text-white">Verdict</p>
                <span className="text-xs text-slate-600 ml-auto">Based on community data</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.verdict}</p>
            </div>

            {/* Reset */}
            <div className="text-center pt-2">
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
            <p className="text-slate-500 text-sm mb-1">Select two tools above to get an AI-powered comparison</p>
            <Link href="/directory" className="text-xs hover:underline mt-2" style={{ color: '#e94560' }}>
              Browse all tools in the directory →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
