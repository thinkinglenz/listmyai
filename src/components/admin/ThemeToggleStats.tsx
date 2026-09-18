'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface Counts { light: number; dark: number; total: number; light7: number; dark7: number; total7: number }

/** How often visitors use the light/dark switch. */
export default function ThemeToggleStats() {
  const [c, setC] = useState<Counts | null>(null)
  useEffect(() => {
    fetch('/api/admin/events-summary').then(r => r.ok ? r.json() : null).then(d => setC(d?.themeToggle ?? null)).catch(() => {})
  }, [])
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white">Theme switch clicks</h2>
        <span className="text-xs text-slate-500">all time · last 7 days</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: Sun, label: 'To light', all: c?.light, week: c?.light7 },
          { icon: Moon, label: 'To dark', all: c?.dark, week: c?.dark7 },
          { icon: null, label: 'Total clicks', all: c?.total, week: c?.total7 },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">{s.icon && <s.icon className="h-3.5 w-3.5" />}{s.label}</p>
            <p className="mt-1 text-2xl font-black text-white">{s.all ?? '—'}</p>
            <p className="text-xs text-slate-500">{s.week ?? '—'} this week</p>
          </div>
        ))}
      </div>
    </div>
  )
}
