import Link from 'next/link'
import { ArrowRight, Zap, Star, TrendingUp, Gift, CheckCircle2, Sparkles, SlidersHorizontal, BarChart2, List } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import CategoryGrid from '@/components/listing/CategoryGrid'
import ToolCard from '@/components/listing/ToolCard'
import PromoCard from '@/components/promo/PromoCard'
import { AiTool, Category, Promotion } from '@/types'

const CATEGORIES: Category[] = [
  { id:1,  slug:'chatbot',    name:'Chatbot / Assistant',  icon:'MessageSquare', color:'#6366f1', count:24 },
  { id:2,  slug:'image-gen',  name:'Image Generation',     icon:'Image',         color:'#ec4899', count:18 },
  { id:3,  slug:'video-gen',  name:'Video Generation',     icon:'Video',         color:'#f97316', count:12 },
  { id:4,  slug:'code',       name:'Code Assistant',       icon:'Code2',         color:'#06b6d4', count:15 },
  { id:5,  slug:'writing',    name:'Writing & Copy',       icon:'PenLine',       color:'#10b981', count:21 },
  { id:6,  slug:'audio-gen',  name:'Audio & Music',        icon:'Music',         color:'#8b5cf6', count:9  },
  { id:7,  slug:'seo',        name:'SEO & Marketing',      icon:'TrendingUp',    color:'#f59e0b', count:11 },
  { id:8,  slug:'design',     name:'Design & Creative',    icon:'Palette',       color:'#f43f5e', count:14 },
  { id:9,  slug:'automation', name:'Automation',           icon:'Zap',           color:'#a855f7', count:8  },
  { id:10, slug:'research',   name:'Research',             icon:'BookOpen',      color:'#64748b', count:7  },
  { id:11, slug:'voice',      name:'Voice & Speech',       icon:'Mic',           color:'#14b8a6', count:6  },
  { id:12, slug:'search',     name:'AI Search',            icon:'Search',        color:'#84cc16', count:5  },
]

const TOOLS: AiTool[] = [
  { id:'1', slug:'chatgpt', name:'ChatGPT', tagline:"The world's most popular AI assistant", website:'https://chat.openai.com', category:CATEGORIES[0], pricing_model:'freemium', starting_price:'Free / $20/mo', has_free_trial:true, has_api:true, no_code:true, gdpr_compliant:true, status:'verified', is_featured:true, is_sponsored:false, upvotes:4820, rating_avg:4.7, rating_count:1240, view_count:50000, click_count:20000, platforms:['web','ios','android'], created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'2', slug:'midjourney', name:'Midjourney', tagline:'Create stunning AI art from text prompts', website:'https://midjourney.com', category:CATEGORIES[1], pricing_model:'subscription', starting_price:'$10/mo', has_free_trial:false, has_api:false, no_code:true, gdpr_compliant:false, status:'auto', is_featured:true, is_sponsored:false, upvotes:3910, rating_avg:4.8, rating_count:980, view_count:40000, click_count:18000, platforms:['web'], created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'3', slug:'github-copilot', name:'GitHub Copilot', tagline:'AI pair programmer for every developer', website:'https://github.com/features/copilot', category:CATEGORIES[3], pricing_model:'subscription', starting_price:'$10/mo', has_free_trial:true, trial_duration:'30 days', has_api:false, no_code:false, gdpr_compliant:true, status:'verified', is_featured:false, is_sponsored:false, upvotes:2900, rating_avg:4.6, rating_count:720, view_count:30000, click_count:12000, platforms:['vscode'], promo_code:'COPILOT30', promo_desc:'30-day free trial', created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'4', slug:'cursor', name:'Cursor', tagline:'The AI-first code editor for modern developers', website:'https://cursor.com', category:CATEGORIES[3], pricing_model:'freemium', starting_price:'Free / $20/mo', has_free_trial:true, has_api:false, no_code:false, gdpr_compliant:true, status:'claimed', is_featured:false, is_sponsored:false, upvotes:2340, rating_avg:4.8, rating_count:560, view_count:25000, click_count:11000, platforms:['windows','mac','linux'], created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'5', slug:'elevenlabs', name:'ElevenLabs', tagline:'Generate hyper-realistic AI voices in seconds', website:'https://elevenlabs.io', category:CATEGORIES[10], pricing_model:'freemium', starting_price:'Free / $5/mo', has_free_trial:true, has_api:true, no_code:true, gdpr_compliant:true, status:'verified', is_featured:false, is_sponsored:false, upvotes:1890, rating_avg:4.7, rating_count:430, view_count:20000, click_count:9000, platforms:['web','api'], created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'6', slug:'perplexity', name:'Perplexity AI', tagline:'AI search engine with cited answers', website:'https://perplexity.ai', category:CATEGORIES[11], pricing_model:'freemium', starting_price:'Free / $20/mo', has_free_trial:true, has_api:true, no_code:true, gdpr_compliant:true, status:'claimed', is_featured:false, is_sponsored:false, upvotes:1720, rating_avg:4.5, rating_count:380, view_count:18000, click_count:8000, platforms:['web','ios','android'], created_at:'2024-01-01', updated_at:'2024-01-01' },
]

