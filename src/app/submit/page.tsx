'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Sparkles, Clock, Star, Zap, LogIn,
  ChevronDown, ChevronUp, Video, Globe,
  DollarSign, Building2, Target, Megaphone,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  'Chatbot / Assistant','Image Generation','Video Generation','Audio & Music',
  'Code Assistant','Writing & Copy','SEO & Marketing','Data & Analytics',
  'Voice & Speech','AI Search','Automation','Design & Creative',
  'Research','Education','Healthcare','Finance & Legal','Other',
]

const PRICING_MODELS = [
  'Free','Freemium','Free Trial','Subscription','Pay Per Use','One-Time Purchase','Enterprise',
]

const PLATFORMS = [
  { value: 'web', label: 'Web' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'mac', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'api', label: 'API' },
  { value: 'chrome', label: 'Chrome Extension' },
  { value: 'vscode', label: 'VS Code' },
]

const PERKS = [
  { icon:<Sparkles className="h-5 w-5" style={{color:'#e94560'}} />, title:'Free for 6 months', desc:'No credit card required. Your listing is live instantly.' },
  { icon:<Zap className="h-5 w-5" style={{color:'#f59e0b'}} />,       title:'Rich product page',   desc:'Showcase videos, demos, screenshots & more to attract users.' },
  { icon:<Star className="h-5 w-5" style={{color:'#8b5cf6'}} />,      title:'Verified badge',    desc:'Claim and verify your listing for a credibility badge.' },
  { icon:<Clock className="h-5 w-5" style={{color:'#10b981'}} />,     title:'Live in minutes',   desc:'Listings go live as soon as they\'re approved by our team.' },
]

const inputCls = 'w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-brand-red/40'
const inputStyle = { borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.04)' }
const selectStyle = { borderColor: '#1e2a3a', background: '#0f172a' }

interface FormState {
  name: string; website: string; tagline: string; description: string; category: string
  logo_url: string; video_url: string; demo_url: string; screenshots: string
  pricing_model: string; starting_price: string; pricing_url: string
  has_free_trial: boolean; trial_duration: string
  promo_code: string; promo_desc: string
  has_api: boolean; api_docs_url: string; no_code: boolean; gdpr_compliant: boolean
  platforms: string[]; integrations: string
  company_name: string; company_description: string; hq_location: string
  founded_year: string; team_size: string
  contact_name: string; contact_email: string; contact_phone: string; support_url: string
  twitter_url: string; linkedin_url: string; github_url: string; discord_url: string
  youtube_url: string; facebook_url: string; instagram_url: string; tiktok_url: string
  product_hunt_url: string
  target_audience: string; use_cases: string; tags: string
  social_promotion_consent: boolean; creatives: string; brand_guidelines_url: string
}

const INITIAL_FORM: FormState = {
  name:'', website:'', tagline:'', description:'', category:'',
  logo_url:'', video_url:'', demo_url:'', screenshots:'',
  pricing_model:'', starting_price:'', pricing_url:'',
  has_free_trial:false, trial_duration:'',
  promo_code:'', promo_desc:'',
  has_api:false, api_docs_url:'', no_code:false, gdpr_compliant:false,
  platforms:[], integrations:'',
  company_name:'', company_description:'', hq_location:'', founded_year:'', team_size:'',
  contact_name:'', contact_email:'', contact_phone:'', support_url:'',
  twitter_url:'', linkedin_url:'', github_url:'', discord_url:'',
  youtube_url:'', facebook_url:'', instagram_url:'', tiktok_url:'', product_hunt_url:'',
  target_audience:'', use_cases:'', tags:'',
  social_promotion_consent:false, creatives:'', brand_guidelines_url:'',
}

const STEPS = [
  { n: 1, label: 'Basic Info' },
  { n: 2, label: 'Media' },
  { n: 3, label: 'Pricing & Tech' },
  { n: 4, label: 'Company & Contact' },
  { n: 5, label: 'Promote & Submit' },
]

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{background:'rgba(233,69,96,0.12)',border:'1px solid rgba(233,69,96,0.25)'}}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
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

