'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Sparkles, Clock, Star, Zap } from 'lucide-react'
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

const PERKS = [
  { icon:<Sparkles className="h-5 w-5" style={{color:'#e94560'}} />, title:'Free for 6 months', desc:'No credit card required. Your listing is live instantly.' },
  { icon:<Zap className="h-5 w-5" style={{color:'#f59e0b'}} />,       title:'Add promo codes',   desc:'Highlight free trials and discounts to attract more users.' },
  { icon:<Star className="h-5 w-5" style={{color:'#8b5cf6'}} />,      title:'Verified badge',    desc:'Claim and verify your listing for a credibility badge.' },
  { icon:<Clock className="h-5 w-5" style={{color:'#10b981'}} />,     title:'Live in minutes',   desc:'Auto-populated listings go live as soon as they\'re approved.' },
]

export default function SubmitPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<1|2|3>(1)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [prefilled, setPrefilled] = useState(false)
  const [form, setForm] = useState({
    name:'', website:'', tagline:'', description:'', category:'', pricing_model:'',
    starting_price:'', has_free_trial:false, trial_duration:'', promo_code:'', promo_desc:'',
    has_api:false, company_name:'', hq_location:'', founded_year:'',
    contact_email:'', contact_name:'',
  })

  // Pre-fill contact details from logged-in user's profile
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

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/tools/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        <h1 className="text-3xl font-black text-white">You&apos;re Listed! 🎉</h1>
        <p className="mt-3 text-slate-400">
          <strong className="text-white">{form.name}</strong> has been submitted. We&apos;ll review it shortly
          and send a confirmation to <strong className="text-white">{form.contact_email}</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-500">Your 6-month free listing period starts now.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="/directory" className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{background:'#e94560'}}>
            Browse Directory
          </a>
          <button onClick={() => { setDone(false); setStep(1); setForm(f=>({...f,name:'',website:''})) }}
            className="rounded-xl border px-6 py-3 text-sm text-slate-300 transition hover:text-white" style={{borderColor:'#1e2a3a'}}>
            Submit Another
          </button>
        </div>
      </div>
    </div>
  )

  const stepCls = (s: number) => s === step
    ? 'border-brand-red bg-brand-red text-white'
    : s < step
    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
    : 'border-brand-border bg-brand-card text-slate-500'

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-3">

        {/* Left: Perks */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black text-white">List Your AI Tool</h1>
            <p className="mt-2 text-slate-400">Free for the first 6 months. No credit card needed.</p>
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
              click &ldquo;Claim Listing&rdquo; to take ownership.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2">
          {/* Steps */}
          <div className="mb-8 flex items-center gap-3">
            {[1,2,3].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition ${stepCls(s)}`}>
                  {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <span className={`hidden text-sm sm:block ${s === step ? 'text-white font-medium' : 'text-slate-500'}`}>
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Pricing & Features' : 'Contact'}
                </span>
                {s < 3 && <div className="h-px w-6 flex-1" style={{background:'#1e2a3a'}} />}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="rounded-2xl border p-6 space-y-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>

            {step === 1 && <>
              <h2 className="text-lg font-bold text-white">Basic Information</h2>
              {[
                { key:'name',        label:'AI Tool Name *',     type:'text',  placeholder:'e.g. ChatGPT', required:true },
                { key:'website',     label:'Official Website *', type:'url',   placeholder:'https://example.com', required:true },
                { key:'tagline',     label:'Tagline',            type:'text',  placeholder:'One-line description (max 100 chars)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)}
                    placeholder={f.placeholder} required={f.required}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:outline-none focus:ring-2"
                    style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.04)'}} />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Category *</label>
                <select value={form.category} onChange={e=>set('category',e.target.value)} required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white transition focus:outline-none"
                  style={{borderColor:'#1e2a3a',background:'#0f172a'}}>
                  <option value="">-- Select a category --</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
                <textarea value={form.description} onChange={e=>set('description',e.target.value)}
                  rows={4} placeholder="Describe what your AI tool does, who it's for, and what makes it unique…"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:outline-none resize-none"
                  style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.04)'}} />
              </div>
              <button type="button" onClick={()=>setStep(2)}
                disabled={!form.name||!form.website||!form.category}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{background:'#e94560'}}>
                Continue →
              </button>
            </>}

            {step === 2 && <>
              <h2 className="text-lg font-bold text-white">Pricing & Features</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Pricing Model *</label>
                  <select value={form.pricing_model} onChange={e=>set('pricing_model',e.target.value)} required
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{borderColor:'#1e2a3a',background:'#0f172a'}}>
                    <option value="">-- Select --</option>
                    {PRICING_MODELS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">Starting Price</label>
                  <input type="text" value={form.starting_price} onChange={e=>set('starting_price',e.target.value)}
                    placeholder="e.g. Free / $20/mo"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.04)'}} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key:'has_free_trial', label:'Has Free Trial' },
                  { key:'has_api',        label:'API Available' },
                ].map(f=>(
                  <label key={f.key} className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition hover:border-brand-red/30"
                    style={{borderColor:(form as any)[f.key]?'rgba(233,69,96,0.4)':'#1e2a3a',background:(form as any)[f.key]?'rgba(233,69,96,0.08)':'rgba(255,255,255,0.02)'}}>
                    <input type="checkbox" checked={(form as any)[f.key]} onChange={e=>set(f.key,e.target.checked)}
                      className="h-4 w-4 accent-brand-red" />
                    <span className="text-sm text-slate-300">{f.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Active Promo Code</label>
                <input type="text" value={form.promo_code} onChange={e=>set('promo_code',e.target.value)}
                  placeholder="e.g. LISTMYAI30"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.04)'}} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Promo Description</label>
                <input type="text" value={form.promo_desc} onChange={e=>set('promo_desc',e.target.value)}
                  placeholder="e.g. 30% off first 3 months for ListmyAI users"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.04)'}} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>setStep(1)}
                  className="flex-1 rounded-xl border py-3 text-sm text-slate-300 transition hover:text-white"
                  style={{borderColor:'#1e2a3a'}}>
                  ← Back
                </button>
                <button type="button" onClick={()=>setStep(3)} disabled={!form.pricing_model}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-40 hover:opacity-90"
                  style={{background:'#e94560'}}>
                  Continue →
                </button>
              </div>
            </>}

            {step === 3 && <>
              <h2 className="text-lg font-bold text-white">Contact Details</h2>
              {user ? (
                <p className="text-sm text-slate-500">Pre-filled from your account. Edit if needed.</p>
              ) : (
                <p className="text-sm text-slate-500">Used to send your listing confirmation and account setup email.</p>
              )}
              {[
                { key:'contact_name',  label:'Your Name *',          type:'text',  placeholder:'Jane Smith',                    required:true  },
                { key:'contact_email', label:'Email Address *',       type:'email', placeholder:'jane@yourcompany.com',          required:true  },
                { key:'company_name',  label:'Company / Brand Name',  type:'text',  placeholder:'Acme AI, Inc.',                 required:false },
                { key:'hq_location',   label:'HQ Location',           type:'text',  placeholder:'San Francisco, CA',             required:false },
              ].map(f=>(
                <div key={f.key}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e=>set(f.key,e.target.value)}
                    placeholder={f.placeholder} required={f.required}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                    style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.04)'}} />
                </div>
              ))}
              <p className="rounded-lg p-3 text-xs text-slate-500" style={{background:'rgba(255,255,255,0.03)'}}>
                By submitting, you confirm this is an AI tool you are authorised to represent, and you agree to our{' '}
                <a href="/terms" className="hover:underline" style={{color:'#e94560'}}>Terms of Use</a> and{' '}
                <a href="/disclaimer" className="hover:underline" style={{color:'#e94560'}}>Disclaimer</a>.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={()=>setStep(2)}
                  className="flex-1 rounded-xl border py-3 text-sm text-slate-300 transition hover:text-white"
                  style={{borderColor:'#1e2a3a'}}>
                  ← Back
                </button>
                <button type="submit" disabled={!form.contact_name||!form.contact_email||submitting}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-40 hover:opacity-90"
                  style={{background:'#e94560'}}>
                  {submitting ? 'Submitting…' : '🚀 Submit Listing'}
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