const PROMOS: Promotion[] = [
  { id:'p1', tool_id:'3', promo_type:'trial', title:'30-Day Free Trial', description:'Try GitHub Copilot free for 30 days — no credit card required.', promo_code:'COPILOT30', discount_pct:0, trial_days:30, valid_until:'2025-12-31', is_verified:true, created_at:'2024-01-01', tool:{ id:'3', name:'GitHub Copilot', slug:'github-copilot', category:CATEGORIES[3] } },
  { id:'p2', tool_id:'5', promo_type:'free_tier', title:'Free Voice Generation', description:'Get 10,000 characters of AI voice generation free every month. No card needed.', promo_code:'', discount_pct:0, trial_days:0, is_verified:true, created_at:'2024-01-01', tool:{ id:'5', name:'ElevenLabs', slug:'elevenlabs', category:CATEGORIES[10] } },
  { id:'p3', tool_id:'4', promo_type:'coupon', title:'20% off Cursor Pro', description:'Demo promo — replace with a real code once you partner with Cursor. Code shown for UI demonstration only.', promo_code:'LISTMYAI20', discount_pct:20, trial_days:0, valid_until:'2025-09-30', is_verified:false, created_at:'2024-01-01', tool:{ id:'4', name:'Cursor', slug:'cursor', category:CATEGORIES[3] } },
]

