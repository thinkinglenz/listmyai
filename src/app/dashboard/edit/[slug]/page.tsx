'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ListingFields from '@/components/listing/ListingFields'
import { Save, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tool, setTool] = useState<any>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/tools/update?slug=${slug}`)
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setLoading(false)
      return
    }
    setTool(data.tool)
    setCategoryId(data.tool.category_id)
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(k: string, v: any) {
    setTool((t: Record<string, unknown>) => ({ ...t, [k]: v }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { id, slug: _s, created_at, updated_at, categories, status, claimed, claimed_by, submitted_by,
        is_featured, is_sponsored, owner_id, listing_free_until, listing_plan, view_count, click_count,
        upvotes, rating_avg, rating_count, ...fields } = tool

      if (categoryId) fields.category_id = categoryId

      const res = await fetch('/api/tools/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: id, ...fields }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      setError(String(err))
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading listing…</p>
      </div>
    )
  }

  if (error && !tool) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-bold text-red-400">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm hover:underline" style={{color:'#e94560'}}>
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!tool) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-slate-500 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-lg font-bold text-white">Edit: {tool.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/tools/${slug}`} target="_blank"
            className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
            style={{borderColor:'#1e2a3a'}}>
            <ExternalLink className="h-3.5 w-3.5" /> View
          </Link>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{background:'#e94560'}}>
            {saving ? 'Saving…' : saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      {saved && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">Changes saved successfully. The page may take up to an hour to reflect updates (ISR caching).</p>}

      <div className="space-y-4">
        <ListingFields tool={tool} set={set} />

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/dashboard" className="rounded-xl border px-5 py-3 text-sm text-slate-300 transition hover:text-white" style={{borderColor:'#1e2a3a'}}>
            Cancel
          </Link>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{background:'#e94560'}}>
            {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
