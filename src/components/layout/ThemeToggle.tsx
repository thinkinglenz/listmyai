'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'lmai_theme'

/**
 * Light/dark switch. The theme itself is applied before first paint by the
 * script in the root layout; this only flips it, remembers it, and counts
 * the click.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    try { localStorage.setItem(THEME_KEY, next) } catch { /* private mode */ }

    const body = JSON.stringify({ event: 'theme_toggle', value: next, path: location.pathname })
    try {
      if (!navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'application/json' }))) {
        fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
      }
    } catch { /* counting must never break the switch */ }
  }

  const toLight = theme === 'dark'
  return (
    <button type="button" onClick={toggle}
      aria-label={toLight ? 'Switch to light mode' : 'Switch to dark mode'}
      title={toLight ? 'Light mode' : 'Dark mode'}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/5 hover:text-white ${className}`}>
      {toLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
