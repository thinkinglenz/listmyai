'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import PreviewImageUpload from '@/components/PreviewImageUpload'
import {
  Save, ArrowLeft, CheckCircle2, Globe, Video, DollarSign,
  Building2, Target, Megaphone, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'

const CATEGORIES = [
  'Chatbot / Assistant','Image Generation','Video Generation','Audio & Music',
  'Code Assistant','Writing & Copy','SEO & Marketing','Data & Analytics',
  'Voice & Speech','AI Search','Automation','Design & Creative',
  'Research','Education','Healthcare','Finance & Legal','Other',
]
const PRICING_MODELS = [
  'free','freemium','free_trial','subscription','pay_per_use','one_time','enterprise',
]
const PRICING_LABELS: Record<string, string> = {
  free:'Free', freemium:'Freemium', free_trial:'Free Trial', subscription:'Subscription',
  pay_per_use:'Pay Per Use', one_time:'One-Time Purchase', enterprise:'Enterprise',
}
const PLATFORMS = [
  { value:'web', label:'Web' }, { value:'ios', label:'iOS' }, { value:'android', label:'Android' },
  { value:'mac', label:'macOS' }, { value:'windows', label:'Windows' }, { value:'linux', label:'Linux' },
  { value:'api', label:'API' }, { value:'chrome', label:'Chrome Extension' }, { value:'vscode', label:'VS Code' },
]

const inputCls = 'w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-brand-red/40'
const inputStyle = { borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.04)' }
const selectStyle = { borderColor: '#1e2a3a', background: '#0f172a' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}

function Section({ icon, title, desc, children, defaultOpen = true }: {
  icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{background:'rgba(233,69,96,0.12)',border:'1px solid rgba(233,69,96,0.25)'}}>
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{title}</h2>
            {desc && <p className="text-xs text-slate-500">{desc}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="space-y-4 px-5 pb-5">{children}</div>}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition hover:border-brand-red/30"
      style={{borderColor: checked ? 'rgba(233,69,96,0.4)' : '#1e2a3a', background: checked ? 'rgba(233,69,96,0.08)' : 'rgba(255,255,255,0.02)'}}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-brand-red" />
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  )
}

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tool, setTool] = useState<any>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/tools/update?slug=${slug}`)
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setLoading(false)
      return
    }
    setTool(data.tool)
    setCategoryId(data.tool.category_id)
    setLoading(false)
  }, [slug])

  useEffect(() => { load() }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(k: string, v: any) {
    setTool((t: Record<string, unknown>) => ({ ...t, [k]: v }))
  }

  function togglePlatform(p: string) {
    const current: string[] = tool.platforms ?? []
    set('platforms', current.includes(p) ? current.filter((x: string) => x !== p) : [...current, p])
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { id, slug: _s, created_at, updated_at, categories, status, claimed, claimed_by, submitted_by,
        is_featured, is_sponsored, owner_id, listing_free_until, listing_plan, view_count, click_count,
        upvotes, rating_avg, rating_count, ...fields } = tool

      if (categoryId) fields.category_id = categoryId

      const res = await fetch('/api/tools/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: id, ...fields }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      setError(String(err))
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading listing…</p>
      </div>
    )
  }

  if (error && !tool) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-lg font-bold text-red-400">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm hover:underline" style={{color:'#e94560'}}>
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!tool) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-slate-500 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-lg font-bold text-white">Edit: {tool.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/tools/${slug}`} target="_blank"
            className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5"
            style={{borderColor:'#1e2a3a'}}>
            <ExternalLink className="h-3.5 w-3.5" /> View
          </Link>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{background:'#e94560'}}>
            {saving ? 'Saving…' : saved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      {saved && <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">Changes saved successfully. The page may take up to an hour to reflect updates (ISR caching).</p>}

      <div className="space-y-4">

        {/* Basic Info */}
        <Section icon={<Globe className="h-4 w-4" style={{color:'#e94560'}} />} title="Basic Information">
          <Field label="Tool Name">
            <input type="text" value={tool.name ?? ''} onChange={e => set('name', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Website">
            <input type="url" value={tool.website ?? ''} onChange={e => set('website', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Tagline">
            <input type="text" value={tool.tagline ?? ''} onChange={e => set('tagline', e.target.value)}
              maxLength={120} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Description">
            <textarea value={tool.description ?? ''} onChange={e => set('description', e.target.value)}
              rows={5} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>
        </Section>

        {/* Media */}
        <Section icon={<Video className="h-4 w-4" style={{color:'#e94560'}} />} title="Media & Demos" defaultOpen={false}>
          <Field label="Logo URL">
            <input type="url" value={tool.logo_url ?? ''} onChange={e => set('logo_url', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Preview Image">
            <PreviewImageUpload
              toolId={tool.id}
              value={tool.cover_url}
              onChange={url => set('cover_url', url ?? '')}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              We normally screenshot your homepage automatically. If your site blocks bots
              (Cloudflare and similar), upload an image here instead.
            </p>
          </Field>
          <Field label="Product Video URL">
            <input type="url" value={tool.video_url ?? ''} onChange={e => set('video_url', e.target.value)}
              placeholder="YouTube or Vimeo URL" className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Live Demo URL">
            <input type="url" value={tool.demo_url ?? ''} onChange={e => set('demo_url', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Screenshots (comma-separated URLs)">
            <textarea value={(tool.screenshots ?? []).join(', ')} onChange={e => set('screenshots', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
              rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>
        </Section>

        {/* Pricing & Technical */}
        <Section icon={<DollarSign className="h-4 w-4" style={{color:'#e94560'}} />} title="Pricing & Technical" defaultOpen={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pricing Model">
              <select value={tool.pricing_model ?? ''} onChange={e => set('pricing_model', e.target.value)}
                className={`${inputCls} cursor-pointer`} style={selectStyle}>
                <option value="">-- Select --</option>
                {PRICING_MODELS.map(p => <option key={p} value={p}>{PRICING_LABELS[p]}</option>)}
              </select>
            </Field>
            <Field label="Starting Price">
              <input type="text" value={tool.starting_price ?? ''} onChange={e => set('starting_price', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>
          <Field label="Pricing Page URL">
            <input type="url" value={tool.pricing_url ?? ''} onChange={e => set('pricing_url', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Toggle checked={tool.has_free_trial ?? false} onChange={v => set('has_free_trial', v)} label="Free Trial" />
            <Toggle checked={tool.has_api ?? false} onChange={v => set('has_api', v)} label="API Available" />
            <Toggle checked={tool.no_code ?? false} onChange={v => set('no_code', v)} label="No-Code" />
            <Toggle checked={tool.gdpr_compliant ?? false} onChange={v => set('gdpr_compliant', v)} label="GDPR" />
          </div>
          {tool.has_free_trial && (
            <Field label="Trial Duration">
              <input type="text" value={tool.trial_duration ?? ''} onChange={e => set('trial_duration', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          )}
          {tool.has_api && (
            <Field label="API Docs URL">
              <input type="url" value={tool.api_docs_url ?? ''} onChange={e => set('api_docs_url', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                  className="rounded-lg border px-3 py-2 text-xs transition"
                  style={{
                    borderColor: (tool.platforms ?? []).includes(p.value) ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
                    background: (tool.platforms ?? []).includes(p.value) ? 'rgba(233,69,96,0.1)' : 'rgba(255,255,255,0.02)',
                    color: (tool.platforms ?? []).includes(p.value) ? '#e94560' : '#94a3b8',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Integrations">
            <textarea value={tool.integrations ?? ''} onChange={e => set('integrations', e.target.value)}
              rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Promo Code">
              <input type="text" value={tool.promo_code ?? ''} onChange={e => set('promo_code', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Promo Description">
              <input type="text" value={tool.promo_desc ?? ''} onChange={e => set('promo_desc', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>
        </Section>

        {/* Company & Contact */}
        <Section icon={<Building2 className="h-4 w-4" style={{color:'#e94560'}} />} title="Company & Contact" defaultOpen={false}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name">
              <input type="text" value={tool.company_name ?? ''} onChange={e => set('company_name', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="HQ Location">
              <input type="text" value={tool.hq_location ?? ''} onChange={e => set('hq_location', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Founded Year">
              <input type="text" value={tool.founded_year ?? ''} onChange={e => set('founded_year', e.target.value)}
                maxLength={4} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Team Size">
              <select value={tool.team_size ?? ''} onChange={e => set('team_size', e.target.value)}
                className={`${inputCls} cursor-pointer`} style={selectStyle}>
                <option value="">-- Select --</option>
                <option>Solo founder</option><option>2-10</option><option>11-50</option>
                <option>51-200</option><option>201-500</option><option>500+</option>
              </select>
            </Field>
          </div>
          <Field label="Company Description">
            <textarea value={tool.company_description ?? ''} onChange={e => set('company_description', e.target.value)}
              rows={3} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>

          <div className="pt-3" style={{borderTop:'1px solid #1e2a3a'}}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Contact</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Name">
              <input type="text" value={tool.contact_name ?? ''} onChange={e => set('contact_name', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Contact Email">
              <input type="email" value={tool.contact_email ?? ''} onChange={e => set('contact_email', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input type="tel" value={tool.contact_phone ?? ''} onChange={e => set('contact_phone', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Support URL">
              <input type="url" value={tool.support_url ?? ''} onChange={e => set('support_url', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <div className="pt-3" style={{borderTop:'1px solid #1e2a3a'}}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Social Links</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['twitter_url','Twitter / X'],['linkedin_url','LinkedIn'],['github_url','GitHub'],
              ['youtube_url','YouTube'],['discord_url','Discord'],['facebook_url','Facebook'],
              ['instagram_url','Instagram'],['tiktok_url','TikTok'],['product_hunt_url','Product Hunt'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
                <input type="url" value={tool[key] ?? ''} onChange={e => set(key, e.target.value)}
                  className={`${inputCls} !py-2 !text-xs`} style={inputStyle} />
              </div>
            ))}
          </div>
        </Section>

        {/* Audience & Promotion */}
        <Section icon={<Target className="h-4 w-4" style={{color:'#e94560'}} />} title="Audience & Use Cases" defaultOpen={false}>
          <Field label="Target Audience">
            <textarea value={tool.target_audience ?? ''} onChange={e => set('target_audience', e.target.value)}
              rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>
          <Field label="Use Cases (one per line)">
            <textarea value={tool.use_cases ?? ''} onChange={e => set('use_cases', e.target.value)}
              rows={3} className={`${inputCls} resize-none`} style={inputStyle} />
          </Field>
          <Field label="Tags (comma-separated)">
            <input type="text" value={(tool.tags ?? []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
              className={inputCls} style={inputStyle} />
          </Field>
        </Section>

        {/* Social Promotion */}
        <Section icon={<Megaphone className="h-4 w-4" style={{color:'#8b5cf6'}} />} title="Social Promotion Consent" defaultOpen={false}>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition"
            style={{borderColor: tool.social_promotion_consent ? 'rgba(139,92,246,0.4)' : '#1e2a3a',
              background: tool.social_promotion_consent ? 'rgba(139,92,246,0.06)' : 'transparent'}}>
            <input type="checkbox" checked={tool.social_promotion_consent ?? false}
              onChange={e => set('social_promotion_consent', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-purple-500" />
            <div>
              <span className="text-sm text-white">Allow ListmyAI to promote our brand on social media</span>
              <p className="mt-0.5 text-xs text-slate-500">All promotional content goes through approval.</p>
            </div>
          </label>
          {tool.social_promotion_consent && (
            <>
              <Field label="Creative Assets (comma-separated URLs)">
                <textarea value={(tool.creatives ?? []).join(', ')}
                  onChange={e => set('creatives', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
              </Field>
              <Field label="Brand Guidelines URL">
                <input type="url" value={tool.brand_guidelines_url ?? ''} onChange={e => set('brand_guidelines_url', e.target.value)}
                  className={inputCls} style={inputStyle} />
              </Field>
            </>
          )}
        </Section>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-4">
          <Link href="/dashboard" className="rounded-xl border px-5 py-3 text-sm text-slate-300 transition hover:text-white" style={{borderColor:'#1e2a3a'}}>
            Cancel
          </Link>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{background:'#e94560'}}>
            {saving ? 'Saving…' : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
