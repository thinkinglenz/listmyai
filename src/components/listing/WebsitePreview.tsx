'use client'

import { useState } from 'react'
import { ExternalLink, Globe } from 'lucide-react'

interface Props {
  website: string
  toolName: string
  outboundUrl: string
}

export default function WebsitePreview({ website, toolName, outboundUrl }: Props) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <a href={outboundUrl} target="_blank" rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden group transition hover:opacity-95"
      style={{ background: '#0a0e17' }}>

      {/* Screenshot or fallback — no browser chrome, clean like competitor */}
      <div className="relative overflow-hidden">
        {!imgError ? (
          <>
            {!imgLoaded && (
              <div className="flex items-center justify-center" style={{ height: '360px' }}>
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-400" />
                  <p className="text-xs text-slate-600">Loading preview...</p>
                </div>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://image.thum.io/get/width/1280/crop/800/noanimate/${website}`}
              alt={`${toolName} website screenshot`}
              className={`w-full h-auto transition ${imgLoaded ? '' : 'absolute opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ minHeight: imgLoaded ? '200px' : 0, objectFit: 'cover' }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center py-20 px-6" style={{ minHeight: '200px' }}>
            <div className="text-center">
              <Globe className="mx-auto mb-3 h-10 w-10 text-slate-700" />
              <p className="font-semibold text-slate-400">{toolName}</p>
              <p className="mt-1 text-sm text-slate-600">{(() => { try { return new URL(website).hostname } catch { return website } })()}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-slate-300"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #1e2a3a' }}>
                <ExternalLink className="h-3 w-3" /> Visit Website
              </span>
            </div>
          </div>
        )}

        {/* Hover overlay with Visit button */}
        <div className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}>
          <span className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: '#e94560', boxShadow: '0 0 20px rgba(233,69,96,0.4)' }}>
            <ExternalLink className="h-4 w-4" /> Visit {toolName}
          </span>
        </div>
      </div>
    </a>
  )
}
