'use client'

import { useState, useEffect } from 'react'
import { Bot, Play, RefreshCw, CheckCircle, XCircle, Clock, Plus, Trash2, Globe, AlertCircle, Database, Sparkles, GitFork, Download, Eye, Link2 } from 'lucide-react'

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
  { id: 's1', name: 'Futurepedia', url: 'https://www.futurepedia.io/sitemap.xml', status: 'idle' },
  { id: 's2', name: 'FutureTools', url: 'https://www.futuretools.io/sitemap.xml', status: 'idle' },
  { id: 's3', name: 'Toolify.ai', url: 'https://www.toolify.ai/sitemap.xml', status: 'idle' },
  { id: 's4', name: 'AI Top Tools', url: 'https://aitoptools.com/sitemap.xml', status: 'idle' },
  { id: 's5', name: 'TopAI.tools', url: 'https://topai.tools/sitemap.xml', status: 'idle' },
  { id: 's6', name: 'AIcyclopedia', url: 'https://www.aicyclopedia.com/sitemap.xml', status: 'idle' },
  { id: 's7', name: 'AI Tools Directory', url: 'https://aitoolsdirectory.com/sitemap.xml', status: 'idle' },
]

// ── GitHub Awesome Lists Component ──
interface GitForkList { name: string; url: string }
interface GitForkImportResult { imported: number; skipped: number; errors: string[]; total: number }

