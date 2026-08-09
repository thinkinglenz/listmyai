'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, Check, X, Trash2, Eye, ChevronDown, ChevronLeft, ChevronRight, Database, EyeOff, RotateCcw, Plus, Loader2, ExternalLink, Share2, Copy, CheckCheck, Image as ImageIcon, Download, Megaphone, Pencil } from 'lucide-react'
import Link from 'next/link'
import EditToolModal from '@/components/admin/EditToolModal'

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

interface Tool {
  id: string
  name: string
  slug: string
  category: string
  website: string
  status: 'active' | 'pending' | 'rejected' | 'inactive'
  claimed: boolean
  claimed_by: string | null
  claimed_by_email?: string | null
  upvotes: number
  rating: number
  added: string
  tagline: string
  description: string
  logo_url: string
  cover_url?: string | null
}

// ─── Social Post Modal ───────────────────────────────────────────────────────
function SocialPostModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [imageReady, setImageReady] = useState(false)

  const toolUrl = `https://listmyai.com/tools/${tool.slug}`
  const catTag = tool.category !== '—' ? `#${tool.category.replace(/[\s&\/]/g, '')}` : ''

  const captions: Record<string, string> = {
    twitter: `🚀 ${tool.name} is now listed on ListMyAI!\n\n${tool.tagline || tool.description?.split(/[.!?]/)[0] || ''}\n\n👉 ${toolUrl}\n\n${catTag} #AI #AITools #ArtificialIntelligence #ListMyAI`.trim(),
    linkedin: `🚀 ${tool.name} is now listed on ListMyAI — the directory of 20,000+ AI tools!\n\n${tool.tagline || ''}\n\n${tool.description ? tool.description.slice(0, 250) + (tool.description.length > 250 ? '…' : '') : ''}\n\n👉 Check it out: ${toolUrl}\n\n${catTag} #AI #ArtificialIntelligence #AITools #TechInnovation #ListMyAI`.trim(),
    instagram: `🚀 New AI tool alert!\n\n${tool.name} — ${tool.tagline || tool.description?.split(/[.!?]/)[0] || ''}\n\n🔗 Link in bio → listmyai.com\n\n${catTag} #AI #AITools #ArtificialIntelligence #MachineLearning #TechCommunity #ListMyAI #NewTool #Innovation #Startup`.trim(),
    facebook: `🚀 ${tool.name} has just been listed on ListMyAI!\n\n${tool.tagline || ''}\n\n${tool.description ? tool.description.slice(0, 200) + (tool.description.length > 200 ? '…' : '') : ''}\n\n👉 Explore: ${toolUrl}\n\n${catTag} #AI #AITools #ListMyAI`.trim(),
  }

  const handles = '@ListMyAI (X/Twitter) · ListMyAI (LinkedIn) · @listmyai (Instagram) · ListMyAI (Facebook)'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1200, H = 630
    canvas.width = W
    canvas.height = H

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0f0f1a')
    bg.addColorStop(0.5, '#1a1a2e')
    bg.addColorStop(1, '#16213e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Glow circles
    const glow = ctx.createRadialGradient(950, 150, 0, 950, 150, 200)
    glow.addColorStop(0, 'rgba(108,99,255,0.25)')
    glow.addColorStop(1, 'rgba(60,223,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    const glow2 = ctx.createRadialGradient(200, 500, 0, 200, 500, 150)
    glow2.addColorStop(0, 'rgba(108,99,255,0.2)')
    glow2.addColorStop(1, 'rgba(60,223,255,0)')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, W, H)

    // Left accent bar
    const accent = ctx.createLinearGradient(60, 40, 60, 590)
    accent.addColorStop(0, '#6C63FF')
    accent.addColorStop(1, '#3CDFFF')
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.roundRect(60, 40, 4, 550, 2)
    ctx.fill()

    // "NEW ON LISTMYAI" label
    ctx.font = '500 15px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#3CDFFF'
    ctx.letterSpacing = '4px'
    ctx.fillText('NEW ON LISTMYAI', 90, 95)
    ctx.letterSpacing = '0px'

    // Accent line under label
    const lineGrad = ctx.createLinearGradient(90, 110, 170, 110)
    lineGrad.addColorStop(0, '#6C63FF')
    lineGrad.addColorStop(1, '#3CDFFF')
    ctx.fillStyle = lineGrad
    ctx.beginPath()
    ctx.roundRect(90, 110, 80, 3, 1.5)
    ctx.fill()

    // Tool name
    ctx.font = '700 72px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#FFFFFF'
    const nameText = tool.name.length > 18 ? tool.name.slice(0, 18) + '…' : tool.name
    ctx.fillText(nameText, 90, 200)

    // Tagline (wrap to 2 lines)
    ctx.font = '400 24px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#a0a0c0'
    const tagline = tool.tagline || tool.description?.split(/[.!?]/)[0] || tool.category
    const words = tagline.split(' ')
    let line1 = '', line2 = ''
    for (const w of words) {
      const test = line1 ? line1 + ' ' + w : w
      if (ctx.measureText(test).width < 550 && !line2) {
        line1 = test
      } else {
        line2 = line2 ? line2 + ' ' + w : w
      }
    }
    ctx.fillText(line1, 90, 260)
    if (line2) {
      if (line2.length > 45) line2 = line2.slice(0, 45) + '…'
      ctx.fillText(line2, 90, 295)
    }

    // "Explore now" button
    const btnGrad = ctx.createLinearGradient(90, 340, 290, 340)
    btnGrad.addColorStop(0, '#6C63FF')
    btnGrad.addColorStop(1, '#3CDFFF')
    ctx.fillStyle = btnGrad
    ctx.beginPath()
    ctx.roundRect(90, 340, 200, 46, 23)
    ctx.fill()
    ctx.font = '600 16px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText('Explore now →', 190, 369)

    // "listmyai.com" button
    ctx.strokeStyle = '#6C63FF'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(310, 340, 180, 46, 23)
    ctx.stroke()
    ctx.font = '500 16px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#6C63FF'
    ctx.fillText('listmyai.com', 400, 369)
    ctx.textAlign = 'start'

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(90, 430)
    ctx.lineTo(700, 430)
    ctx.stroke()

    // Bullet points
    const bullets = [
      { color: '#3CDFFF', text: tool.category !== '—' ? tool.category : 'AI Tool' },
      { color: '#6C63FF', text: tool.website.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '') },
      { color: '#3CDFFF', text: tool.claimed ? 'Verified & Claimed' : 'Available to Claim' },
    ]
    bullets.forEach((b, i) => {
      const y = 460 + i * 32
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.roundRect(90, y, 10, 10, 2)
      ctx.fill()
      ctx.font = '400 14px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#8888aa'
      ctx.fillText(b.text, 115, y + 10)
    })

    // Right card
    ctx.fillStyle = '#1e1e36'
    ctx.strokeStyle = 'rgba(108,99,255,0.4)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.roundRect(830, 140, 300, 340, 16)
    ctx.fill()
    ctx.stroke()

    // Logo placeholder
    ctx.fillStyle = 'rgba(108,99,255,0.2)'
    ctx.strokeStyle = 'rgba(108,99,255,0.5)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.roundRect(860, 175, 60, 60, 12)
    ctx.fill()
    ctx.stroke()
    ctx.font = '700 28px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#6C63FF'
    ctx.textAlign = 'center'
    const initials = tool.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    ctx.fillText(initials, 890, 215)
    ctx.textAlign = 'start'

    // Card tool name
    ctx.font = '600 20px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(tool.name.length > 16 ? tool.name.slice(0, 16) + '…' : tool.name, 935, 200)
    ctx.font = '400 12px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#8888aa'
    const shortUrl = tool.website.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    ctx.fillText(shortUrl.length > 25 ? shortUrl.slice(0, 25) + '…' : shortUrl, 935, 222)

    // Card divider
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.moveTo(860, 260)
    ctx.lineTo(1100, 260)
    ctx.stroke()

    // Card fields
    const fields = [
      { label: 'STATUS', value: tool.status === 'active' ? 'Active' : 'Pending', valueBg: tool.status === 'active' ? '#1a3a2a' : '#3a3a1a', valueColor: tool.status === 'active' ? '#4ade80' : '#facc15' },
      { label: 'LISTED', value: tool.added },
      { label: 'CATEGORY', value: tool.category !== '—' ? tool.category : 'AI Tool' },
    ]
    fields.forEach((f, i) => {
      const y = 290 + i * 40
      ctx.font = '400 11px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#6C63FF'
      ctx.letterSpacing = '2px'
      ctx.fillText(f.label, 860, y)
      ctx.letterSpacing = '0px'
      if (f.valueBg) {
        ctx.fillStyle = f.valueBg
        ctx.beginPath()
        ctx.roundRect(940, y - 14, 65, 22, 11)
        ctx.fill()
        ctx.font = '500 11px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = f.valueColor!
        ctx.textAlign = 'center'
        ctx.fillText(f.value, 972, y + 1)
        ctx.textAlign = 'start'
      } else {
        ctx.font = '400 13px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = '#ccccdd'
        ctx.fillText(f.value.length > 18 ? f.value.slice(0, 18) + '…' : f.value, 940, y)
      }
    })

    // Card tags
    const tags = [
      { text: 'AI Tool', color: '#6C63FF', bg: 'rgba(108,99,255,0.15)' },
      { text: tool.category !== '—' ? tool.category.split(' ')[0] : 'Listed', color: '#3CDFFF', bg: 'rgba(60,223,255,0.15)' },
    ]
    tags.forEach((t, i) => {
      const x = 860 + i * 115
      ctx.fillStyle = t.bg
      ctx.beginPath()
      ctx.roundRect(x, 410, 100, 30, 6)
      ctx.fill()
      ctx.font = '400 12px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = t.color
      ctx.textAlign = 'center'
      ctx.fillText(t.text.length > 12 ? t.text.slice(0, 12) + '…' : t.text, x + 50, 430)
      ctx.textAlign = 'start'
    })

    // Footer
    ctx.font = '600 18px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText('ListMyAI', 90, 595)
    ctx.font = '400 14px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#8888aa'
    ctx.fillText('Discover 20,000+ AI tools', 200, 595)
    ctx.font = '400 13px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#6C63FF'
    ctx.textAlign = 'end'
    ctx.fillText('listmyai.com', 1110, 595)
    ctx.textAlign = 'start'

    // If logo URL exists, load and draw it
    if (tool.logo_url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(860, 175, 60, 60, 12)
        ctx.clip()
        ctx.drawImage(img, 860, 175, 60, 60)
        ctx.restore()
        setImageReady(true)
      }
      img.onerror = () => setImageReady(true)
      img.src = tool.logo_url
    } else {
      setImageReady(true)
    }
  }, [tool])

  function downloadImage() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `listmyai-${tool.slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function copyCaption(platform: string) {
    await navigator.clipboard.writeText(captions[platform])
    setCopiedField(platform)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const platformMeta: Record<string, { label: string; color: string; icon: string }> = {
    twitter:   { label: 'X / Twitter',  color: '#1d9bf0', icon: '𝕏' },
    linkedin:  { label: 'LinkedIn',     color: '#0a66c2', icon: 'in' },
    instagram: { label: 'Instagram',    color: '#e1306c', icon: 'IG' },
    facebook:  { label: 'Facebook',     color: '#1877f2', icon: 'f' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-3xl rounded-2xl border shadow-2xl my-8" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(108,99,255,0.15)' }}>
              <Megaphone className="h-4 w-4" style={{ color: '#6C63FF' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Social Post — {tool.name}</h2>
              <p className="text-xs text-slate-500">Download the image & copy captions for each platform</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Image Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> Social media image (1200×630)
              </span>
              <button onClick={downloadImage} disabled={!imageReady}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#6C63FF' }}>
                <Download className="h-3.5 w-3.5" /> Download PNG
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#1e2a3a' }}>
              <canvas ref={canvasRef} className="w-full h-auto" style={{ display: 'block' }} />
            </div>
          </div>

          {/* Platform Captions */}
          <div>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-3">
              <Copy className="h-3.5 w-3.5" /> Ready-to-post captions
            </span>
            <div className="space-y-3">
              {Object.entries(captions).map(([platform, text]) => {
                const meta = platformMeta[platform]
                return (
                  <div key={platform} className="rounded-xl border p-3" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-xs font-bold" style={{ color: meta.color }}>
                        <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold" style={{ background: `${meta.color}22`, color: meta.color }}>
                          {meta.icon}
                        </span>
                        {meta.label}
                      </span>
                      <button onClick={() => copyCaption(platform)}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition hover:opacity-90"
                        style={{ background: copiedField === platform ? 'rgba(16,185,129,0.15)' : `${meta.color}22`, color: copiedField === platform ? '#10b981' : meta.color }}>
                        {copiedField === platform ? <><CheckCheck className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-300 leading-relaxed select-all" style={{ fontFamily: 'inherit' }}>
                      {text}
                    </pre>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Handles & Hashtags */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Social handles to tag</span>
              <p className="text-xs text-slate-300 mt-1">{handles}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested hashtags</span>
              <p className="text-xs mt-1" style={{ color: '#6C63FF' }}>
                {catTag} #AI #AITools #ArtificialIntelligence #MachineLearning #TechInnovation #ListMyAI #NewTool #Startup #Innovation #TechNews
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 text-center">
            Download the image → open your preferred platform → paste caption → attach image → publish
          </p>
        </div>
      </div>
    </div>
  )
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  inactive: { label: 'Inactive', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
}

const CATEGORIES = [
  'Chatbot / Assistant', 'Code Assistant', 'Writing & Copy', 'Image Generation',
  'Video Generation', 'Audio & Music', 'SEO & Marketing', 'Data & Analytics',
  'AI Search', 'Automation', 'Education', 'Healthcare', 'Finance & Legal',
  'Other',
]

// ─── Add Listing Modal ────────────────────────────────────────────────────────
interface PreviewData {
  name: string
  tagline: string
  description: string
  website: string
  logo_url: string
  category: string
}

function AddListingModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [step, setStep] = useState<'url' | 'preview'>('url')
  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [preview, setPreview] = useState<PreviewData>({
    name: '', tagline: '', description: '', website: '', logo_url: '', category: 'Other',
  })
  const [addedSlug, setAddedSlug] = useState('')

  async function fetchPreview(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setFetching(true); setFetchError('')
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setFetchError(data.error ?? 'Failed to fetch page info')
      } else {
        setPreview(data)
        setStep('preview')
      }
    } catch (err) {
      setFetchError(String(err))
    }
    setFetching(false)
  }

  async function handleInsert(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert',
          name: preview.name,
          tagline: preview.tagline,
          description: preview.description,
          website: preview.website,
          logo_url: preview.logo_url,
          category_name: preview.category,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setSaveError(data.error ?? 'Failed to add listing')
      } else {
        setAddedSlug(data.slug)
        onAdded()
      }
    } catch (err) {
      setSaveError(String(err))
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-xl rounded-2xl border shadow-2xl" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
          <div>
            <h2 className="text-base font-bold text-white">Add Listing</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'url' ? "Paste a URL and we'll fetch all the info automatically" : 'Review and edit the details before adding'}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step 1: URL input */}
          {step === 'url' && !addedSlug && (
            <form onSubmit={fetchPreview} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Tool Website URL</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={url}
                    onChange={e => { setUrl(e.target.value); setFetchError('') }}
                    placeholder="https://example.com"
                    autoFocus
                    className="flex-1 rounded-xl border py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }}
                  />
                  <button type="submit" disabled={fetching || !url.trim()}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#e94560' }}>
                    {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {fetching ? 'Fetching…' : 'Fetch Info →'}
                  </button>
                </div>
              </div>
              {fetchError && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{fetchError}</p>}
              <p className="text-xs text-slate-600">
                We'll automatically extract the tool name, description, category, and logo from the page's meta tags.
              </p>
            </form>
          )}

          {/* Step 2: Editable preview */}
          {step === 'preview' && !addedSlug && (
            <form onSubmit={handleInsert} className="space-y-4">
              {/* Logo preview */}
              {preview.logo_url && (
                <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.logo_url} alt="" className="h-12 w-12 rounded-lg object-contain" style={{ background: '#161b27' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{preview.name}</p>
                    <a href={preview.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 truncate text-xs text-slate-500 hover:text-slate-300">
                      {preview.website} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    Admin Added
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Tool Name *</label>
                  <input value={preview.name} onChange={e => setPreview(p => ({ ...p, name: e.target.value }))}
                    required className="w-full rounded-xl border py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Tagline <span className="text-slate-600 font-normal">(shown on card)</span></label>
                  <input value={preview.tagline} onChange={e => setPreview(p => ({ ...p, tagline: e.target.value }))}
                    maxLength={120}
                    className="w-full rounded-xl border py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Website *</label>
                  <input value={preview.website} onChange={e => setPreview(p => ({ ...p, website: e.target.value }))}
                    required className="w-full rounded-xl border py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Category</label>
                  <select value={preview.category} onChange={e => setPreview(p => ({ ...p, category: e.target.value }))}
                    className="w-full appearance-none rounded-xl border py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500/50"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Description</label>
                  <textarea value={preview.description} onChange={e => setPreview(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Logo / Image URL <span className="text-slate-600 font-normal">(optional)</span></label>
                  <input value={preview.logo_url} onChange={e => setPreview(p => ({ ...p, logo_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-xl border py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
                    style={{ borderColor: '#1e2a3a', background: '#0d1117' }} />
                </div>
              </div>

              {saveError && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{saveError}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setStep('url')}
                  className="rounded-xl border px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a' }}>
                  ← Back
                </button>
                <button type="submit" disabled={saving || !preview.name.trim() || !preview.website.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#e94560' }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'Adding…' : 'Add to Directory'}
                </button>
              </div>
            </form>
          )}

          {/* Success state */}
          {addedSlug && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Listing Added!</h3>
              <p className="mt-1 text-sm text-slate-400">
                <span className="text-white font-semibold">{preview.name}</span> is now live in the directory.
              </p>
              <div className="mt-4 flex gap-3">
                <a href={`/tools/${addedSlug}`} target="_blank"
                  className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm text-slate-300 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a' }}>
                  <Eye className="h-3.5 w-3.5" /> View listing
                </a>
                <button onClick={() => { setStep('url'); setUrl(''); setAddedSlug(''); setPreview({ name: '', tagline: '', description: '', website: '', logo_url: '', category: 'Other' }) }}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: '#e94560' }}>
                  <Plus className="h-3.5 w-3.5" /> Add another
                </button>
              </div>
              <button onClick={onClose} className="mt-3 text-xs text-slate-600 hover:text-slate-400 transition">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminListingsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingCount, setPendingCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [snippetToolId, setSnippetToolId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [socialTool, setSocialTool] = useState<Tool | null>(null)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Social share helpers ─────────────────────────────────────────────────────
  function shareTool(tool: Tool, platform: 'twitter' | 'facebook' | 'linkedin') {
    const toolUrl = `https://listmyai.com/tools/${tool.slug}`
    const url = encodeURIComponent(toolUrl)
    const tweetText = encodeURIComponent(`${tool.name} — ${tool.tagline || tool.name}\n\nvia @ListMyai`)
    const liTitle = encodeURIComponent(tool.name)
    const liSummary = encodeURIComponent(tool.tagline || tool.description || `Discover ${tool.name} on ListmyAI — the #1 AI tools directory.`)
    const links: Record<string, string> = {
      twitter:  `https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(tool.name)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${liTitle}&summary=${liSummary}&source=ListmyAI`,
    }
    window.open(links[platform], '_blank', 'width=620,height=560,noopener,noreferrer')
  }

  function buildToolCaption(tool: Tool): string {
    const toolUrl = `https://listmyai.com/tools/${tool.slug}`
    const cat = tool.category !== '—' ? `#${tool.category.replace(/[\s&]/g, '')}` : ''
    return `🚀 ${tool.name} — ${tool.tagline || tool.description.split(/[.!?]/)[0]}\n\n${tool.description ? tool.description.slice(0, 200) + (tool.description.length > 200 ? '…' : '') + '\n\n' : ''}👉 ${toolUrl}\n\n${cat} #AI #ArtificialIntelligence #ListmyAI`.trim()
  }

  async function copyToolSnippet(tool: Tool) {
    await navigator.clipboard.writeText(buildToolCaption(tool))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function exportCSV() {
    setExporting(true)
    try {
      const allTools: Tool[] = []
      let p = 1
      let pages = 1
      while (p <= pages) {
        const params = new URLSearchParams({ page: String(p) })
        if (filterStatus !== 'all') params.set('status', filterStatus)
        if (search) params.set('search', search)
        const res = await fetch(`/api/admin/listings?${params}`)
        const data = await res.json()
        pages = data.totalPages ?? 1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const t of (data.tools ?? [])) {
          allTools.push({
            id: String(t.id), name: t.name ?? '', slug: t.slug ?? '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            category: (t.categories as any)?.name ?? '',
            website: t.website ?? '', status: t.status ?? 'pending',
            claimed: t.claimed ?? false, claimed_by: t.claimed_by ?? null, claimed_by_email: t.claimed_by_email ?? null,
            upvotes: t.upvotes ?? 0,
            rating: t.rating_avg ?? 0,
            added: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '',
            tagline: t.tagline ?? '', description: t.description ?? '',
            logo_url: t.logo_url ?? '',
          })
        }
        p++
      }
      const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
      const header = 'Name,Slug,Category,Website,Status,Claimed,Upvotes,Rating,Tagline,Description,Added'
      const rows = allTools.map(t =>
        [esc(t.name), esc(t.slug), esc(t.category), esc(t.website), t.status, t.claimed, t.upvotes, t.rating, esc(t.tagline), esc(t.description), t.added].join(',')
      )
      const csv = [header, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `listmyai-tools-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + String(err))
    }
    setExporting(false)
  }

  const loadTools = useCallback(async (p: number) => {
    setLoading(true)
    setApiError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      params.set('page', String(p))
      const res = await fetch(`/api/admin/listings?${params}`)
      const data = await res.json()
      if (data.error) {
        setApiError(data.error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTools((data.tools ?? []).map((t: any) => ({
          id: String(t.id),
          name: t.name ?? 'Unnamed',
          slug: t.slug ?? '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: (t.categories as any)?.name ?? '—',
          website: t.website ?? '—',
          status: t.status ?? 'pending',
          claimed: t.claimed ?? false,
          claimed_by: t.claimed_by ?? null,
          claimed_by_email: t.claimed_by_email ?? null,
          upvotes: t.upvotes ?? 0,
          rating: t.rating_avg ?? 0,
          added: t.created_at
            ? new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—',
          tagline: t.tagline ?? '',
          description: t.description ?? '',
          logo_url: t.logo_url ?? '',
        })))
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setPage(data.page ?? 1)
      }
    } catch (err) {
      setApiError(String(err))
    }
    setLoading(false)
  }, [filterStatus, search])

  // Load pending count separately (for the banner)
  useEffect(() => {
    fetch('/api/admin/listings?status=pending&page=1')
      .then(r => r.json())
      .then(d => setPendingCount(d.total ?? 0))
      .catch(() => {})
  }, [tools])

  useEffect(() => { loadTools(1) }, [loadTools])

  // Load categories for edit modal
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(d => setCategories((d.data || []).map((c: any) => c.name)))
      .catch(() => {})
  }, [])

  // Debounced search
  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return
    setSelected(new Set())
    loadTools(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function approve(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t))
    await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'active' }) })
  }
  async function reject(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t))
    await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'rejected' }) })
  }
  async function deactivate(id: string) {
    const prev = tools.find(t => t.id === id)?.status ?? 'active'
    setTools(prev2 => prev2.map(t => t.id === id ? { ...t, status: 'inactive' } : t))
    const res = await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'inactive' }) })
    const data = await res.json()
    if (!res.ok || data.error) {
      // Revert optimistic update and show error
      setTools(prev2 => prev2.map(t => t.id === id ? { ...t, status: prev as Tool['status'] } : t))
      alert(`Failed to deactivate: ${data.error ?? 'Unknown error'}\n\nRun this SQL in Supabase:\nALTER TABLE ai_tools DROP CONSTRAINT IF EXISTS ai_tools_status_check;\nALTER TABLE ai_tools ADD CONSTRAINT ai_tools_status_check CHECK (status IN ('active','pending','rejected','inactive','archived'));`)
    }
  }
  async function reactivate(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : t))
    const res = await fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'active' }) })
    const data = await res.json()
    if (!res.ok || data.error) {
      setTools(prev => prev.map(t => t.id === id ? { ...t, status: 'inactive' } : t))
      alert(`Failed to reactivate: ${data.error ?? 'Unknown error'}`)
    }
  }
  async function remove(id: string) {
    if (!confirm('Delete this tool permanently?')) return
    setTools(prev => prev.filter(t => t.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
    setTotal(prev => prev - 1)
    await fetch('/api/admin/listings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }
  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  async function bulkApprove() {
    const ids = Array.from(selected)
    setTools(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'active' } : t))
    setSelected(new Set())
    await Promise.all(ids.map(id =>
      fetch('/api/admin/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'active' }) })
    ))
  }
  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} tools permanently?`)) return
    const ids = Array.from(selected)
    setTools(prev => prev.filter(t => !ids.includes(t.id)))
    setSelected(new Set())
    setTotal(prev => prev - ids.length)
    await Promise.all(ids.map(id =>
      fetch('/api/admin/listings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    ))
  }

  // Page range for pagination buttons
  function getPageRange(): number[] {
    const range: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }

  const fromItem = (page - 1) * 30 + 1
  const toItem = Math.min(page * 30, total)

  return (
    <div>
      {showAddModal && (
        <AddListingModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => loadTools(1)}
        />
      )}
      {socialTool && (
        <SocialPostModal tool={socialTool} onClose={() => setSocialTool(null)} />
      )}

      {editingTool && (
        <EditToolModal
          tool={editingTool}
          categories={categories}
          onClose={() => setEditingTool(null)}
          onSave={() => {
            setEditingTool(null)
            loadTools(page)
          }}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Listings</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading from Supabase…' : apiError ? '⚠️ Error loading data' : `${total} total tools · ${pendingCount} pending review · live from Supabase`}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white hover:border-slate-500 disabled:opacity-50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#e94560' }}>
            <Plus className="h-4 w-4" />
            Add Listing
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }} />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="appearance-none rounded-xl border py-2.5 pl-9 pr-8 text-sm text-slate-300 outline-none"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{selected.size} selected</span>
            <button onClick={bulkApprove} className="rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90" style={{ background: '#10b981' }}>Approve all</button>
            <button onClick={bulkDelete} className="rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90" style={{ background: '#ef4444' }}>Delete all</button>
          </div>
        )}
      </div>

      {/* Error */}
      {apiError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>Supabase error:</strong> {apiError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading tools from Supabase…</div>
        ) : tools.length === 0 && total === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Database className="h-10 w-10 mb-3 text-slate-700" />
            <p className="font-semibold text-slate-400">No tools match your filter</p>
            <p className="mt-1 text-sm text-slate-600">
              Tools submitted via <a href="/submit" target="_blank" className="underline" style={{ color: '#e94560' }}>/submit</a> will appear here for review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500" style={{ borderColor: '#1e2a3a' }}>
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded"
                      onChange={e => setSelected(e.target.checked ? new Set(tools.map(t => t.id)) : new Set())}
                      checked={selected.size === tools.length && tools.length > 0} />
                  </th>
                  <th className="px-4 py-3">Tool</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Claimed</th>
                  <th className="px-4 py-3">Upvotes</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {tools.map(tool => {
                  const sm = STATUS_META[tool.status] ?? STATUS_META.pending
                  const isSnippetOpen = snippetToolId === tool.id
                  return (
                    <>
                      <tr key={tool.id} className="group transition hover:bg-white/[0.02]"
                        style={{ background: selected.has(tool.id) ? 'rgba(233,69,96,0.04)' : undefined }}>
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded" checked={selected.has(tool.id)} onChange={() => toggleSelect(tool.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white text-sm">{tool.name}</p>
                          <p className="text-xs text-slate-600">{tool.website}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{tool.category}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: sm.color, background: sm.bg }}>
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-xs font-medium ${tool.claimed ? 'text-emerald-400' : 'text-slate-600'}`}>
                              {tool.claimed ? '✓ Claimed' : 'Unclaimed'}
                            </span>
                            {tool.claimed && tool.claimed_by_email && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={tool.claimed_by_email}>
                                {tool.claimed_by_email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{tool.upvotes.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{tool.rating > 0 ? `${tool.rating} ★` : '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{tool.added}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {tool.slug && (
                              <a href={`/tools/${tool.slug}`} target="_blank"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white">
                                <Eye className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {/* Edit button - opens modal */}
                            <button onClick={() => setEditingTool(tool)} title="Quick edit"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-400">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {/* Full edit page link */}
                            <Link href={`/admin/tools/${tool.id}/edit`} title="Full edit page"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-500/10 hover:text-slate-300">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                            {/* Share buttons */}
                            {tool.status === 'active' && tool.slug && (
                              <>
                                <button onClick={() => shareTool(tool, 'twitter')} title="Share on X / Twitter"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border text-slate-400 transition hover:bg-white/10 hover:text-white text-[11px] font-bold"
                                  style={{ borderColor: '#1e2a3a' }}>𝕏</button>
                                <button onClick={() => shareTool(tool, 'facebook')} title="Share on Facebook"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-blue-500/10 text-[11px] font-bold"
                                  style={{ borderColor: '#1e2a3a', color: '#1877f2' }}>f</button>
                                <button onClick={() => shareTool(tool, 'linkedin')} title="Share on LinkedIn"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-blue-700/10 text-[11px] font-bold"
                                  style={{ borderColor: '#1e2a3a', color: '#0a66c2' }}>in</button>
                                <button
                                  onClick={() => setSnippetToolId(isSnippetOpen ? null : tool.id)}
                                  title="Copy LinkedIn snippet"
                                  className="flex h-7 items-center gap-1 rounded-lg border px-1.5 text-[10px] font-bold transition hover:bg-blue-700/10"
                                  style={{ borderColor: '#1e2a3a', color: isSnippetOpen ? '#0a66c2' : '#64748b' }}>
                                  <LinkedInIcon /> Snippet
                                </button>
                                <button
                                  onClick={() => setSocialTool(tool)}
                                  title="Generate social media post"
                                  className="flex h-7 items-center gap-1 rounded-lg border px-1.5 text-[10px] font-bold transition hover:bg-purple-500/10"
                                  style={{ borderColor: '#1e2a3a', color: '#8b5cf6' }}>
                                  <Megaphone className="h-3 w-3" /> Social Post
                                </button>
                              </>
                            )}
                            {tool.status === 'pending' && (
                              <>
                                <button onClick={() => approve(tool.id)} title="Approve"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 transition hover:bg-emerald-500/10">
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => reject(tool.id)} title="Reject"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-500/10">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            {tool.status === 'active' && (
                              <button onClick={() => deactivate(tool.id)} title="Deactivate (hide from directory)"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-500/10 hover:text-slate-300">
                                <EyeOff className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {tool.status === 'inactive' && (
                              <button onClick={() => reactivate(tool.id)} title="Reactivate"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 transition hover:bg-emerald-500/10">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => remove(tool.id)} title="Delete permanently"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── LinkedIn Snippet Panel ── */}
                      {isSnippetOpen && (
                        <tr key={`snippet-${tool.id}`} style={{ background: 'rgba(10,102,194,0.04)' }}>
                          <td colSpan={9} className="px-4 pb-4 pt-0">
                            <div className="rounded-xl border p-4 space-y-3"
                              style={{ borderColor: 'rgba(10,102,194,0.25)', background: 'rgba(10,102,194,0.05)' }}>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                                  <LinkedInIcon /> Ready-to-post LinkedIn caption
                                </span>
                                <div className="flex items-center gap-2">
                                  {/* Quick share from panel too */}
                                  <span className="flex items-center gap-1 text-[10px] text-slate-600"><Share2 className="h-3 w-3" /> Share:</span>
                                  <button onClick={() => shareTool(tool, 'twitter')} title="Share on X"
                                    className="rounded-lg border px-2 py-1 text-[11px] font-bold transition hover:bg-white/5"
                                    style={{ borderColor: '#1e2a3a', color: '#e2e8f0' }}>𝕏</button>
                                  <button onClick={() => shareTool(tool, 'facebook')} title="Share on Facebook"
                                    className="rounded-lg border px-2 py-1 text-[11px] font-bold transition hover:bg-blue-500/10"
                                    style={{ borderColor: '#1e2a3a', color: '#1877f2' }}>f</button>
                                  <button onClick={() => shareTool(tool, 'linkedin')} title="Share on LinkedIn"
                                    className="rounded-lg border px-2 py-1 text-[11px] font-bold transition hover:bg-blue-700/10"
                                    style={{ borderColor: '#1e2a3a', color: '#0a66c2' }}>in</button>
                                  <button
                                    onClick={() => copyToolSnippet(tool)}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                                    style={{ background: copied ? '#10b981' : '#0a66c2' }}>
                                    {copied ? <><CheckCheck className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy all</>}
                                  </button>
                                </div>
                              </div>

                              {/* Caption text */}
                              <pre className="whitespace-pre-wrap rounded-lg p-3 text-xs text-slate-300 leading-relaxed select-all"
                                style={{ background: '#0d1117', border: '1px solid #1e2a3a', fontFamily: 'inherit' }}>
                                {buildToolCaption(tool)}
                              </pre>

                              {/* Logo image */}
                              {tool.logo_url && (
                                <div className="flex items-start gap-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={tool.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-contain flex-shrink-0"
                                    style={{ background: '#161b27', border: '1px solid #1e2a3a' }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                                      <ImageIcon className="h-3.5 w-3.5" /> Attach this image to your LinkedIn post
                                    </p>
                                    <a
                                      href={`/api/image/download-png?url=${encodeURIComponent(tool.logo_url)}`}
                                      download="listmyai-tool.png"
                                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                                      style={{ background: '#0a66c2' }}>
                                      <ImageIcon className="h-3 w-3" /> Download PNG
                                    </a>
                                  </div>
                                </div>
                              )}

                              <p className="text-[10px] text-slate-600">
                                Tip: open LinkedIn → Start a post → paste the caption → attach the image → publish
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {fromItem}–{toItem} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageRange()[0] > 1 && (
              <>
                <button onClick={() => goToPage(1)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs text-slate-400 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  1
                </button>
                {getPageRange()[0] > 2 && <span className="px-1 text-slate-600">…</span>}
              </>
            )}
            {getPageRange().map(p => (
              <button key={p} onClick={() => goToPage(p)}
                className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition"
                style={{
                  borderColor: p === page ? '#e94560' : '#1e2a3a',
                  background: p === page ? 'rgba(233,69,96,0.15)' : '#161b27',
                  color: p === page ? '#e94560' : '#94a3b8',
                }}>
                {p}
              </button>
            ))}
            {getPageRange()[getPageRange().length - 1] < totalPages && (
              <>
                {getPageRange()[getPageRange().length - 1] < totalPages - 1 && <span className="px-1 text-slate-600">…</span>}
                <button onClick={() => goToPage(totalPages)}
                  className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs text-slate-400 transition hover:text-white"
                  style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  {totalPages}
                </button>
              </>
            )}
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {pendingCount > 0 && !loading && (
        <div className="mt-4 rounded-xl border p-3 text-sm text-slate-400" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
          <span className="font-semibold text-amber-400">⚠️ {pendingCount} pending</span> — hover any row to reveal the ✓ approve / ✗ reject buttons.
        </div>
      )}
    </div>
  )
}
