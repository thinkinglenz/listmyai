'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@/types'
import { PRICING_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { SlidersHorizontal, ChevronDown, X, Check, ArrowUpDown, Tag, Sparkles } from 'lucide-react'

interface Props { categories: Category[] }

const PRICING_OPTIONS = Object.entries(PRICING_LABELS)
const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating',  label: 'Top Rated' },
  { value: 'name',    label: 'A → Z' },
]

type SheetSection = 'sort' | 'category' | 'pricing' | 'features' | null

export default function FilterSidebar({ categories }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [sheet, setSheet] = useState<SheetSection>(null)

  const set = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/directory?${params}`)
  }, [sp, router])

  function toggle(key: string) {
    const current = sp.get(key)
    set(key, current === '1' ? null : '1')
  }

  const active = (key: string, val: string) => sp.get(key) === val

  const currentSort = SORT_OPTIONS.find(o => o.value === (sp.get('sort') ?? 'popular'))?.label ?? 'Popular'
  const currentCat = categories.find(c => c.slug === sp.get('category'))?.name
  const currentPricing = sp.get('pricing') ? PRICING_LABELS[sp.get('pricing') as keyof typeof PRICING_LABELS] : null
  const featureCount = ['trial', 'api', 'promo'].filter(k => sp.get(k) === '1').length

  const hasFilters = sp.get('category') || sp.get('pricing') || sp.get('trial') || sp.get('api') || sp.get('promo')

  function closeSheet() { setSheet(null) }

  const filterContent = (
    <div className="space-y-6">
      {/* Sort */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sort By</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map(o => (
            <button key={o.value} onClick={() => { set('sort', o.value); closeSheet() }}
              className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
                active('sort', o.value)
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              {o.label}
              {active('sort', o.value) && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </section>

      {/* Category */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</h3>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
          <button onClick={() => { set('category', null); closeSheet() }}
            className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
              !sp.get('category')
                ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
            All Categories
            {!sp.get('category') && <Check className="h-4 w-4" />}
          </button>
          {categories.map(c => (
            <button key={c.slug} onClick={() => { set('category', c.slug); closeSheet() }}
              className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
                active('category', c.slug)
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              <span>{c.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{c.count.toLocaleString()}</span>
                {active('category', c.slug) && <Check className="h-4 w-4 text-brand-red" />}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Pricing</h3>
        <div className="space-y-1">
          <button onClick={() => { set('pricing', null); closeSheet() }}
            className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
              !sp.get('pricing')
                ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
            Any Pricing
            {!sp.get('pricing') && <Check className="h-4 w-4" />}
          </button>
          {PRICING_OPTIONS.map(([val, label]) => (
            <button key={val} onClick={() => { set('pricing', val); closeSheet() }}
              className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
                active('pricing', val)
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              {label}
              {active('pricing', val) && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Features</h3>
        <div className="space-y-1">
          {[
            { key: 'trial', label: 'Has Free Trial', emoji: '✅' },
            { key: 'api',   label: 'Has API',        emoji: '⚡' },
            { key: 'promo', label: 'Active Promo',   emoji: '🎁' },
          ].map(({ key, label, emoji }) => (
            <button key={key}
              onClick={() => { toggle(key); closeSheet() }}
              className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition',
                sp.get(key) === '1'
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
              <span>{emoji} {label}</span>
              {sp.get(key) === '1' && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </section>

      {/* Clear */}
      {sp.toString() && (
        <button onClick={() => { router.push('/directory'); closeSheet() }}
          className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-sm text-slate-400 transition hover:border-brand-red/30 hover:text-brand-red">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* ── Mobile: horizontal filter chips + bottom sheet ─────────────── */}
      <div className="lg:hidden">
        {/* Filter chip bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
          {/* Sort chip */}
          <button onClick={() => setSheet('sort')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              sp.get('sort') && sp.get('sort') !== 'popular'
                ? 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                : 'border-brand-border bg-white/5 text-slate-300'
            )}>
            <ArrowUpDown className="h-3 w-3" />
            {currentSort}
          </button>

          {/* Category chip */}
          <button onClick={() => setSheet('category')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              currentCat
                ? 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                : 'border-brand-border bg-white/5 text-slate-300'
            )}>
            <Sparkles className="h-3 w-3" />
            {currentCat ?? 'Category'}
          </button>

          {/* Pricing chip */}
          <button onClick={() => setSheet('pricing')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              currentPricing
                ? 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                : 'border-brand-border bg-white/5 text-slate-300'
            )}>
            <Tag className="h-3 w-3" />
            {currentPricing ?? 'Price'}
          </button>

          {/* Features chip */}
          <button onClick={() => setSheet('features')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              featureCount > 0
                ? 'border-brand-red/30 bg-brand-red/10 text-brand-red'
                : 'border-brand-border bg-white/5 text-slate-300'
            )}>
            <SlidersHorizontal className="h-3 w-3" />
            Features
            {featureCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                {featureCount}
              </span>
            )}
          </button>

          {/* Clear button - only when filters active */}
          {hasFilters && (
            <button onClick={() => router.push('/directory')}
              className="flex shrink-0 items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10">
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Bottom sheet overlay */}
        {sheet && (
          <div className="fixed inset-0 z-40 bg-black/60" onClick={closeSheet} />
        )}

        {/* Bottom sheet */}
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-brand-border p-5 pt-3 transition-transform duration-300 ease-out',
            sheet ? 'translate-y-0' : 'translate-y-full'
          )}
          style={{ background: '#0d1117' }}>
          {/* Handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-700" />

          {/* Sheet title */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              {sheet === 'sort' && 'Sort By'}
              {sheet === 'category' && 'Category'}
              {sheet === 'pricing' && 'Pricing'}
              {sheet === 'features' && 'Features'}
            </h3>
            <button onClick={closeSheet}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sheet content — show only the relevant section */}
          {sheet === 'sort' && (
            <div className="space-y-1">
              {SORT_OPTIONS.map(o => (
                <button key={o.value} onClick={() => { set('sort', o.value); closeSheet() }}
                  className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                    active('sort', o.value)
                      ? 'bg-brand-red/15 text-brand-red'
                      : 'text-slate-300 hover:bg-white/5')}>
                  {o.label}
                  {active('sort', o.value) && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {sheet === 'category' && (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              <button onClick={() => { set('category', null); closeSheet() }}
                className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                  !sp.get('category')
                    ? 'bg-brand-red/15 text-brand-red'
                    : 'text-slate-300 hover:bg-white/5')}>
                All Categories
                {!sp.get('category') && <Check className="h-4 w-4" />}
              </button>
              {categories.filter(c => c.count > 0).map(c => (
                <button key={c.slug} onClick={() => { set('category', c.slug); closeSheet() }}
                  className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                    active('category', c.slug)
                      ? 'bg-brand-red/15 text-brand-red'
                      : 'text-slate-300 hover:bg-white/5')}>
                  <span>{c.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{c.count.toLocaleString()}</span>
                    {active('category', c.slug) && <Check className="h-4 w-4 text-brand-red" />}
                  </span>
                </button>
              ))}
            </div>
          )}

          {sheet === 'pricing' && (
            <div className="space-y-1">
              <button onClick={() => { set('pricing', null); closeSheet() }}
                className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                  !sp.get('pricing')
                    ? 'bg-brand-red/15 text-brand-red'
                    : 'text-slate-300 hover:bg-white/5')}>
                Any Pricing
                {!sp.get('pricing') && <Check className="h-4 w-4" />}
              </button>
              {PRICING_OPTIONS.map(([val, label]) => (
                <button key={val} onClick={() => { set('pricing', val); closeSheet() }}
                  className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                    active('pricing', val)
                      ? 'bg-brand-red/15 text-brand-red'
                      : 'text-slate-300 hover:bg-white/5')}>
                  {label}
                  {active('pricing', val) && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {sheet === 'features' && (
            <div className="space-y-1">
              {[
                { key: 'trial', label: 'Has Free Trial', emoji: '✅' },
                { key: 'api',   label: 'Has API',        emoji: '⚡' },
                { key: 'promo', label: 'Active Promo',   emoji: '🎁' },
              ].map(({ key, label, emoji }) => (
                <button key={key}
                  onClick={() => toggle(key)}
                  className={cn('flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition',
                    sp.get(key) === '1'
                      ? 'bg-brand-red/15 text-brand-red'
                      : 'text-slate-300 hover:bg-white/5')}>
                  <span>{emoji} {label}</span>
                  {sp.get(key) === '1' && <Check className="h-4 w-4" />}
                </button>
              ))}
              <div className="pt-3">
                <button onClick={closeSheet}
                  className="w-full rounded-xl bg-brand-red py-3 text-sm font-bold text-white transition hover:bg-red-500">
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: always visible sidebar ────────────────────────────── */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-6">
          <SlidersHorizontal className="h-4 w-4 text-brand-red" />
          Filters
        </div>
        {filterContent}
      </aside>
    </>
  )
}
