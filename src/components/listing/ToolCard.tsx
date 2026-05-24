import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Star, ThumbsUp, Zap, CheckCircle2, Shield } from 'lucide-react'
import { AiTool } from '@/types'
import { cn, PRICING_LABELS, PRICING_COLORS, formatCount } from '@/lib/utils'
import ToolCardShareButton from './ToolCardShareButton'

interface Props {
  tool: AiTool
  variant?: 'grid' | 'list' | 'featured'
}

const STATUS_BADGE: Record<string, { label: string; icon: React.ReactElement; cls: string }> = {
  verified: { label: 'Verified', icon: <CheckCircle2 className="h-3 w-3" />, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  claimed:  { label: 'Claimed',  icon: <Shield className="h-3 w-3" />,       cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  auto:     { label: 'Unclaimed',icon: <></>,                                 cls: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
}

export default function ToolCard({ tool, variant = 'grid' }: Props) {
  const pricing = tool.pricing_model
  // User-submitted or claimed tools show "Claimed" badge
  const badgeKey = (tool.claimed || tool.submitted_by) ? 'claimed' : tool.status
  const badge = STATUS_BADGE[badgeKey] ?? STATUS_BADGE.auto
  const hasPromo = !!(tool.promo_code || tool.promo_desc)

  if (variant === 'list') {
    return (
      <Link href={`/tools/${tool.slug}`}
        className="group flex items-center gap-4 rounded-xl border border-brand-border bg-brand-card p-4 transition-all hover:border-brand-red/30 hover:shadow-card-hover">
        {/* Logo */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/5">
          {tool.logo_url
            ? <Image src={tool.logo_url} alt={tool.name} fill className="object-contain p-1" />
            : <span className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-400">
                {tool.name[0]}
              </span>
          }
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white group-hover:text-brand-red transition-colors">{tool.name}</span>
            {tool.is_featured && <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20"><Zap className="h-3 w-3" /> Featured</span>}
            <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs', badge.cls)}>{badge.icon}{badge.label}</span>
          </div>
          <p className="mt-0.5 text-sm text-slate-400 truncate">{tool.tagline}</p>
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {pricing && (
            <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', PRICING_COLORS[pricing])}>
              {PRICING_LABELS[pricing]}
            </span>
          )}
          {hasPromo && <span className="rounded-full bg-brand-red/15 border border-brand-red/20 px-2.5 py-1 text-xs font-medium text-brand-red">🎁 Promo</span>}
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <ThumbsUp className="h-3.5 w-3.5" />{formatCount(tool.upvotes)}
          </span>
          <ToolCardShareButton slug={tool.slug} name={tool.name} tagline={tool.tagline ?? ''} />
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/tools/${tool.slug}`}
      className="group relative flex flex-col rounded-2xl border border-brand-border bg-brand-card shadow-card transition-all duration-200 hover:border-brand-red/30 hover:shadow-card-hover overflow-hidden">

      {/* Featured/Sponsored ribbon */}
      {tool.is_featured && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-400">
          <Zap className="h-3 w-3" /> Featured
        </div>
      )}

      {/* Promo badge */}
      {hasPromo && (
        <div className="absolute top-3 left-3 z-10 rounded-full bg-brand-red px-2.5 py-1 text-xs font-bold text-white shadow-glow-red">
          🎁 Deal
        </div>
      )}

      {/* Cover image or gradient header */}
      <div className="relative h-20 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {tool.cover_url && (
          <Image src={tool.cover_url} alt="" fill className="object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-card" />
      </div>

      {/* Logo */}
      <div className="relative -mt-7 ml-4 h-14 w-14 overflow-hidden rounded-2xl border-2 border-brand-border bg-brand-dark shadow-card">
        {tool.logo_url
          ? <Image src={tool.logo_url} alt={tool.name} fill className="object-contain p-1.5" />
          : <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
              {tool.name[0]}
            </span>
        }
      </div>

      <div className="flex flex-1 flex-col p-4 pt-2">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-white group-hover:text-brand-red transition-colors leading-tight">
            {tool.name}
          </h3>
          <span className={cn('flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs', badge.cls)}>
            {badge.icon}{badge.label}
          </span>
        </div>

        {/* Tagline */}
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {tool.tagline || tool.description}
        </p>

        {/* Category + pricing */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tool.category && (
            <span className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: `${tool.category.color}20`, color: tool.category.color, border: `1px solid ${tool.category.color}30` }}>
              {tool.category.name}
            </span>
          )}
          {pricing && (
            <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', PRICING_COLORS[pricing])}>
              {PRICING_LABELS[pricing]}
            </span>
          )}
          {tool.has_free_trial && (
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs text-emerald-400">
              Free Trial
            </span>
          )}
        </div>

        {/* Stats footer */}
        <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-3">
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />{formatCount(tool.upvotes)}
            </span>
            {tool.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {tool.rating_avg.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ToolCardShareButton slug={tool.slug} name={tool.name} tagline={tool.tagline ?? ''} />
            <span className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-brand-red transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> Visit
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
