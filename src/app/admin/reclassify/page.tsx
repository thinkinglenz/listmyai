'use client'

/**
 * Admin screen for the category reclassification pass.
 *
 * Preview is the default and the Apply button stays disabled until a preview
 * has been seen in this session. A pass that rewrites a quarter of the
 * catalogue should not be one misplaced click away.
 */

import { useState } from 'react'
import { Tags, Play, Check, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'

interface Report {
  dryRun: boolean
  scanned: number
  classified: number
  byRules: number
  byModel: number
  stillUnclassified: number
  llmCalls: number
  modelReady: boolean
  warning?: string
  written: number
  writeErrors?: string[]
  breakdown: { categoryId: number; category: string; count: number }[]
  sample: { slug: string; name: string; tagline: string; to: string; via: 'rules' | 'model' }[]
}

export default function ReclassifyPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [busy, setBusy] = useState<'preview' | 'apply' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useLlm, setUseLlm] = useState(false)
  const [limit, setLimit] = useState(200)
  const [previewed, setPreviewed] = useState(false)

  async function run(dryRun: boolean) {
    setBusy(dryRun ? 'preview' : 'apply')
    setError(null)
    try {
      const res = await fetch('/api/admin/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, useLlm, limit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
      setReport(data)
      if (dryRun) setPreviewed(true)
      else setPreviewed(false)  // the next apply needs a fresh preview
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const cap = useLlm ? 150 : 500

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Tags className="h-7 w-7 text-pink-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Recategorise listings</h1>
          <p className="text-sm text-slate-400">
            Moves listings out of &ldquo;Other&rdquo; and out of no category at all. Anything
            uncertain is left exactly where it is.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border p-5" style={{ borderColor: '#1e2a3a', background: '#111827' }}>
        <div className="flex flex-wrap items-end gap-6">
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Listings per run</span>
            <input
              type="number" min={1} max={cap} value={limit}
              onChange={e => setLimit(Math.min(Number(e.target.value) || 1, cap))}
              className="w-32 rounded-lg border bg-slate-900 px-3 py-2 text-white"
              style={{ borderColor: '#1e2a3a' }}
            />
            <span className="mt-1 block text-xs text-slate-500">Max {cap}</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 pb-6 text-sm text-slate-300">
            <input
              type="checkbox" checked={useLlm}
              onChange={e => { setUseLlm(e.target.checked); setLimit(l => Math.min(l, e.target.checked ? 150 : 500)) }}
              className="h-4 w-4 accent-pink-500"
            />
            <Sparkles className="h-4 w-4 text-amber-400" />
            Also use the model for the ones the rules cannot read
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => run(true)} disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-5 py-2.5 font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
          >
            {busy === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Preview
          </button>
          <button
            onClick={() => run(false)} disabled={busy !== null || !previewed}
            title={previewed ? undefined : 'Run a preview first'}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 font-semibold text-white hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'apply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Apply {report && report.dryRun ? `these ${report.classified}` : 'changes'}
          </button>
        </div>
        {!previewed && (
          <p className="mt-3 text-xs text-slate-500">Apply unlocks once you have previewed this run.</p>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Scanned', report.scanned],
              ['Classified', report.classified],
              ['By rules', report.byRules],
              ['By model', report.byModel],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: '#111827' }}>
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{value as number}</p>
              </div>
            ))}
          </div>

          {report.warning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{report.warning}</span>
            </div>
          )}

          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: '#1e2a3a', background: '#111827' }}>
            {report.dryRun ? (
              <p className="text-amber-300">
                Preview only — nothing was written. {report.stillUnclassified} of {report.scanned} would stay
                where they are because neither stage was confident.
              </p>
            ) : (
              <p className="text-emerald-300">
                Written: {report.written} listings updated. {report.stillUnclassified} left unchanged.
              </p>
            )}
            {report.writeErrors?.length ? (
              <ul className="mt-2 list-disc pl-5 text-red-300">
                {report.writeErrors.map(e => <li key={e}>{e}</li>)}
              </ul>
            ) : null}
          </div>

          {report.breakdown.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: '#1e2a3a', background: '#111827' }}>
              <h2 className="mb-3 font-semibold text-white">Where they would go</h2>
              <div className="flex flex-wrap gap-2">
                {report.breakdown.map(b => (
                  <span key={b.categoryId} className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
                    {b.category} <strong className="text-pink-400">{b.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {report.sample.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: '#1e2a3a', background: '#111827' }}>
              <h2 className="mb-3 font-semibold text-white">Spot check</h2>
              <div className="space-y-2">
                {report.sample.map(s => (
                  <div key={s.slug} className="flex flex-wrap items-baseline gap-2 border-b border-slate-800 pb-2 text-sm last:border-0">
                    <span className="font-medium text-white">{s.name}</span>
                    <span className="text-slate-500">{s.tagline}</span>
                    <span className="ml-auto whitespace-nowrap">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{s.via}</span>
                      <span className="ml-2 font-semibold text-pink-400">{s.to}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