function NavButtons({ step, setStep, canNext }: { step: number; setStep: (s: number) => void; canNext: boolean }) {
  return (
    <div className="flex gap-3">
      {step > 1 && (
        <button type="button" onClick={() => setStep(step - 1)}
          className="flex-1 rounded-xl border py-3 text-sm text-slate-300 transition hover:text-white"
          style={{borderColor:'#1e2a3a'}}>
          &larr; Back
        </button>
      )}
      <button type="button" onClick={() => setStep(step + 1)} disabled={!canNext}
        className={`${step > 1 ? 'flex-1' : 'w-full'} rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90`}
        style={{background:'#e94560'}}>
        Continue &rarr;
      </button>
    </div>
  )
}

function CollapsibleSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-medium text-slate-300">{title}</p>
          {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function SubmitPage() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [prefilled, setPrefilled] = useState(false)
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM })

  useEffect(() => {
    if (!user || prefilled) return
    async function prefill() {
      const supabase = createClient()
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, display_name, company')
        .eq('id', user!.id)
        .maybeSingle()

      setForm(f => ({
        ...f,
        contact_name: f.contact_name || prof?.full_name || prof?.display_name || user!.user_metadata?.full_name || '',
        contact_email: f.contact_email || user!.email || '',
        company_name: f.company_name || prof?.company || '',
      }))
      setPrefilled(true)
    }
    prefill()
  }, [user, prefilled])

  function set(k: keyof FormState, v: string | boolean | string[]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function togglePlatform(p: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload: Record<string, unknown> = { ...form }
      payload.screenshots = form.screenshots ? form.screenshots.split(',').map(s => s.trim()).filter(Boolean) : []
      payload.tags = form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : []
      payload.creatives = form.creatives ? form.creatives.split(',').map(s => s.trim()).filter(Boolean) : []

      const res = await fetch('/api/tools/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) {
        setSubmitError(data.error)
      } else {
        setDone(true)
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{background:'rgba(16,185,129,0.15)',border:'2px solid rgba(16,185,129,0.3)'}}>
          <CheckCircle2 className="h-10 w-10" style={{color:'#10b981'}} />
        </div>
        <h1 className="text-3xl font-black text-white">You&apos;re Listed!</h1>
        <p className="mt-3 text-slate-400">
          <strong className="text-white">{form.name}</strong> has been submitted for review.
          We&apos;ll send a confirmation to <strong className="text-white">{form.contact_email}</strong> once approved.
        </p>
        <p className="mt-2 text-sm text-slate-500">All submissions go through our review process before going live.</p>
        {form.social_promotion_consent && (
          <p className="mt-2 text-sm text-emerald-400">We&apos;ll feature your tool on our social channels after approval.</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="/directory" className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{background:'#e94560'}}>
            Browse Directory
          </a>
          <button onClick={() => { setDone(false); setStep(1); setForm({ ...INITIAL_FORM }) }}
            className="rounded-xl border px-6 py-3 text-sm text-slate-300 transition hover:text-white" style={{borderColor:'#1e2a3a'}}>
            Submit Another
          </button>
        </div>
      </div>
    </div>
  )

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: 'rgba(233,69,96,0.15)', border: '2px solid rgba(233,69,96,0.3)' }}>
            <LogIn className="h-10 w-10" style={{ color: '#e94560' }} />
          </div>
          <h1 className="text-3xl font-black text-white">Sign in to Submit</h1>
          <p className="mt-3 text-slate-400">
            You need to be signed in to list your AI tool on ListmyAI. This helps us link the listing to your account.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login?redirect=/submit"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Sign In
            </Link>
            <Link href="/register?redirect=/submit"
              className="rounded-xl border px-6 py-3 text-sm text-slate-300 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const stepCls = (s: number) => s === step
    ? 'border-brand-red bg-brand-red text-white'
    : s < step
    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
    : 'border-brand-border bg-brand-card text-slate-500'

  const canNext = (s: number) => {
    if (s === 1) return !!(form.name && form.website && form.category)
    if (s === 3) return !!form.pricing_model
    if (s === 4) return !!(form.contact_name && form.contact_email)
    return true
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-3">

        {/* Left sidebar */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black text-white">List Your AI Tool</h1>
            <p className="mt-2 text-slate-400">Free for the first 6 months. Add as much info as you like — only a few fields are required.</p>
          </div>
          <div className="space-y-4">
            {PERKS.map(p => (
              <div key={p.title} className="flex gap-3">
                <div className="mt-0.5 shrink-0">{p.icon}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{p.title}</p>
                  <p className="text-sm text-slate-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 text-sm" style={{border:'1px solid rgba(233,69,96,0.2)',background:'rgba(233,69,96,0.05)'}}>
            <p className="font-semibold" style={{color:'#e94560'}}>Already listed?</p>
            <p className="mt-1 text-slate-400">
              If your tool was auto-enrolled, <a href="/directory" style={{color:'#e94560'}} className="hover:underline">find it in the directory</a> and
              click &ldquo;Claim Listing&rdquo; to take ownership and update it.
            </p>
          </div>

          {/* Progress sidebar — desktop only */}
          <div className="hidden lg:block rounded-xl border p-4" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Progress</p>
            <div className="space-y-2">
              {STEPS.map(s => (
                <button key={s.n} onClick={() => { if (s.n <= step) setStep(s.n) }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${s.n === step ? 'bg-brand-red/10 text-white font-medium' : s.n < step ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${stepCls(s.n)}`}>
                    {s.n < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="lg:col-span-2">

          {/* Mobile step indicator */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto lg:hidden pb-2">
            {STEPS.map(s => (
              <button key={s.n} onClick={() => { if (s.n <= step) setStep(s.n) }}
                className="flex shrink-0 items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${stepCls(s.n)}`}>
                  {s.n < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                </span>
                <span className={`text-xs whitespace-nowrap ${s.n === step ? 'text-white font-medium' : 'text-slate-500'}`}>{s.label}</span>
                {s.n < STEPS.length && <div className="h-px w-4" style={{background:'#1e2a3a'}} />}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="rounded-2xl border p-4 sm:p-6 space-y-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>

            {/* ── Step 1: Basic Info ───────────────────────────────────── */}
            {step === 1 && <>
              <SectionHeader icon={<Globe className="h-4 w-4" style={{color:'#e94560'}} />} title="Basic Information" desc="Tell us about your AI tool" />

              <Field label="AI Tool Name" required>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. ChatGPT" required className={inputCls} style={inputStyle} />
              </Field>

              <Field label="Official Website" required>
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="https://example.com" required className={inputCls} style={inputStyle} />
              </Field>

              <Field label="Category" required>
                <select value={form.category} onChange={e => set('category', e.target.value)} required
                  className={`${inputCls} cursor-pointer`} style={selectStyle}>
                  <option value="">-- Select a category --</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Tagline">
                <input type="text" value={form.tagline} onChange={e => set('tagline', e.target.value)}
                  placeholder="One-line description (max 120 chars)" maxLength={120}
                  className={inputCls} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">{form.tagline.length}/120</p>
              </Field>

              <Field label="Full Description">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={5} placeholder="Describe what your AI tool does, who it's for, key features, and what makes it unique…"
                  className={`${inputCls} resize-none`} style={inputStyle} />
              </Field>

              <NavButtons step={step} setStep={setStep} canNext={canNext(step)} />
            </>}

            {/* ── Step 2: Media & Demos ────────────────────────────────── */}
            {step === 2 && <>
              <SectionHeader icon={<Video className="h-4 w-4" style={{color:'#e94560'}} />} title="Media & Demos" desc="Showcase your product — all optional" />

              <Field label="Logo URL">
                <input type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png" className={inputCls} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">Square image, at least 200x200px recommended</p>
              </Field>

              <Field label="Product Video URL">
                <input type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." className={inputCls} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">YouTube or Vimeo link to a product demo, intro, or walkthrough</p>
              </Field>

              <Field label="Live Demo URL">
                <input type="url" value={form.demo_url} onChange={e => set('demo_url', e.target.value)}
                  placeholder="https://demo.example.com" className={inputCls} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">Link to an interactive demo or sandbox users can try</p>
              </Field>

              <Field label="Screenshot URLs">
                <textarea value={form.screenshots} onChange={e => set('screenshots', e.target.value)}
                  rows={3} placeholder={"Paste image URLs separated by commas\ne.g. https://example.com/screen1.png, https://example.com/screen2.png"}
                  className={`${inputCls} resize-none`} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">Comma-separated image URLs showing your product in action</p>
              </Field>

              <NavButtons step={step} setStep={setStep} canNext={canNext(step)} />
            </>}

            {/* ── Step 3: Pricing & Technical ─────────────────────────── */}
            {step === 3 && <>
              <SectionHeader icon={<DollarSign className="h-4 w-4" style={{color:'#e94560'}} />} title="Pricing & Technical Details" />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pricing Model" required>
                  <select value={form.pricing_model} onChange={e => set('pricing_model', e.target.value)} required
                    className={`${inputCls} cursor-pointer`} style={selectStyle}>
                    <option value="">-- Select --</option>
                    {PRICING_MODELS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Starting Price">
                  <input type="text" value={form.starting_price} onChange={e => set('starting_price', e.target.value)}
                    placeholder="e.g. Free / $20/mo" className={inputCls} style={inputStyle} />
                </Field>
              </div>

              <Field label="Pricing Page URL">
                <input type="url" value={form.pricing_url} onChange={e => set('pricing_url', e.target.value)}
                  placeholder="https://example.com/pricing" className={inputCls} style={inputStyle} />
              </Field>

              <div className="flex flex-wrap gap-3">
                <Toggle checked={form.has_free_trial} onChange={v => set('has_free_trial', v)} label="Free Trial Available" />
                <Toggle checked={form.has_api} onChange={v => set('has_api', v)} label="API Available" />
                <Toggle checked={form.no_code} onChange={v => set('no_code', v)} label="No-Code Friendly" />
                <Toggle checked={form.gdpr_compliant} onChange={v => set('gdpr_compliant', v)} label="GDPR Compliant" />
              </div>

              {form.has_free_trial && (
                <Field label="Trial Duration">
                  <input type="text" value={form.trial_duration} onChange={e => set('trial_duration', e.target.value)}
                    placeholder="e.g. 14 days free trial" className={inputCls} style={inputStyle} />
                </Field>
              )}

              {form.has_api && (
                <Field label="API Documentation URL">
                  <input type="url" value={form.api_docs_url} onChange={e => set('api_docs_url', e.target.value)}
                    placeholder="https://docs.example.com/api" className={inputCls} style={inputStyle} />
                </Field>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Available Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                      className="rounded-lg border px-3 py-2 text-xs transition"
                      style={{
                        borderColor: form.platforms.includes(p.value) ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
                        background: form.platforms.includes(p.value) ? 'rgba(233,69,96,0.1)' : 'rgba(255,255,255,0.02)',
                        color: form.platforms.includes(p.value) ? '#e94560' : '#94a3b8',
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Integrations">
                <textarea value={form.integrations} onChange={e => set('integrations', e.target.value)}
                  rows={2} placeholder="e.g. Slack, Zapier, Google Workspace, Notion, HubSpot..."
                  className={`${inputCls} resize-none`} style={inputStyle} />
              </Field>

              <CollapsibleSection title="Active Promo / Coupon" subtitle="Optional — highlight a deal for ListmyAI users">
                <div className="space-y-4">
                  <Field label="Promo Code">
                    <input type="text" value={form.promo_code} onChange={e => set('promo_code', e.target.value)}
                      placeholder="e.g. LISTMYAI30" className={inputCls} style={inputStyle} />
                  </Field>
                  <Field label="Promo Description">
                    <input type="text" value={form.promo_desc} onChange={e => set('promo_desc', e.target.value)}
                      placeholder="e.g. 30% off first 3 months for ListmyAI users" className={inputCls} style={inputStyle} />
                  </Field>
                </div>
              </CollapsibleSection>

              <NavButtons step={step} setStep={setStep} canNext={canNext(step)} />
            </>}

            {/* ── Step 4: Company & Contact ────────────────────────────── */}
            {step === 4 && <>
              <SectionHeader icon={<Building2 className="h-4 w-4" style={{color:'#e94560'}} />} title="Company & Contact" desc="Help users reach you" />

              <p className="text-sm text-slate-500">
                {user ? 'Pre-filled from your account. Edit if needed.' : 'Used to send listing confirmation and link your account.'}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your Name" required>
                  <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                    placeholder="Jane Smith" required className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Email Address" required>
                  <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                    placeholder="jane@yourcompany.com" required className={inputCls} style={inputStyle} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone Number">
                  <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                    placeholder="+1 (555) 000-0000" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Support / Help Center URL">
                  <input type="url" value={form.support_url} onChange={e => set('support_url', e.target.value)}
                    placeholder="https://help.example.com" className={inputCls} style={inputStyle} />
                </Field>
              </div>

              <div className="pt-4 mt-2" style={{borderTop:'1px solid #1e2a3a'}}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Company Details</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company / Brand Name">
                  <input type="text" value={form.company_name} onChange={e => set('company_name', e.target.value)}
                    placeholder="Acme AI, Inc." className={inputCls} style={inputStyle} />
                </Field>
                <Field label="HQ Location">
                  <input type="text" value={form.hq_location} onChange={e => set('hq_location', e.target.value)}
                    placeholder="San Francisco, CA" className={inputCls} style={inputStyle} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Founded Year">
                  <input type="text" value={form.founded_year} onChange={e => set('founded_year', e.target.value)}
                    placeholder="2023" maxLength={4} className={inputCls} style={inputStyle} />
                </Field>
                <Field label="Team Size">
                  <select value={form.team_size} onChange={e => set('team_size', e.target.value)}
                    className={`${inputCls} cursor-pointer`} style={selectStyle}>
                    <option value="">-- Select --</option>
                    <option>Solo founder</option>
                    <option>2-10</option>
                    <option>11-50</option>
                    <option>51-200</option>
                    <option>201-500</option>
                    <option>500+</option>
                  </select>
                </Field>
              </div>

              <Field label="Company Description">
                <textarea value={form.company_description} onChange={e => set('company_description', e.target.value)}
                  rows={3} placeholder="Brief description of the company behind the tool…"
                  className={`${inputCls} resize-none`} style={inputStyle} />
              </Field>

              <div className="pt-4 mt-2" style={{borderTop:'1px solid #1e2a3a'}}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Social & Community Links</p>
                <p className="text-xs text-slate-600 mb-3">Add your social profiles — these will appear on your listing page</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { key: 'twitter_url' as const, label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
                  { key: 'linkedin_url' as const, label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
                  { key: 'github_url' as const, label: 'GitHub', placeholder: 'https://github.com/yourrepo' },
                  { key: 'youtube_url' as const, label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
                  { key: 'discord_url' as const, label: 'Discord', placeholder: 'https://discord.gg/invite' },
                  { key: 'facebook_url' as const, label: 'Facebook', placeholder: 'https://facebook.com/page' },
                  { key: 'instagram_url' as const, label: 'Instagram', placeholder: 'https://instagram.com/handle' },
                  { key: 'tiktok_url' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@handle' },
                  { key: 'product_hunt_url' as const, label: 'Product Hunt', placeholder: 'https://producthunt.com/products/...' },
                ]).map(s => (
                  <div key={s.key}>
                    <label className="mb-1 block text-xs font-medium text-slate-400">{s.label}</label>
                    <input type="url" value={form[s.key]} onChange={e => set(s.key, e.target.value)}
                      placeholder={s.placeholder} className={`${inputCls} !py-2 !text-xs`} style={inputStyle} />
                  </div>
                ))}
              </div>

              <NavButtons step={step} setStep={setStep} canNext={canNext(step)} />
            </>}

            {/* ── Step 5: Audience, Promotion & Submit ─────────────────── */}
            {step === 5 && <>
              <SectionHeader icon={<Target className="h-4 w-4" style={{color:'#e94560'}} />} title="Audience & Promotion" desc="Help us promote your tool" />

              <Field label="Target Audience">
                <textarea value={form.target_audience} onChange={e => set('target_audience', e.target.value)}
                  rows={2} placeholder="e.g. Content creators, SaaS founders, marketing teams, developers..."
                  className={`${inputCls} resize-none`} style={inputStyle} />
              </Field>

              <Field label="Key Use Cases">
                <textarea value={form.use_cases} onChange={e => set('use_cases', e.target.value)}
                  rows={3} placeholder={"One use case per line:\nBlog writing\nSocial media content\nSEO optimization\nEmail copywriting"}
                  className={`${inputCls} resize-none`} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">One per line — these appear as badges on your listing</p>
              </Field>

              <Field label="Tags / Keywords">
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="e.g. AI writing, content generation, GPT, copywriting" className={inputCls} style={inputStyle} />
                <p className="mt-1 text-xs text-slate-600">Comma-separated — helps users find your tool via search</p>
              </Field>

              {/* Promotion consent */}
              <div className="rounded-xl border p-5 space-y-4" style={{borderColor:'rgba(139,92,246,0.2)',background:'rgba(139,92,246,0.04)'}}>
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 shrink-0" style={{color:'#8b5cf6'}} />
                  <div>
                    <p className="font-semibold text-white text-sm">Social Media Promotion</p>
                    <p className="text-xs text-slate-400">Let ListmyAI promote your tool on our social channels</p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:border-purple-500/30"
                  style={{borderColor: form.social_promotion_consent ? 'rgba(139,92,246,0.4)' : '#1e2a3a', background: form.social_promotion_consent ? 'rgba(139,92,246,0.06)' : 'transparent'}}>
                  <input type="checkbox" checked={form.social_promotion_consent} onChange={e => set('social_promotion_consent', e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-purple-500" />
                  <div>
                    <span className="text-sm text-white">Yes, I consent to ListmyAI promoting our brand on its social media handles</span>
                    <p className="mt-0.5 text-xs text-slate-500">We may feature your tool in posts, stories, newsletters, and social content. All promotional content goes through an approval process.</p>
                  </div>
                </label>

                {form.social_promotion_consent && (
                  <div className="space-y-3 pl-7">
                    <Field label="Creative Assets for Promotion">
                      <textarea value={form.creatives} onChange={e => set('creatives', e.target.value)}
                        rows={2} placeholder={"Paste image/asset URLs separated by commas\ne.g. https://example.com/banner.png, https://example.com/logo-dark.png"}
                        className={`${inputCls} resize-none`} style={inputStyle} />
                      <p className="mt-1 text-xs text-slate-600">Logos, banners, product shots we can use in social posts (will go through approval)</p>
                    </Field>
                    <Field label="Brand Guidelines URL">
                      <input type="url" value={form.brand_guidelines_url} onChange={e => set('brand_guidelines_url', e.target.value)}
                        placeholder="https://example.com/brand-guidelines.pdf" className={inputCls} style={inputStyle} />
                    </Field>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="rounded-lg p-3 text-xs text-slate-500" style={{background:'rgba(255,255,255,0.03)'}}>
                By submitting, you confirm this is an AI tool you are authorised to represent, and you agree to our{' '}
                <a href="/terms" className="hover:underline" style={{color:'#e94560'}}>Terms of Use</a> and{' '}
                <a href="/disclaimer" className="hover:underline" style={{color:'#e94560'}}>Disclaimer</a>.
                All submissions go through our review and approval process before being published.
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(4)}
                  className="flex-1 rounded-xl border py-3 text-sm text-slate-300 transition hover:text-white"
                  style={{borderColor:'#1e2a3a'}}>
                  &larr; Back
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-40 hover:opacity-90"
                  style={{background:'#e94560'}}>
                  {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              </div>
              {submitError && (
                <p className="mt-3 text-sm text-red-400 text-center">{submitError}</p>
              )}
            </>}
          </form>
        </div>
      </div>
    </div>
  )
}
