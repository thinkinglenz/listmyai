'use client'

import { useState, useEffect } from 'react'
import { Bot, Play, RefreshCw, CheckCircle, XCircle, Clock, Plus, Trash2, Globe, AlertCircle, Database } from 'lucide-react'

interface Source {
  id: string
  name: string
  url: string
  status: 'idle' | 'running' | 'success' | 'error'
  lastResult?: { imported: number; skipped: number; total: number; errors: string[] }
  lastRun?: string
}

interface LogEntry {
  time: string
  source: string
  imported: number
  skipped: number
  total: number
  errors: string[]
}

const DEFAULT_SOURCES: Source[] = [
  { id: 's1', name: 'There\'s An AI For That', url: 'https://theresanaiforthat.com/sitemap.xml', status: 'idle' },
  { id: 's2', name: 'Futurepedia', url: 'https://www.futurepedia.io/sitemap.xml', status: 'idle' },
  { id: 's3', name: 'FutureTools', url: 'https://www.futuretools.io/sitemap.xml', status: 'idle' },
  { id: 's4', name: 'Toolify.ai', url: 'https://www.toolify.ai/sitemap.xml', status: 'idle' },
  { id: 's5', name: 'AI Top Tools', url: 'https://aitoptools.com/sitemap.xml', status: 'idle' },
  { id: 's6', name: 'TopAI.tools', url: 'https://topai.tools/sitemap.xml', status: 'idle' },
]

