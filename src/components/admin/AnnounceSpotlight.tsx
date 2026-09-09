'use client'

import { useState } from 'react'
import { Loader2, Send, Eye } from 'lucide-react'

interface Preview {
  dryRun?: boolean
  recipientCount: number
  sample: { email: string; tool: string }[]
  previewHtml: string | null
}

export default function AnnounceSpotlight() {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [result, setResult] = useState<{ sent: number; attempted: number; failures: string[] } | null>(null)
  const [busy, setBusy] = useState<'preview' | 'send' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(send: boolean) {
    setBusy(send ? 'send' : 'preview')
    setError(null)
    try {
      const res = await fetch('/api/admin/announce-spotlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      if (send) setResult(data)
      else setPreview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <p className="text-sm font-bold text-white">Announce the homepage spotlight</p>
      <p className="mt-1 text-xs text-slate-500">
        One email to each listing owner about a listing they own, with an opt-in link for future offers.
        Preview first — sending cannot be undone.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => run(false)} disabled={busy !== null}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          style={{ borderColor: '#1e2a3a' }}>
          {busy === 'preview' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          Preview recipients
        </button>

        {/* Only offered once the list has actually been seen. */}
        {preview && !result && (
          <button
            onClick={() => {
              if (confirm(`Send to ${preview.recipientCount} listing owners? This cannot be undone.`)) run(true)
            }}
            disabled={busy !== null}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#e94560' }}>
            {busy === 'send' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send to {preview.recipientCount}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {preview && !result && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-400">
            <strong className="text-white">{preview.recipientCount}</strong> listing owners would receive this.
          </p>
          {preview.sample.length > 0 && (
            <p className="text-[11px] text-slate-600">
              For example: {preview.sample.map(s => `${s.email} (${s.tool})`).join(' · ')}
            </p>
          )}
          {preview.previewHtml && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-slate-400">Preview the email</summary>
              <div className="mt-2 overflow-hidden rounded-lg border" style={{ borderColor: '#1e2a3a' }}
                dangerouslySetInnerHTML={{ __html: preview.previewHtml }} />
            </details>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border px-3 py-2.5 text-xs"
          style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7' }}>
          Sent {result.sent} of {result.attempted}.
          {result.failures.length > 0 && (
            <span className="text-amber-400"> {result.failures.length} failed.</span>
          )}
        </div>
      )}
    </div>
  )
}
