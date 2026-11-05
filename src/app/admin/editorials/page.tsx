'use client'

// The editorial review queue.
//
// The only place an editorial becomes public. Drafts arrive here from the
// daily job; nothing leaves this page without someone pressing Publish.
import { useCallback, useEffect, useState } from 'react'
import { FileText, Check, Trash2, Eye, EyeOff, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

interface Source { label: string; url: string; kind?: string; published?: string | null }
interface Editorial {
  id: string
  slug: string
  title: string
  standfirst: string | null
  body_md: string
  sources: Source[]
  coverage_note: string | null
  keywords?: string[] | null
  hero_image?: string | null
  status: string
  published_at: string | null
  created_at: string
}
interface Correction {
  id: string
  editorial_slug: string
  email: string
  message: string
  status: string
  created_at: string
}

// A linked repository is the company's own, so it does not count as coverage.
const independent = (e: Editorial) => (e.sources ?? []).filter(s => s.kind !== 'github').length

export default function AdminEditorials() {
  const [editorials, setEditorials] = useState<Editorial[]>([])
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/editorials')
      if (!res.ok) throw new Error((await res.json()).error ?? 'Could not load')
      const json = await res.json()
      setEditorials(json.editorials ?? [])
      setCorrections(json.corrections ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    if (action === 'delete' && !confirm('Delete this editorial? This cannot be undone.')) return
    if (action === 'publish' && !confirm('Publish this editorial? If the listing is claimed, its owner is emailed.')) return
    if (action === 'regenerate' && !confirm(
      'Rewrite this editorial from scratch? It keeps its URL and stays published if it already is, '
      + 'but the current text is replaced. This takes up to a minute.'
    )) return
    setBusy(id)
    try {
      const res = await fetch('/api/admin/editorials', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      if (action === 'publish' && json.notified?.skipped) {
        alert(`Published. Owner not emailed: ${json.notified.skipped}`)
      }
      if (action === 'regenerate') {
        alert(`Rewritten. Independent sources found: ${json.sources ?? 0}.`)
      }
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  const drafts = editorials.filter(e => e.status !== 'published')
  const live = editorials.filter(e => e.status === 'published')
  const openCorrections = corrections.filter(c => c.status !== 'resolved')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6" style={{ color: '#e94560' }} />
        <h1 className="text-2xl font-black text-white">Editorials</h1>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Drafts are written automatically and published by hand. Read before you publish —
        your name is on it, and if the listing is claimed the owner gets an email.
      </p>

      {error && <p className="mt-6 text-sm text-rose-400">{error}</p>}
      {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}

      {openCorrections.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
            Corrections ({openCorrections.length})
          </h2>
          <div className="space-y-3">
            {openCorrections.map(c => (
              <div key={c.id} className="rounded-xl border p-4"
                style={{ borderColor: '#4a2a35', background: '#1d1419' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      <span className="font-semibold">{c.email}</span>
                      <span className="text-slate-500"> on </span>
                      <a href={`/editorial/${c.editorial_slug}`} target="_blank" rel="noreferrer"
                        className="underline" style={{ color: '#e94560' }}>{c.editorial_slug}</a>
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{c.message}</p>
                  </div>
                  <button onClick={() => act(c.id, 'resolve-correction')} disabled={busy === c.id}
                    className="flex-none rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-300"
                    style={{ borderColor: '#1e2a3a' }}>Resolve</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          Waiting for review ({drafts.length})
        </h2>
        {drafts.length === 0 && !loading && (
          <p className="text-sm text-slate-600">Nothing waiting. The next draft is written at 05:00 UTC.</p>
        )}
        <div className="space-y-4">
          {drafts.map(e => (
            <article key={e.id} className="rounded-2xl border p-5"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <h3 className="text-lg font-bold text-white">{e.title}</h3>
              {e.standfirst && <p className="mt-1 text-sm text-slate-400">{e.standfirst}</p>}

              {/* The same fallback the public page uses, so what is reviewed
                  here is what readers get. eslint-disable-next-line @next/next/no-img-element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.hero_image || `/api/editorial-hero/${e.slug}`} alt=""
                className="mt-3 w-full max-w-sm rounded-lg border object-cover"
                style={{ borderColor: '#1e2a3a', aspectRatio: '1200 / 630' }} />

              <p className="mt-3 text-xs text-slate-500">
                /{e.slug} · {independent(e)} independent source{independent(e) === 1 ? '' : 's'}
                {(e.keywords?.length ?? 0) > 0 && <> · keywords: {e.keywords!.join(', ')}</>}
                {independent(e) === 0 && (
                  <span className="text-amber-500"> · no independent coverage — check the piece says so</span>
                )}
              </p>

              {e.coverage_note && (
                <p className="mt-3 rounded-lg border p-3 text-xs leading-relaxed text-slate-400"
                  style={{ borderColor: '#1e2a3a' }}>{e.coverage_note}</p>
              )}

              {(e.sources?.length ?? 0) > 0 && (
                <ul className="mt-3 space-y-1">
                  {e.sources.map(s => (
                    <li key={s.url} className="text-xs">
                      <a href={s.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-400 hover:underline">
                        <ExternalLink className="h-3 w-3" />{s.label} {s.published ? `(${s.published})` : ''}
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <button onClick={() => setOpenId(openId === e.id ? null : e.id)}
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                {openId === e.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {openId === e.id ? 'Hide' : 'Read and edit'}
              </button>

              {openId === e.id && (
                <div className="mt-3">
                  <textarea
                    rows={18}
                    value={edits[e.id] ?? e.body_md}
                    onChange={ev => setEdits({ ...edits, [e.id]: ev.target.value })}
                    className="w-full rounded-lg border p-3 font-mono text-xs leading-relaxed text-slate-200"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
                  <button
                    onClick={() => act(e.id, 'save', { body_md: edits[e.id] ?? e.body_md })}
                    disabled={busy === e.id || (edits[e.id] ?? e.body_md) === e.body_md}
                    className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-40"
                    style={{ borderColor: '#1e2a3a' }}>Save changes</button>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => act(e.id, 'publish')} disabled={busy === e.id}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: '#e94560' }}>
                  <Check className="h-4 w-4" /> Publish
                </button>
                <button onClick={() => act(e.id, 'regenerate')} disabled={busy === e.id}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-300 disabled:opacity-50"
                  style={{ borderColor: '#1e2a3a' }}>
                  <RefreshCw className={`h-4 w-4 ${busy === e.id ? 'animate-spin' : ''}`} />
                  {busy === e.id ? 'Rewriting…' : 'Regenerate'}
                </button>
                <button onClick={() => act(e.id, 'delete')} disabled={busy === e.id}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-400"
                  style={{ borderColor: '#1e2a3a' }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          Live ({live.length})
        </h2>
        <div className="space-y-2">
          {live.map(e => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border p-3"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <a href={`/editorial/${e.slug}`} target="_blank" rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-semibold text-white hover:underline">
                {e.title}
              </a>
              <span className="flex-none text-xs text-slate-600">
                {e.published_at ? new Date(e.published_at).toLocaleDateString('en-GB') : ''}
              </span>
              <button onClick={() => act(e.id, 'regenerate')} disabled={busy === e.id}
                className="flex-none inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-50"
                style={{ borderColor: '#1e2a3a' }}>
                <RefreshCw className={`h-3.5 w-3.5 ${busy === e.id ? 'animate-spin' : ''}`} />
                {busy === e.id ? 'Rewriting…' : 'Regenerate'}
              </button>
              <button onClick={() => act(e.id, 'unpublish')} disabled={busy === e.id}
                className="flex-none rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-400"
                style={{ borderColor: '#1e2a3a' }}>Unpublish</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
