'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={copyCode}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        copied ? 'bg-emerald-500 text-white' : 'bg-brand-red text-white hover:bg-red-500'
      }`}>
      {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
    </button>
  )
}