function GitForkListsSection({ onImported }: { onImported: () => void }) {
  const [lists, setLists] = useState<GitForkList[]>([])
  const [loading, setLoading] = useState(false)
  const [importingUrl, setImportingUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTools, setPreviewTools] = useState<{ name: string; website: string; description: string; category: string }[]>([])
  const [result, setResult] = useState<GitForkImportResult | null>(null)
  const [customUrl, setCustomUrl] = useState('')
  const [maxImport, setMaxImport] = useState(200)

  useEffect(() => {
    fetch('/api/admin/scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listGitForkLists' }),
    })
      .then(r => r.json())
      .then(d => setLists(d.lists ?? []))
      .catch(() => {})
  }, [])

  async function preview(url: string) {
    setPreviewUrl(url)
    setPreviewTools([])
    setLoading(true)
    try {
      const res = await fetch('/api/admin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'previewGitForkList', listUrl: url }),
      })
      const data = await res.json()
      setPreviewTools(data.tools ?? [])
    } catch (err) {
      setPreviewTools([])
    }
    setLoading(false)
  }

  async function importList(url: string) {
    setImportingUrl(url)
    setResult(null)
    try {
      const res = await fetch('/api/admin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'importGitForkList', listUrl: url, maxImport }),
      })
      const data = await res.json()
      setResult(data)
      onImported()
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: [String(err)], total: 0 })
    }
    setImportingUrl(null)
  }

  async function importCustom() {
    if (!customUrl) return
    setImportingUrl(customUrl)
    setResult(null)
    try {
      const res = await fetch('/api/admin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'importCustomList', listUrl: customUrl, maxImport }),
      })
      const data = await res.json()
      setResult(data)
      onImported()
    } catch (err) {
      setResult({ imported: 0, skipped: 0, errors: [String(err)], total: 0 })
    }
    setImportingUrl(null)
  }

  return (
    <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <GitFork className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">GitHub Awesome Lists</h2>
            <p className="text-xs text-slate-500">Import AI tools from curated GitHub awesome-list repositories — no scraping blocks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Max import:</span>
          <select value={maxImport} onChange={e => setMaxImport(Number(e.target.value))}
            className="rounded-lg border px-2 py-1 text-xs text-slate-300 outline-none"
            style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-4 rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-emerald-400">✨ No scraping needed!</strong> These lists are public markdown files on GitHub.
          The parser extracts tool names, URLs, descriptions, and auto-categorises them. Duplicates are automatically skipped.
        </p>
      </div>

      {/* Available lists */}
      <div className="space-y-2 mb-4">
        {lists.map(list => (
          <div key={list.url} className="flex items-center gap-3 rounded-xl p-3" style={{ background: '#0d1117' }}>
            <GitFork className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{list.name}</p>
              <p className="text-[10px] text-slate-600 truncate">{list.url}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => preview(list.url)} disabled={loading || !!importingUrl}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white hover:bg-white/5 disabled:opacity-40"
                style={{ border: '1px solid #1e2a3a' }}>
                <Eye className="h-3 w-3" /> Preview
              </button>
              <button onClick={() => importList(list.url)} disabled={!!importingUrl}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: importingUrl === list.url ? '#1e2a3a' : '#10b981' }}>
                {importingUrl === list.url
                  ? <><RefreshCw className="h-3 w-3 animate-spin" /> Importing…</>
                  : <><Download className="h-3 w-3" /> Import</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom URL */}
      <div className="rounded-xl p-3 mb-4" style={{ background: '#0d1117', border: '1px dashed #1e2a3a' }}>
        <p className="text-xs font-semibold text-slate-400 mb-2">+ Custom GitHub List URL</p>
        <div className="flex gap-2">
          <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
            placeholder="https://raw.githubusercontent.com/user/repo/main/README.md"
            className="flex-1 rounded-lg border px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }} />
          <button onClick={importCustom} disabled={!customUrl || !!importingUrl}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: '#10b981' }}>
            {importingUrl === customUrl
              ? <><RefreshCw className="h-3 w-3 animate-spin" /> Importing…</>
              : <><Link2 className="h-3 w-3" /> Import</>}
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {previewUrl && previewTools.length > 0 && (
        <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: '#1e2a3a' }}>
          <div className="flex items-center justify-between px-4 py-2" style={{ background: '#0d1117' }}>
            <p className="text-xs font-semibold text-white">
              Preview: {previewTools.length} tools found
            </p>
            <div className="flex gap-2">
              <button onClick={() => importList(previewUrl)} disabled={!!importingUrl}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#10b981' }}>
                <Download className="h-3 w-3" /> Import All
              </button>
              <button onClick={() => { setPreviewUrl(null); setPreviewTools([]) }}
                className="text-xs text-slate-500 hover:text-white px-2">✕</button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y" style={{ borderColor: '#1e2a3a' }}>
            {previewTools.slice(0, 50).map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs" style={{ background: i % 2 === 0 ? '#161b27' : '#0d1117' }}>
                <span className="font-semibold text-white min-w-[140px] truncate">{t.name}</span>
                <span className="text-slate-500 truncate flex-1">{t.description.slice(0, 80)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{t.category}</span>
              </div>
            ))}
            {previewTools.length > 50 && (
              <div className="px-4 py-2 text-xs text-slate-500 text-center">
                … and {previewTools.length - 50} more
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-blue-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Parsing markdown…
        </div>
      )}

      {/* Import result */}
      {result && (
        <div className="rounded-xl p-4" style={{ background: '#0d1117' }}>
          <div className="flex flex-wrap gap-6 mb-2">
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">{result.imported}</p>
              <p className="text-[10px] text-slate-500">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-500">{result.skipped}</p>
              <p className="text-[10px] text-slate-500">Skipped (duplicates)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-300">{result.total}</p>
              <p className="text-[10px] text-slate-500">Total Found</p>
            </div>
            {result.errors.length > 0 && (
              <div className="text-center">
                <p className="text-2xl font-black text-red-400">{result.errors.length}</p>
                <p className="text-[10px] text-slate-500">Errors</p>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              {result.errors.slice(0, 10).map((e, i) => (
                <p key={i} className="text-[10px] text-red-400 truncate">⚠ {e}</p>
              ))}
            </div>
          )}
          {result.imported > 0 && (
            <p className="mt-3 text-xs text-emerald-400 font-semibold">
              ✅ {result.imported} new tools are now live and visible in the directory!
            </p>
          )}
        </div>
      )}
    </div>
  )
}

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

  // ── Enrichment state ──
  const [enrichLimit, setEnrichLimit] = useState(10)
  const [enrichOffset, setEnrichOffset] = useState(0)
  const [enriching, setEnriching] = useState(false)
  const [enrichResult, setEnrichResult] = useState<{ enriched: number; skipped: number; errors: number; total: number; details?: { slug: string; updated: boolean; fields: string[]; error?: string }[] } | null>(null)

  async function runEnrich() {
    setEnriching(true)
    setEnrichResult(null)
    try {
      const res = await fetch(`/api/admin/enrich?secret=listmyai_import_2026&limit=${enrichLimit}&offset=${enrichOffset}`)
      const data = await res.json()
      if (data.error) {
        setEnrichResult({ enriched: 0, skipped: 0, errors: 1, total: 0, details: [{ slug: '-', updated: false, fields: [], error: data.error }] })
      } else {
        setEnrichResult(data)
        setEnrichOffset(prev => prev + enrichLimit)
      }
    } catch (err) {
      setEnrichResult({ enriched: 0, skipped: 0, errors: 1, total: 0, details: [{ slug: '-', updated: false, fields: [], error: String(err) }] })
    }
    setEnriching(false)
  }

  const isAnyRunning = sources.some(s => s.status === 'running')
  const totalImported = logs.reduce((acc, l) => acc + l.imported, 0)

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Scraper & Enrichment</h1>
          <p className="text-sm text-slate-500">Import tools from competitors and enrich existing listings with metadata</p>
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
              <input id="new-source-name" name="new-source-name" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Source name" autoComplete="off"
                className="w-40 rounded-xl border px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
              <input id="new-source-url" name="new-source-url" value={newUrl} onChange={e => setNewUrl(e.target.value)}
                placeholder="https://example.com/sitemap.xml" autoComplete="off"
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
              <li>• Start with <strong className="text-slate-400">Futurepedia</strong> or <strong className="text-slate-400">Toolify</strong> — they allow scraping</li>
              <li>• Run one source at a time to avoid rate limiting</li>
              <li>• Each run imports up to {batchSize} new tools, skipping duplicates</li>
              <li>• Scraped tools go <strong className="text-emerald-400">live immediately</strong> — no approval needed</li>
              <li>• They show as <strong className="text-slate-300">Unclaimed</strong> until the owner claims them</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── GitHub Awesome Lists Section ── */}
      <GitForkListsSection onImported={() => fetch('/api/admin/scraper').then(r => r.json()).then(d => setStats(d)).catch(() => {})} />

      {/* ── Enrichment Section ── */}
      <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Enrichment</h2>
              <p className="text-xs text-slate-500">Scrapes each tool&apos;s website to fill in missing metadata — description, pricing, socials, about page, etc.</p>
            </div>
          </div>
          <button onClick={runEnrich} disabled={enriching}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ background: '#8b5cf6' }}>
            {enriching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {enriching ? 'Enriching…' : 'Run Enrichment'}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-4 rounded-xl p-3" style={{ background: '#0d1117' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Batch size:</span>
            <select value={enrichLimit} onChange={e => setEnrichLimit(Number(e.target.value))}
              className="rounded-lg border px-2 py-1 text-xs text-slate-300 outline-none"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Offset:</span>
            <input type="number" value={enrichOffset} onChange={e => setEnrichOffset(Number(e.target.value))}
              min={0} step={10}
              className="w-20 rounded-lg border px-2 py-1 text-xs text-slate-300 outline-none"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }} />
          </div>
          <button onClick={() => setEnrichOffset(0)} className="text-xs text-slate-500 hover:text-white transition">
            Reset offset
          </button>
          <span className="text-xs text-slate-600 ml-auto">
            Processing tools {enrichOffset + 1}–{enrichOffset + enrichLimit} (oldest first)
          </span>
        </div>

        {/* Results */}
        {enrichResult && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 rounded-xl p-3" style={{ background: '#0d1117' }}>
              <div className="text-center">
                <p className="text-xl font-black text-emerald-400">{enrichResult.enriched}</p>
                <p className="text-[10px] text-slate-500">Enriched</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-500">{enrichResult.skipped}</p>
                <p className="text-[10px] text-slate-500">Skipped</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-red-400">{enrichResult.errors}</p>
                <p className="text-[10px] text-slate-500">Errors</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-300">{enrichResult.total}</p>
                <p className="text-[10px] text-slate-500">Processed</p>
              </div>
            </div>

            {/* Detail rows */}
            <div className="max-h-64 overflow-y-auto rounded-xl border divide-y" style={{ borderColor: '#1e2a3a' }}>
              {enrichResult.details?.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs" style={{ background: i % 2 === 0 ? '#161b27' : '#0d1117' }}>
                  {d.updated
                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    : d.error
                    ? <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    : <span className="h-3.5 w-3.5 rounded-full bg-slate-700 flex-shrink-0" />}
                  <span className="font-semibold text-white min-w-[120px]">{d.slug}</span>
                  {d.updated && (
                    <span className="text-emerald-400">{d.fields.join(', ')}</span>
                  )}
                  {d.error && (
                    <span className="text-red-400 truncate">{d.error}</span>
                  )}
                  {!d.updated && !d.error && (
                    <span className="text-slate-600">Already complete</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
