'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Tool {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  website: string
  logo_url: string
  category_id: string
  category: string
  status: 'active' | 'pending' | 'rejected' | 'inactive'
  pricing_model: string
  upvotes: number
  rating: number
  added: string
  claimed: boolean
  claimed_by: string | null
  claimed_by_email: string | null
  is_auto_enrolled: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function EditToolPage() {
  const router = useRouter()
  const params = useParams()
  const toolId = params.id as string

  const [tool, setTool] = useState<Tool | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch tool
        const { data: toolData, error: toolError } = await supabase
          .from('ai_tools')
          .select('*, categories(name)')
          .eq('id', toolId)
          .single()

        if (toolError) throw toolError
        setTool(toolData)

        // Fetch categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (catError) throw catError
        setCategories(catData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toolId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!tool) return
    const { name, value } = e.target
    setTool(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleSave = async () => {
    if (!tool) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tool.name,
          tagline: tool.tagline,
          description: tool.description,
          website: tool.website,
          logo_url: tool.logo_url,
          category_id: tool.category_id,
          status: tool.status,
          pricing_model: tool.pricing_model,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save tool')
      }

      setSuccess(true)
      setTimeout(() => router.push('/admin/listings'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-slate-400">Tool not found</p>
        <button onClick={() => router.push('/admin/listings')} className="text-sm text-red-400 hover:text-red-300">
          Back to listings
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/listings')}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Tool</h1>
          <p className="text-sm text-slate-400">{tool.name}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-400 text-sm">
          Saved successfully! Redirecting...
        </div>
      )}

      {/* Form */}
      <div className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: 'rgba(15, 23, 42, 0.5)' }}>
          <h2 className="mb-4 text-lg font-bold text-white">Basic Information</h2>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={tool.name}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Tagline</label>
              <input
                type="text"
                name="tagline"
                value={tool.tagline}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description</label>
              <textarea
                name="description"
                value={tool.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* URLs & Media */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: 'rgba(15, 23, 42, 0.5)' }}>
          <h2 className="mb-4 text-lg font-bold text-white">URLs & Media</h2>
          <div className="space-y-4">
            {/* Website */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={tool.website}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Logo URL</label>
              <input
                type="url"
                name="logo_url"
                value={tool.logo_url}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              />
              {tool.logo_url && (
                <img src={tool.logo_url} alt={tool.name} className="mt-3 h-12 w-12 rounded-lg border" style={{ borderColor: '#1e2a3a' }} />
              )}
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: 'rgba(15, 23, 42, 0.5)' }}>
          <h2 className="mb-4 text-lg font-bold text-white">Classification</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Category</label>
              <select
                name="category_id"
                value={tool.category_id}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Status</label>
              <select
                name="status"
                value={tool.status}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Pricing Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Pricing Model</label>
              <select
                name="pricing_model"
                value={tool.pricing_model}
                onChange={handleChange}
                className="w-full rounded-lg border bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2"
                style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
              >
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats (Read-only) */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: 'rgba(15, 23, 42, 0.5)' }}>
          <h2 className="mb-4 text-lg font-bold text-white">Stats</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Upvotes</p>
              <p className="text-2xl font-bold text-white">{tool.upvotes}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Rating</p>
              <p className="text-2xl font-bold text-white">{tool.rating.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Added</p>
              <p className="text-sm text-slate-300">{new Date(tool.added).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/listings')}
            className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#e94560' }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  )
}
