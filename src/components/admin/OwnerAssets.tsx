'use client'

import { ExternalLink, Megaphone, Check, X } from 'lucide-react'

export interface OwnerAssetData {
  screenshots?: string[] | null
  creatives?: string[] | null
  brand_guidelines_url?: string | null
  social_promotion_consent?: boolean | null
  video_url?: string | null
  demo_url?: string | null
  twitter_url?: string | null
  linkedin_url?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  youtube_url?: string | null
  github_url?: string | null
  product_hunt_url?: string | null
}

const SOCIALS: [keyof OwnerAssetData, string][] = [
  ['twitter_url', 'X'],
  ['linkedin_url', 'LinkedIn'],
  ['instagram_url', 'Instagram'],
  ['facebook_url', 'Facebook'],
  ['youtube_url', 'YouTube'],
  ['github_url', 'GitHub'],
  ['product_hunt_url', 'Product Hunt'],
]

/**
 * Read-only view of everything the listing's owner supplied.
 *
 * The admin editor showed six fields while owners fill in far more, so
 * uploaded creatives, brand guidelines and social handles were invisible to
 * the person who needs them to actually run a promotion.
 */
export default function OwnerAssets({ tool }: { tool: OwnerAssetData }) {
  const screenshots = tool.screenshots ?? []
  const creatives = tool.creatives ?? []
  const socials = SOCIALS.filter(([k]) => tool[k])

  const nothing =
    screenshots.length === 0 && creatives.length === 0 &&
    !tool.brand_guidelines_url && socials.length === 0 &&
    !tool.video_url && !tool.demo_url

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Supplied by the owner</p>
        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={tool.social_promotion_consent
            ? { background: 'rgba(16,185,129,0.12)', color: '#6ee7b7' }
            : { background: 'rgba(100,116,139,0.12)', color: '#94a3b8' }}>
          {tool.social_promotion_consent ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {tool.social_promotion_consent ? 'Promotion allowed' : 'No promotion consent'}
        </span>
      </div>

      {nothing ? (
        <p className="text-xs text-slate-600">Nothing uploaded yet.</p>
      ) : (
        <div className="space-y-3.5">
          {creatives.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Megaphone className="h-3 w-3" /> Promotion creatives ({creatives.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {creatives.map(url => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="h-16 w-24 rounded-lg border object-cover"
                      style={{ borderColor: '#1e2a3a' }} />
                  </a>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-600">Click to open full size — use these in social posts.</p>
            </div>
          )}

          {screenshots.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Screenshots ({screenshots.length})</p>
              <div className="flex flex-wrap gap-2">
                {screenshots.map(url => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="h-16 w-24 rounded-lg border object-cover"
                      style={{ borderColor: '#1e2a3a' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {(tool.brand_guidelines_url || tool.video_url || tool.demo_url) && (
            <div className="flex flex-wrap gap-2">
              {tool.brand_guidelines_url && <AssetLink href={tool.brand_guidelines_url} label="Brand guidelines" />}
              {tool.video_url && <AssetLink href={tool.video_url} label="Product video" />}
              {tool.demo_url && <AssetLink href={tool.demo_url} label="Live demo" />}
            </div>
          )}

          {socials.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Social handles — tag these when posting</p>
              <div className="flex flex-wrap gap-2">
                {socials.map(([k, label]) => (
                  <AssetLink key={k} href={String(tool[k])} label={label} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AssetLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/5"
      style={{ borderColor: '#1e2a3a' }}>
      {label} <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  )
}