export default function AdminScraperPage() {
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<{ total: number; pending: number; autoEnrolled: number } | null>(null)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [batchSize, setBatchSize] = useState(20)

  // Load DB stats on mount
  useEffect(() => {
    fetch('/api/admin/scraper')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  async function runSource(source: Source) {
    setSources(prev => prev.map(s => s.id === source.id ? { ...s, status: 'running' } : s))

    try {
      // Phase 1: get all tool URLs from sitemap
      const urlRes = await fetch('/api/admin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUrls', sourceUrl: source.url }),
      })
      const urlData = await urlRes.json()

      if (urlData.error && !urlData.allUrls?.length) {
        setSources(prev => prev.map(s => s.id === source.id ? {
          ...s, status: 'error',
          lastResult: { imported: 0, skipped: 0, total: 0, errors: [urlData.error] },
          lastRun: new Date().toLocaleTimeString(),
        } : s))
        return
      }

      const allUrls: string[] = urlData.allUrls ?? []
      const totalFound = allUrls.length

      // Phase 2: scrape in batches of 20
      let imported = 0, skipped = 0
      const allErrors: string[] = urlData.error ? [urlData.error] : []
      const toScrape = allUrls.slice(0, batchSize)

      for (let i = 0; i < toScrape.length; i += 20) {
        const batch = toScrape.slice(i, i + 20)
        const scrapeRes = await fetch('/api/admin/scraper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'scrapeUrls', urls: batch }),
        })
        const scrapeData = await scrapeRes.json()
        if (scrapeData.error) { allErrors.push(scrapeData.error); break }
        imported += scrapeData.imported ?? 0
        skipped += scrapeData.skipped ?? 0
        allErrors.push(...(scrapeData.errors ?? []))
      }

      const result = { imported, skipped, total: totalFound, errors: allErrors }
      setSources(prev => prev.map(s => s.id === source.id ? {
        ...s, status: imported === 0 && allErrors.length > 0 ? 'error' : 'success',
        lastResult: result, lastRun: new Date().toLocaleTimeString(),
      } : s))
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), source: source.name, ...result }, ...prev].slice(0, 20))
      fetch('/api/admin/scraper').then(r => r.json()).then(d => setStats(d)).catch(() => {})

    } catch (err) {
      setSources(prev => prev.map(s => s.id === source.id ? {
        ...s, status: 'error',
        lastResult: { imported: 0, skipped: 0, total: 0, errors: [String(err)] },
        lastRun: new Date().toLocaleTimeString(),
      } : s))
    }
  }

  async function runAll() {
    for (const source of sources) {
      if (source.status !== 'running') {
        await runSource(source)
        await new Promise(r => setTimeout(r, 1000)) // brief pause between sources
      }
    }
  }

  function addSource() {
    if (!newUrl || !newName) return
    setSources(prev => [...prev, { id: `s${Date.now()}`, name: newName, url: newUrl, status: 'idle' }])
    setNewUrl('')
    setNewName('')
  }

  function removeSource(id: string) {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  const isAnyRunning = sources.some(s => s.status === 'running')
  const totalImported = logs.reduce((acc, l) => acc + l.imported, 0)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Scraper Control</h1>
          <p className="text-sm text-slate-500">Scrapes competitor directories and auto-imports all AI tools into your database</p>
        </div>
        <button onClick={runAll} disabled={isAnyRunning}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          style={{ background: '#e94560' }}>
          {isAnyRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isAnyRunning ? 'Running…' : 'Run All Sources'}
        </button>
      </div>

      {/* DB Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Tools in DB', value: stats.total ?? 0, color: '#e94560' },
            { label: 'Pending Review', value: stats.pending ?? 0, color: '#f59e0b' },
            { label: 'Auto-Enrolled', value: stats.autoEnrolled ?? 0, color: '#6366f1' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border p-4 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value?.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* How it works banner */}
      <div className="mb-6 rounded-2xl border p-4" style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)' }}>
        <p className="text-sm font-semibold text-white mb-1">🤖 How it works</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Each source is a competitor AI directory. The scraper fetches their sitemap, visits every tool page,
          extracts the name, description, website, and category, then publishes them{' '}
          <span className="text-emerald-400 font-medium">live immediately</span> as{' '}
          <span className="text-slate-300 font-medium">Unclaimed</span> — tool owners can claim their listing anytime.
          Tools already in your database are automatically skipped.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sources list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Competitor Sources ({sources.length})</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tools per run:</span>
              <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}
                className="rounded-lg border px-2 py-1 text-xs text-slate-300 outline-none"
                style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {sources.map(source => (
            <div key={source.id} className="rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl mt-0.5" style={{ background: '#0d1117' }}>
                  <Globe className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white">{source.name}</p>
                    {source.status === 'running' && <RefreshCw className="h-3.5 w-3.5 text-blue-400 animate-spin" />}
                    {source.status === 'success' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                    {source.status === 'error' && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                  <p className="text-xs text-slate-600 truncate">{source.url}</p>

                  {source.lastResult && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span className="text-emerald-400 font-semibold">+{source.lastResult.imported} imported</span>
                      <span className="text-slate-500">{source.lastResult.skipped} skipped</span>
                      <span className="text-slate-600">{source.lastResult.total.toLocaleString()} total found</span>
                      {source.lastResult.errors.length > 0 && (
                        <span className="text-red-400">{source.lastResult.errors.length} errors</span>
                      )}
                      {source.lastRun && <span className="text-slate-600">· {source.lastRun}</span>}
                    </div>
                  )}

                  {source.status === 'running' && (
                    <p className="mt-2 text-xs text-blue-400">Fetching sitemap and scraping tool pages…</p>
                  )}

                  {source.lastResult?.errors[0] && (
                    <p className="mt-1 text-xs text-red-400 truncate">⚠ {source.lastResult.errors[0]}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => runSource(source)} disabled={source.status === 'running' || isAnyRunning}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: source.status === 'running' ? '#1e2a3a' : '#e94560' }}>
                    {source.status === 'running' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    {source.status === 'running' ? 'Running' : 'Scrape'}
                  </button>
                  <button onClick={() => removeSource(source.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add source */}
          <div className="rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
            <p className="text-sm font-semibold text-white mb-3">+ Add Source</p>
            <div className="flex gap-2 mb-2">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Source name"
                className="w-40 rounded-xl border px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                className="flex-1 rounded-xl border px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
            </div>
            <button onClick={addSource} disabled={!newUrl || !newName}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1e2a3a' }}>
              Add Source
            </button>
          </div>
        </div>

        {/* Logs & next steps */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-3 font-bold text-white">Run Log</h2>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              {logs.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No runs yet. Click Scrape on a source.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                  {logs.map((log, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        {log.imported > 0
                          ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          : <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                        <span className="text-xs font-semibold text-white truncate">{log.source}</span>
                        <span className="ml-auto text-[10px] text-slate-600">{log.time}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        +{log.imported} imported · {log.skipped} skipped · {log.total.toLocaleString()} found
                      </p>
                      {log.errors[0] && <p className="text-[10px] text-red-400 mt-0.5 truncate">⚠ {log.errors[0]}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {totalImported > 0 && (
            <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}>
              <p className="text-sm font-bold text-emerald-400 mb-1">✅ {totalImported} tools are now live</p>
              <p className="text-xs text-slate-400 mb-3">
                All imported tools are <strong className="text-emerald-400">Active</strong> and publicly visible as <strong className="text-slate-300">Unclaimed</strong>. Tool owners can claim them anytime.
              </p>
              <a href="/admin/listings"
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: '#10b981' }}>
                <Database className="h-4 w-4" /> View All Listings
              </a>
            </div>
          )}

          <div className="rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <h3 className="text-sm font-semibold text-white mb-2">💡 Tips</h3>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>• Start with <strong className="text-slate-400">TAAFT</strong> — it has the most tools (5,000+)</li>
              <li>• Run one source at a time to avoid rate limiting</li>
              <li>• Each run imports up to {batchSize} new tools, skipping duplicates</li>
              <li>• Scraped tools go <strong className="text-emerald-400">live immediately</strong> — no approval needed</li>
              <li>• They show as <strong className="text-slate-300">Unclaimed</strong> until the owner claims them</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
