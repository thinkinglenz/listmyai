'use client'

import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'

interface Props {
  toolId: string
  value: string | null | undefined
  onChange: (url: string | null) => void
}

/**
 * Upload-or-paste control for a listing's preview image. Used by the admin
 * editor and by owners in their dashboard, which is why it talks to an
 * endpoint that accepts either.
 */
export default function PreviewImageUpload({ toolId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('tool_id', toolId)
      body.append('file', file)

      const res = await fetch('/api/tools/upload-preview', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          value={value ?? ''}
          onChange={e => onChange(e.target.value || null)}
          placeholder="Upload an image, or paste a link to one"
          className="min-w-0 flex-1 rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2"
          style={{ borderColor: '#1e2a3a', '--tw-ring-color': '#e94560' } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          style={{ borderColor: '#1e2a3a' }}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

      {value && (
        <div className="relative mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Listing preview" className="w-full rounded-lg border" style={{ borderColor: '#1e2a3a' }} />
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove image"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-slate-300 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
