'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Copy, Check, ExternalLink, Tag, Clock } from 'lucide-react'
import { useState } from 'react'
import { Promotion } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_STYLES: Record<string, { label: string; cls: string }> = {
  trial:     { label: 'Free Trial',  cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  coupon:    { label: 'Coupon Code', cls: 'bg-brand-red/15 text-brand-red border-brand-red/20' },
  discount:  { label: 'Discount',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  free_tier: { label: 'Free Tier',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
}

interface Props { promo: Promotion }

export default function PromoCard({ promo }: Props) {
  const [copied, setCopied] = useState(false)
  const style = TYPE_STYLES[promo.promo_type] ?? TYPE_STYLES.discount

  function copyCode() {
    if (!promo.promo_code) return
    navigator.clipboard.writeText(promo.promo_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiresIn = promo.valid_until
    ? Math.ceil((new Date(promo.valid_until).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="group relative rounded-2xl border border-brand-border bg-brand-card overflow-hidden transition-all hover:border-brand-red/30 hover:shadow-card-hover">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-red to-red-400" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {promo.tool?.logo_url && (
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5 shrink-0">
                <Image src={promo.tool.logo_url} alt={promo.tool.name ?? ''} fill className="object-contain p-1" />
              </div>
            )}
            <div>
              {promo.tool && (
                <Link href={`/tools/${promo.tool.slug}`}
                  className="text-xs text-slate-400 hover:text-brand-red transition-colors">
                  {promo.tool.name}
                </Link>
              )}
              <h3 className="font-semibold text-white leading-tight">{promo.title}</h3>
            </div>
          </div>
          <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium', style.cls)}>
            {style.label}
          </span>
        </div>

        {/* Description */}
        {promo.description && (
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">{promo.description}</p>
        )}

        {/* Promo code */}
        {promo.promo_code && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-brand-red/30 bg-brand-red/5 px-3 py-2">
              <Tag className="h-4 w-4 text-brand-red shrink-0" />
              <code className="flex-1 text-sm font-bold text-brand-red tracking-wider">{promo.promo_code}</code>
            </div>
            <button onClick={copyCode}
              className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                copied ? 'bg-emerald-500 text-white' : 'bg-brand-red text-white hover:bg-red-500')}>
              {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
            </button>
          </div>
        )}

        {/* Discount / trial */}
        {promo.discount_pct > 0 && (
          <div className="mt-3 text-2xl font-black text-white">
            {promo.discount_pct}% <span className="text-base font-normal text-slate-400">off</span>
          </div>
        )}
        {promo.trial_days > 0 && (
          <div className="mt-3 text-2xl font-black text-white">
            {promo.trial_days} days <span className="text-base font-normal text-slate-400">free</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {expiresIn !== null && expiresIn <= 30 ? (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              Expires in {expiresIn}d
            </span>
          ) : (
            <span className="text-xs text-slate-600">{promo.valid_until ? `Until ${promo.valid_until}` : 'No expiry'}</span>
          )}

          {(promo.external_url || promo.tool?.slug) && (
            <Link
              href={promo.external_url ?? `/tools/${promo.tool?.slug}`}
              target={promo.external_url ? '_blank' : undefined}
              rel={promo.external_url ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-brand-red hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" /> Get Deal
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
