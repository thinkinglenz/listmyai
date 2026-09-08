'use client'

import { useRef, useState } from 'react'
import { Loader2, Upload, X, Plus } from 'lucide-react'

interface Props {
  /** One image (a logo) or many (screenshots). */
  multiple?: boolean
  value: string          // single URL, or comma-separated for multiple
  onChange: (value: string) => void
  placeholder?: string
  /** Square preview suits a logo; wide suits screenshots. */
  aspect?: 'square' | 'wide'
}

export default function MediaUpload({ multiple = false, value, onChange, placeholder, aspect = 'wide' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const urls = value ? value.split(',').map(u => u.trim()).filter(Boolean) : []

  async function upload(files: FileList) {
    setUploading(true)
    setError(null)
    try {
      const uploaded: string[] = []
      // Sequential rather than parallel: a handful of 5MB uploads at once is
      // enough to stall a phone connection.
      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/uploads/media', { method: 'POST', body })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        uploaded.push(data.url)
      }
      onChange(multiple ? [...urls, ...uploaded].join(', ') : uploaded[0])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAt(i: number) {
    const next = urls.filter((_, n) => n !== i)
    onChange(next.join(', '))
  }

  const field = 'w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none'
  const fieldStyle = { borderColor: '#1e2a3a' }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          value={multiple ? '' : value}
          onChange={e => !multiple && onChange(e.target.value)}
          placeholder={placeholder ?? (multiple ? 'Upload images, or paste URLs below' : 'Upload an image, or paste a link')}
          readOnly={multiple}
          className={`min-w-0 flex-1 ${field}`}
          style={fieldStyle}
        />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          style={fieldStyle}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : multiple ? <Plus className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : multiple ? 'Add images' : 'Upload'}
        </button>
      </div>

      <input ref={inputRef} type="file" multiple={multiple} accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={e => { if (e.target.files?.length) upload(e.target.files) }} />

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

      {urls.length > 0 && (
        <div className={multiple ? 'mt-3 grid grid-cols-3 gap-2' : 'mt-3'}>
          {urls.map((url, i) => (
            <div key={url + i} className="group relative overflow-hidden rounded-lg border"
              style={{ borderColor: '#1e2a3a', background: '#0b1220' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className={aspect === 'square' ? 'h-20 w-20 object-cover' : 'aspect-video w-full object-cover'} />
              <button type="button" onClick={() => removeAt(i)} title="Remove"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
