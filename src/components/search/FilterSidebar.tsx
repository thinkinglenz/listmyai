'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@/types'
import { PRICING_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { SlidersHorizontal } from 'lucide-react'

interface Props { categories: Category[] }

const PRICING_OPTIONS = Object.entries(PRICING_LABELS)
const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating',  label: 'Top Rated' },
  { value: 'name',    label: 'A → Z' },
]

export default function FilterSidebar({ categories }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  function set(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/directory?${params}`)
  }

  function toggle(key: string) {
    const current = sp.get(key)
    set(key, current === '1' ? null : '1')
  }

  const active = (key: string, val: string) => sp.get(key) === val

  return (
    <aside className="w-full space-y-6 lg:w-60 shrink-0">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <SlidersHorizontal className="h-4 w-4 text-brand-red" />
        Filters
      </div>

      {/* Sort */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sort By</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map(o => (
            <button key={o.value} onClick={() => set('sort', o.value)}
              className={cn('w-full rounded-lg px-3 py-2 text-left text-sm transition',
                active('sort', o.value)
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</h3>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          <button onClick={() => set('category', null)}
            className={cn('w-full rounded-lg px-3 py-2 text-left text-sm transition',
              !sp.get('category')
                ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
            All Categories
          </button>
          {categories.map(c => (
            <button key={c.slug} onClick={() => set('category', c.slug)}
              className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                active('category', c.slug)
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              <span>{c.name}</span>
              <span className="text-xs text-slate-600">{c.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Pricing</h3>
        <div className="space-y-1">
          <button onClick={() => set('pricing', null)}
            className={cn('w-full rounded-lg px-3 py-2 text-left text-sm transition',
              !sp.get('pricing')
                ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
            Any Pricing
          </button>
          {PRICING_OPTIONS.map(([val, label]) => (
            <button key={val} onClick={() => set('pricing', val)}
              className={cn('w-full rounded-lg px-3 py-2 text-left text-sm transition',
                active('pricing', val)
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Features</h3>
        <div className="space-y-2">
          {[
            { key: 'trial', label: '✅ Has Free Trial' },
            { key: 'api',   label: '⚡ Has API' },
            { key: 'promo', label: '🎁 Active Promo' },
          ].map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
              <input type="checkbox" checked={sp.get(key) === '1'} onChange={() => toggle(key)}
                className="h-4 w-4 accent-brand-red rounded" />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Clear */}
      {sp.toString() && (
        <button onClick={() => router.push('/directory')}
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-slate-400 transition hover:border-brand-red/30 hover:text-brand-red">
          Clear all filters
        </button>
      )}
    </aside>
  )
}
