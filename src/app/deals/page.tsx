import { Suspense } from 'react'
import PromoCard from '@/components/promo/PromoCard'
import { Promotion, Category } from '@/types'
import { Gift, Tag, Zap, Percent, BadgeCheck } from 'lucide-react'

const CATEGORIES: Category[] = [
  { id:4,  slug:'code',      name:'Code Assistant',   icon:'Code2',    color:'#06b6d4', count:15 },
  { id:10, slug:'voice',     name:'Voice & Speech',   icon:'Mic',      color:'#14b8a6', count:6  },
  { id:1,  slug:'chatbot',   name:'Chatbot',          icon:'MessageSquare', color:'#6366f1', count:24 },
]

const PROMOS: Promotion[] = [
  { id:'p1', tool_id:'4', promo_type:'trial',    title:'30-Day Free Trial',             description:'Try GitHub Copilot free for 30 days. No credit card required. Full access to all features.',      promo_code:'COPILOT30', discount_pct:0,  trial_days:30, valid_until:'2025-12-31', is_verified:true, created_at:'2024-01-01', tool:{ id:'4', name:'GitHub Copilot', slug:'github-copilot', category:CATEGORIES[0] } },
  { id:'p2', tool_id:'6', promo_type:'free_tier', title:'Free Voice Generation Forever', description:'ElevenLabs gives you 10,000 characters per month on the free tier. No credit card, no expiry.',promo_code:'',          discount_pct:0,  trial_days:0,  is_verified:true, created_at:'2024-01-01', tool:{ id:'6', name:'ElevenLabs',    slug:'elevenlabs',    category:CATEGORIES[1] } },
  { id:'p3', tool_id:'5', promo_type:'coupon',   title:'20% off Cursor Pro',            description:'Use this exclusive code at checkout for 20% off your first 3 months of Cursor Pro subscription.',promo_code:'LISTMYAI20',discount_pct:20, trial_days:0,  valid_until:'2025-09-30', is_verified:true, created_at:'2024-01-01', tool:{ id:'5', name:'Cursor',        slug:'cursor',        category:CATEGORIES[0] } },
  { id:'p4', tool_id:'2', promo_type:'free_tier', title:'Claude Free Tier',             description:'Use Claude for free — up to a generous daily limit. Free access to Claude 3.5 Sonnet.',          promo_code:'',          discount_pct:0,  trial_days:0,  is_verified:true, created_at:'2024-01-01', tool:{ id:'2', name:'Claude',        slug:'claude',        category:CATEGORIES[2] } },
  { id:'p5', tool_id:'1', promo_type:'free_tier', title:'ChatGPT Free Access',          description:'ChatGPT is free with GPT-4o access. No credit card required to start.',                           promo_code:'',          discount_pct:0,  trial_days:0,  is_verified:true, created_at:'2024-01-01', tool:{ id:'1', name:'ChatGPT',       slug:'chatgpt',       category:CATEGORIES[2] } },
  { id:'p6', tool_id:'7', promo_type:'trial',     title:'Runway 1-Month Free Trial',    description:'New users get 625 free credits to try Runway Gen-3 Alpha video generation.',                     promo_code:'RUNWAY2025',discount_pct:0,  trial_days:0,  valid_until:'2025-08-31', is_verified:true, created_at:'2024-01-01', tool:{ id:'7', name:'Runway ML',     slug:'runway',        category:CATEGORIES[0] } },
]

const DEAL_TYPES = [
  { key:'all',       label:'All Deals',  icon:<Gift className="h-4 w-4" /> },
  { key:'trial',     label:'Free Trials',icon:<Zap className="h-4 w-4" /> },
  { key:'coupon',    label:'Promo Codes',icon:<Tag className="h-4 w-4" /> },
  { key:'discount',  label:'Discounts',  icon:<Percent className="h-4 w-4" /> },
  { key:'free_tier', label:'Free Tiers', icon:<BadgeCheck className="h-4 w-4" /> },
]

interface Props { searchParams: Promise<{ type?: string }> }

export default async function DealsPage({ searchParams }: Props) {
  const { type = 'all' } = await searchParams
  const filtered = type === 'all' ? PROMOS : PROMOS.filter(p => p.promo_type === type)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
          style={{borderColor:'rgba(233,69,96,0.25)',background:'rgba(233,69,96,0.1)',color:'#e94560'}}>
          <Gift className="h-3.5 w-3.5" />
          Updated daily
        </div>
        <h1 className="text-4xl font-black text-white">AI Deals & Promo Codes</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Free trials, exclusive discount codes, and free tiers — all verified and updated daily.
        </p>
      </div>

      {/* Type filter tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {DEAL_TYPES.map(dt => {
          const active = dt.key === type
          return (
            <a key={dt.key} href={`/deals${dt.key === 'all' ? '' : `?type=${dt.key}`}`}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
              style={{
                borderColor: active ? 'rgba(233,69,96,0.4)' : '#1e2a3a',
                background:  active ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.03)',
                color:       active ? '#e94560' : '#94a3b8',
              }}>
              {dt.icon}{dt.label}
            </a>
          )
        })}
      </div>

      {/* Stats bar */}
      <div className="mb-8 flex flex-wrap justify-center gap-6 text-center">
        {[
          { n: PROMOS.length,                                     l:'Total Deals' },
          { n: PROMOS.filter(p=>p.promo_type==='trial').length,   l:'Free Trials' },
          { n: PROMOS.filter(p=>p.promo_code).length,             l:'Promo Codes' },
          { n: PROMOS.filter(p=>p.promo_type==='free_tier').length,l:'Free Tiers'  },
        ].map(s => (
          <div key={s.l} className="rounded-2xl border px-6 py-3 text-center" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.03)'}}>
            <div className="text-2xl font-black text-white">{s.n}</div>
            <div className="text-xs" style={{color:'#64748b'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => <PromoCard key={p.id} promo={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-brand-border py-20 text-center" style={{background:'rgba(255,255,255,0.02)'}}>
          <p className="text-4xl">🎁</p>
          <p className="mt-3 font-semibold text-white">No deals in this category yet</p>
          <p className="mt-1 text-sm text-slate-500">Check back soon — we add new deals daily.</p>
        </div>
      )}

      {/* CTA to submit a promo */}
      <div className="mt-14 rounded-2xl border p-8 text-center" style={{borderColor:'rgba(233,69,96,0.2)',background:'rgba(233,69,96,0.05)'}}>
        <h2 className="text-xl font-bold text-white">Have a deal to share?</h2>
        <p className="mt-2 text-sm text-slate-400">Claim your listing and add your promo code — it&apos;s free.</p>
        <a href="/submit" className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{background:'#e94560'}}>
          Submit Your AI Tool
        </a>
      </div>
    </div>
  )
}
