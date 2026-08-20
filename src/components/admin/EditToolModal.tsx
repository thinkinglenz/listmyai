'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import PreviewImageUpload from '@/components/PreviewImageUpload'

interface Tool {
  id: string
  name: string
  slug: string
  category: string
  category_id?: string | null
  website: string
  tagline: string
  description: string
  logo_url: string
  cover_url?: string | null
}

interface EditToolModalProps {
  tool: Tool
  onClose: () => void
  onSave: (updatedTool: Tool) => void
  categories?: { id: string; name: string }[]
}

export default function EditToolModal({ tool, onClose, onSave, categories = [] }: EditToolModalProps) {
  const [formData, setFormData] = useState(tool)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          tagline: formData.tagline,
          category_id: formData.category_id || null,
          website: formData.website,
          logo_url: formData.logo_url,
          cover_url: formData.cover_url || null,
          description: formData.description,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update tool')
      }

      const updated = await res.json()
      onSave(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Column layout with a capped height so the body scrolls on short
          screens while the header and Save button stay put. */}
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border bg-slate-900" style={{ borderColor: '#1e2a3a' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
          <h2 className="text-lg font-bold text-white">Edit Tool</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              className="w-full rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
            <select
              name="category_id"
              value={formData.category_id ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border bg-white/5 px-3 py-2 text-white focus:outline-none focus:ring-2"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Logo URL</label>
            <input
              type="url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              className="w-full rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
              style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
            />
          </div>

          {/* Cover / preview image override */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Preview image</label>
            <PreviewImageUpload
              toolId={tool.id}
              value={formData.cover_url}
              onChange={url => setFormData(prev => ({ ...prev, cover_url: url }))}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Leave empty to auto-capture the homepage. Set an image when the site blocks
              screenshot bots (Cloudflare and similar), where auto-capture would only get their block page.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#e94560' }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