const STATS = [
  { value:'500+', label:'AI Tools Listed' },
  { value:'50+',  label:'Active Deals' },
  { value:'Free', label:'First 6 Months' },
  { value:'24h',  label:'New Tools Daily' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{background:'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)'}}>
        <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.12) 0%,transparent 70%)'}} />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" style={{background:'rgba(233,69,96,0.07)'}} />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm" style={{borderColor:'rgba(233,69,96,0.25)',background:'rgba(233,69,96,0.1)',color:'#e94560'}}>
            <Sparkles className="h-3.5 w-3.5" />
            500+ AI tools — growing daily
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Discover the Best{' '}
            <span style={{background:'linear-gradient(90deg,#e94560,#f87171)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              AI Tools
            </span>
            {' '}& Deals
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed" style={{color:'#94a3b8'}}>
            The AI tools directory — browse 500+ AI products, compare pricing,
            find free trials, and grab exclusive promo codes. All in one place.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar large placeholder="Search AI tools, categories, use cases…" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs" style={{color:'#475569'}}>Popular:</span>
            {['ChatGPT','Image Generation','Code Assistant','Free AI Tools','AI Writing'].map(s => (
              <Link key={s} href={`/directory?q=${encodeURIComponent(s)}`}
                className="rounded-full px-3 py-1 text-xs transition hover:text-white"
                style={{border:'1px solid #1e2a3a',background:'rgba(255,255,255,0.03)',color:'#94a3b8'}}>
                {s}
              </Link>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{border:'1px solid #1e2a3a',background:'rgba(255,255,255,0.03)'}}>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="mt-1 text-xs" style={{color:'#64748b'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature strip (mirrors listmyai.com) ── */}
      <section className="border-b" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ borderColor: '#1e2a3a' }}>
            {[
              {
                icon: SlidersHorizontal, color: '#6366f1',
                title: 'Find the right AI tool',
                desc: 'Answer 5 quick questions — our recommendation engine returns personalised tool picks for your exact use case.',
                cta: 'Start matching', href: '/find',
              },
              {
                icon: BarChart2, color: '#10b981',
                title: 'Compare side by side',
                desc: 'Instantly compare any two AI tools across features, pricing, and fit — powered by live ListmyAI data.',
                cta: 'Compare tools', href: '/compare',
              },
              {
                icon: List, color: '#e94560',
                title: 'List your AI tool',
                desc: 'Get your tool in front of thousands of users actively searching for AI solutions. First 6 months free.',
                cta: 'Submit a listing', href: '/submit',
              },
            ].map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="flex flex-col gap-4 px-6 py-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${f.color}18` }}>
                    <Icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
                  </div>
                  <Link href={f.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:gap-2.5"
                    style={{ color: f.color }}>
                    {f.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Categories */}
        <section className="py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
              <p className="mt-1 text-sm" style={{color:'#64748b'}}>Find AI tools for every use case</p>
            </div>
            <Link href="/directory" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
              All categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CategoryGrid categories={CATEGORIES} />
        </section>

        {/* Featured Tools */}
        <section className="py-4">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm" style={{color:'#e94560'}}>
                <Zap className="h-4 w-4" /> Featured
              </div>
              <h2 className="text-2xl font-bold text-white">Top AI Tools Right Now</h2>
            </div>
            <Link href="/directory?sort=popular" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>

        {/* Deals Strip */}
        <section className="my-16 rounded-3xl p-8" style={{border:'1px solid rgba(233,69,96,0.2)',background:'linear-gradient(135deg,rgba(233,69,96,0.07) 0%,transparent 100%)'}}>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm" style={{color:'#e94560'}}>
                <Gift className="h-4 w-4" /> Live Deals
              </div>
              <h2 className="text-2xl font-bold text-white">Promo Codes & Free Trials</h2>
              <p className="mt-1 text-sm" style={{color:'#94a3b8'}}>Save money on the AI tools you love</p>
            </div>
            <Link href="/deals" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
              All deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROMOS.map(p => <PromoCard key={p.id} promo={p} />)}
          </div>
        </section>

        {/* Recent */}
        <section className="py-4 pb-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm" style={{color:'#f59e0b'}}>
                <TrendingUp className="h-4 w-4" /> Trending
              </div>
              <h2 className="text-2xl font-bold text-white">Recently Added</h2>
            </div>
            <Link href="/directory?sort=newest" className="flex items-center gap-1 text-sm hover:underline" style={{color:'#e94560'}}>
              See newest <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {[...TOOLS].reverse().slice(0,5).map(tool => <ToolCard key={tool.id} tool={tool} variant="list" />)}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-20 overflow-hidden rounded-3xl relative" style={{background:'linear-gradient(135deg,#0f172a,#0f1e35,#0f172a)',border:'1px solid #1e2a3a'}}>
          <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.1) 0%,transparent 70%)'}} />
          <div className="relative px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{background:'rgba(233,69,96,0.12)',border:'1px solid rgba(233,69,96,0.2)'}}>
              <Star className="h-7 w-7" style={{color:'#e94560'}} />
            </div>
            <h2 className="text-3xl font-black text-white">List Your AI Tool — Free for 6 Months</h2>
            <p className="mx-auto mt-3 max-w-xl" style={{color:'#94a3b8'}}>
              Get your AI product in front of thousands of buyers and researchers.
              Submit your listing today — first 6 months completely free.
            </p>
            <ul className="mx-auto mt-5 mb-8 flex max-w-lg flex-wrap justify-center gap-3 text-sm" style={{color:'#cbd5e1'}}>
              {['No credit card required','Live in minutes','Add promo codes & deals','Verified badge available'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{color:'#e94560'}} />{f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/submit"
                className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{background:'#e94560',boxShadow:'0 0 24px rgba(233,69,96,0.3)'}}>
                Submit Your AI Tool <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/directory"
                className="rounded-xl px-8 py-3.5 text-sm transition hover:text-white"
                style={{border:'1px solid #1e2a3a',color:'#94a3b8'}}>
                Browse the Directory
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
