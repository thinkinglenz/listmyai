'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function BacklinkCopyClient({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const html = `<a href="https://listmyai.com/tools/${slug}" target="_blank" rel="noopener noreferrer">Listed on ListmyAI</a>`

  function copy() {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
      style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
      <code className="flex-1 truncate text-xs text-slate-500">{html}</code>
      <button onClick={copy} className="flex-shrink-0 text-slate-600 transition hover:text-white">
        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
