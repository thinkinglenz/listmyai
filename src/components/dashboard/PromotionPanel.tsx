'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react'

interface ToolRow { id: string; name: string; slug: string; consented: boolean; announcedAt: string | null }
interface PostRow { id: string; tool_id: string; network: string; post_url: string | null; posted_at: string }

const NETWORK_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
}

export default function PromotionPanel() {
  const [data, setData] = useState<{ tools: ToolRow[]; posts: PostRow[] } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/tools/promotion')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error())))
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  if (failed) return null
  if (!data) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border px-5 py-6 text-xs text-slate-600" style={{ borderColor: '#1e2a3a' }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading promotion…
      </div>
    )
  }
  if (data.tools.length === 0) return null

  const postsFor = (toolId: string) => data.posts.filter(p => p.tool_id === toolId)

  return (
    <section id="promotion" className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5" style={{ color: '#a855f7' }} />
        <h2 className="text-xl font-black text-white">Social promotion</h2>
      </div>

      <div className="space-y-3">
        {data.tools.map(tool => {
          const posts = postsFor(tool.id)
          return (
            <div key={tool.id} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{tool.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tool.consented
                      ? 'Promotion is switched on for this listing'
                      : 'Promotion is off — turn it on in the listing editor to be featured'}
                  </p>
                </div>
                {tool.consented
                  ? <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7' }}>
                      <CheckCircle2 className="h-3 w-3" /> Opted in
                    </span>
                  : <Link href={`/dashboard/edit/${tool.slug}`}
                      className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: '#a855f7' }}>
                      Turn on
                    </Link>}
              </div>

              {posts.length > 0 ? (
                <div className="mt-4 space-y-2 border-t pt-3.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {posts.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-300">
                        {NETWORK_LABEL[p.network] ?? p.network}
                        <span className="ml-2 text-xs text-slate-500">
                          {new Date(p.posted_at).toLocaleDateString()}
                        </span>
                      </span>
                      {p.post_url
                        ? <a href={p.post_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#a855f7' }}>
                            View post <ExternalLink className="h-3 w-3" />
                          </a>
                        : <span className="text-xs text-slate-600">posted</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 border-t pt-3 text-xs text-slate-600" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {tool.consented
                    ? 'Nothing posted yet — we feature listings as they go live and when they hold the homepage spotlight.'
                    : 'Opt in and we will feature this listing on our channels.'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
