'use client'

import { useState } from 'react'
import { Bot, Play, RefreshCw, CheckCircle, XCircle, Clock, Plus, Trash2, Globe, AlertCircle } from 'lucide-react'

interface ScraperSource {
  id: string
  url: string
  name: string
  lastScraped: string | null
  status: 'idle' | 'running' | 'success' | 'error'
  toolsFound: number
}

interface CronLog {
  id: string
  time: string
  type: 'scrape' | 'email'
  status: 'success' | 'error'
  message: string
}

const MOCK_SOURCES: ScraperSource[] = [
  { id:'s1', url:'https://producthunt.com/topics/artificial-intelligence', name:'Product Hunt – AI', lastScraped:'6h ago', status:'success', toolsFound:14 },
  { id:'s2', url:'https://theresanaiforthat.com/sitemap.xml', name:'TAAFT Sitemap', lastScraped:'6h ago', status:'success', toolsFound:38 },
  { id:'s3', url:'https://futuretools.io', name:'FutureTools', lastScraped:'2d ago', status:'idle', toolsFound:0 },
  { id:'s4', url:'https://aitoptools.com/sitemap.xml', name:'AI Top Tools', lastScraped:null, status:'error', toolsFound:0 },
  { id:'s5', url:'https://topai.tools', name:'TopAI Tools', lastScraped:'1d ago', status:'success', toolsFound:9 },
]

const MOCK_LOGS: CronLog[] = [
  { id:'l1', time:'03:00 today', type:'scrape', status:'success', message:'Scraped 4 sources · 61 new tools imported' },
  { id:'l2', time:'09:00 today', type:'email', status:'success', message:'Trial reminders sent to 3 users' },
  { id:'l3', time:'03:00 yesterday', type:'scrape', status:'error', message:'aitoptools.com returned 403 — skipped' },
  { id:'l4', time:'09:00 yesterday', type:'email', status:'success', message:'No emails to send' },
  { id:'l5', time:'03:00 2d ago', type:'scrape', status:'success', message:'Scraped 5 sources · 23 new tools imported' },
]

const STATUS_ICON: Record<string, React.ReactNode> = {
  idle:    <Clock className="h-4 w-4 text-slate-500" />,
  running: <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />,
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  error:   <XCircle className="h-4 w-4 text-red-400" />,
}

export default function AdminScraperPage() {
  const [sources, setSources] = useState<ScraperSource[]>(MOCK_SOURCES)
  const [running, setRunning] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')

  function runScraper() {
    setRunning(true)
    setSources(prev => prev.map(s => s.status !== 'error' ? { ...s, status: 'running' } : s))
    setTimeout(() => {
      setRunning(false)
      setSources(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'success', lastScraped: 'Just now', toolsFound: Math.floor(Math.random() * 30) + 5 } : s))
    }, 3000)
  }

  function addSource() {
    if (!newUrl || !newName) return
    setSources(prev => [...prev, {
      id: `s${Date.now()}`, url: newUrl, name: newName, lastScraped: null, status: 'idle', toolsFound: 0
    }])
    setNewUrl('')
    setNewName('')
  }

  function removeSource(id: string) {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Scraper Control</h1>
          <p className="text-sm text-slate-500">Auto-discovery runs daily at 3:00 AM UTC via Vercel Cron</p>
        </div>
        <button onClick={runScraper} disabled={running}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#e94560' }}>
          {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Running…' : 'Run Now'}
        </button>
      </div>

      {running && (
        <div className="mb-6 flex gap-3 rounded-2xl border p-4" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.06)' }}>
          <RefreshCw className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Scraper running…</p>
            <p className="text-xs text-slate-400">Fetching sources and discovering new AI tools. This may take 1–3 minutes.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sources */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-white">Scraper Sources</h2>
            <span className="text-xs text-slate-500">{sources.length} sources</span>
          </div>

          <div className="space-y-3 mb-4">
            {sources.map(source => (
              <div key={source.id} className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: '#0d1117' }}>
                  <Globe className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{source.name}</p>
                  <p className="text-xs text-slate-600 truncate">{source.url}</p>
                </div>
                <div className="text-right text-xs">
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    {STATUS_ICON[source.status]}
                    <span className={
                      source.status === 'success' ? 'text-emerald-400' :
                      source.status === 'error' ? 'text-red-400' :
                      source.status === 'running' ? 'text-blue-400' : 'text-slate-500'
                    }>
                      {source.status === 'success' && source.toolsFound > 0 ? `+${source.toolsFound} tools` :
                       source.status === 'error' ? 'Failed' :
                       source.status === 'running' ? 'Running' : 'Never run'}
                    </span>
                  </div>
                  <p className="text-slate-600">{source.lastScraped ?? '—'}</p>
                </div>
                <button onClick={() => removeSource(source.id)}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add source */}
          <div className="rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-sm font-semibold text-white mb-3">Add Source</p>
            <div className="flex gap-2 mb-2">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Source name"
                className="w-36 rounded-xl border px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                placeholder="https://source-url.com"
                className="flex-1 rounded-xl border px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
            </div>
            <button onClick={addSource}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: '#1e2a3a' }}>
              <Plus className="h-4 w-4" /> Add Source
            </button>
          </div>
        </div>

        {/* Cron logs */}
        <div>
          <h2 className="mb-3 font-bold text-white">Cron Logs</h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
              {MOCK_LOGS.map(log => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    {log.status === 'success'
                      ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      : <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                    <span className="text-xs font-semibold text-slate-400 capitalize">{log.type}</span>
                    <span className="ml-auto text-[10px] text-slate-600">{log.time}</span>
                  </div>
                  <p className="text-xs text-slate-500">{log.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cron schedule */}
          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <h3 className="text-sm font-semibold text-white mb-3">Cron Schedule</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Scraper', cron: '0 3 * * *', next: 'Tomorrow 3:00 AM' },
                { label: 'Trial Emails', cron: '0 9 * * *', next: 'Tomorrow 9:00 AM' },
              ].map(j => (
                <div key={j.label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-xs font-semibold text-white">{j.label}</p>
                  <code className="text-[11px] text-slate-500">{j.cron}</code>
                  <p className="text-[10px] text-slate-600 mt-0.5">Next: {j.next} UTC</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
