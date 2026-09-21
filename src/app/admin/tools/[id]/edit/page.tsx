'use client'

// The admin's full editor. It shows exactly the fields a listing owner sees
// (shared component), plus the controls only an admin has: status, category,
// featured/sponsored flags, and the listing's live numbers.

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle2, ExternalLink, ShieldCheck, Loader2 } from 'lucide-react'
import ListingFields, { Field, Section, Toggle, inputCls, selectStyle } from '@/components/listing/ListingFields'

interface Category { id: number; name: string }

const STATUSES = ['active', 'pending', 'rejected', 'inactive'] as const

export default function AdminEditToolPage() {
  const router = useRouter()
  const toolId = useParams().id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tool, setTool] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [toolRes, catRes] = await Promise.all([
        fetch(`/api/admin/tools/${toolId}`).then(r => r.json()),
        fetch('/api/admin/categories').then(r => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
      ])
      if (toolRes.error) setError(toolRes.error)
      else setTool(toolRes.tool)
      // The categories endpoint returns { data }.
      setCategories(catRes.data ?? catRes.categories ?? [])
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }, [toolId])

  useEffect(() => { load() }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(key: string, value: any) {
    setTool((t: Record<string, unknown>) => ({ ...t, [key]: value }))
  }

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    try {
      // Columns the admin API will not accept (counts, ownership, timestamps)
      // are dropped rather than sent and rejected.
      const {
        id, slug, created_at, updated_at, published_at, announced_at, categories: _cat,
        claimed, claimed_by, claimed_by_email, submitted_by, owner_id, listing_free_until,
        listing_plan, view_count, click_count, upvotes, rating_avg, rating_count,
        social_hook, spotlight_turn_at, is_auto_enrolled, ...fields
      } = tool
      void slug; void created_at; void updated_at; void published_at; void announced_at
      void _cat; void claimed; void claimed_by; void claimed_by_email; void submitted_by
      void owner_id; void listing_free_until; void listing_plan; void view_count
      void click_count; void upvotes; void rating_avg; void rating_count; void social_hook
      void spotlight_turn_at; void is_auto_enrolled

      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      })
      const data = await res.json()
      if (!res.ok || data.error) setError(data.error ?? `Save failed (${res.status})`)
      else { setSaved(true); setTimeout(() => setSaved(false), 4000) }
    } catch (e) {
      setError(String(e))
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>
  }
  if (!tool) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-slate-400">{error || 'Tool not found'}</p>
        <button onClick={() => router.push('/admin/listings')} className="text-sm" style={{ color: '#e94560' }}>Back to listings</button>
      </div>
    )
  }

  const stats: [string, string | number][] = [
    ['Views', (tool.view_count ?? 0).toLocaleString()],
    ['Clicks', (tool.click_count ?? 0).toLocaleString()],
    ['Upvotes', (tool.upvotes ?? 0).toLocaleString()],
    ['Rating', tool.rating_count ? `${Number(tool.rating_avg ?? 0).toFixed(1)} (${tool.rating_count})` : '—'],
    ['Added', tool.created_at ? new Date(tool.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
    ['Claimed by', tool.claimed_by_email ?? (tool.claimed ? 'Claimed' : 'Unclaimed')],
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/listings" className="flex items-center gap-1 text-sm text-slate-500 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Listings
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-lg font-bold text-white">Edit: {tool.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {tool.slug && (
            <a href={`/tools/${tool.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5" style={{ borderColor: '#1e2a3a' }}>
              <ExternalLink className="h-3.5 w-3.5" /> View
            </a>
          )}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: '#e94560' }}>
            {saving ? 'Saving…' : saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      {saved && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">Saved. The listing rebuilds within a minute.</p>}

      <ListingFields tool={tool} set={set}>
        <Section icon={<ShieldCheck className="h-4 w-4" style={{ color: '#e94560' }} />} title="Admin controls" desc="Only visible here, never to the owner">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select value={tool.status ?? 'pending'} onChange={e => set('status', e.target.value)}
                className={`${inputCls} cursor-pointer`} style={selectStyle}>
                {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select value={tool.category_id ?? ''} onChange={e => set('category_id', e.target.value ? Number(e.target.value) : null)}
                className={`${inputCls} cursor-pointer`} style={selectStyle}>
                <option value="">-- Select --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <Toggle checked={tool.is_featured ?? false} onChange={v => set('is_featured', v)} label="Featured" />
            <Toggle checked={tool.is_sponsored ?? false} onChange={v => set('is_sponsored', v)} label="Sponsored" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-0.5 truncate text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </Section>
      </ListingFields>

      <div className="flex justify-end gap-3 py-6">
        <Link href="/admin/listings" className="rounded-xl border px-5 py-3 text-sm text-slate-300 transition hover:text-white" style={{ borderColor: '#1e2a3a' }}>Cancel</Link>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ background: '#e94560' }}>
          {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}
