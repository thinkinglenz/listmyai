import { Suspense } from 'react'
import SearchBar from '@/components/search/SearchBar'
import FilterSidebar from '@/components/search/FilterSidebar'
import ToolCard from '@/components/listing/ToolCard'
import { AiTool, Category } from '@/types'
import { LayoutGrid, List } from 'lucide-react'

// Seed data — replace with Supabase queries
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

const ALL_TOOLS: AiTool[] = [
  { id:'1',  slug:'chatgpt',       name:'ChatGPT',       tagline:"The world's most popular AI assistant",      website:'https://chat.openai.com',       category:CATEGORIES[0], pricing_model:'freemium',    starting_price:'Free / $20/mo', has_free_trial:true,  has_api:true,  no_code:true,  gdpr_compliant:true,  status:'verified', is_featured:true,  is_sponsored:false, upvotes:4820, rating_avg:4.7, rating_count:1240, view_count:50000, click_count:20000, platforms:['web','ios','android'], created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'2',  slug:'claude',        name:'Claude',        tagline:'AI assistant built for safety and reasoning', website:'https://claude.ai',             category:CATEGORIES[0], pricing_model:'freemium',    starting_price:'Free / $20/mo', has_free_trial:true,  has_api:true,  no_code:true,  gdpr_compliant:true,  status:'verified', is_featured:true,  is_sponsored:false, upvotes:3200, rating_avg:4.8, rating_count:890,  view_count:38000, click_count:16000, platforms:['web','ios','android'], created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'3',  slug:'midjourney',    name:'Midjourney',    tagline:'Create stunning AI art from text prompts',    website:'https://midjourney.com',        category:CATEGORIES[1], pricing_model:'subscription', starting_price:'$10/mo',        has_free_trial:false, has_api:false, no_code:true,  gdpr_compliant:false, status:'auto',     is_featured:true,  is_sponsored:false, upvotes:3910, rating_avg:4.8, rating_count:980,  view_count:40000, click_count:18000, platforms:['web'],                  created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'4',  slug:'github-copilot',name:'GitHub Copilot',tagline:'AI pair programmer for every developer',     website:'https://github.com/features/copilot', category:CATEGORIES[3], pricing_model:'subscription', starting_price:'$10/mo', has_free_trial:true, has_api:false, no_code:false, gdpr_compliant:true, status:'verified', is_featured:false, is_sponsored:false, upvotes:2900, rating_avg:4.6, rating_count:720, view_count:30000, click_count:12000, platforms:['vscode'], promo_code:'COPILOT30', promo_desc:'30-day free trial', created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'5',  slug:'cursor',        name:'Cursor',        tagline:'The AI-first code editor',                   website:'https://cursor.com',             category:CATEGORIES[3], pricing_model:'freemium',    starting_price:'Free / $20/mo', has_free_trial:true,  has_api:false, no_code:false, gdpr_compliant:true,  status:'claimed',  is_featured:false, is_sponsored:false, upvotes:2340, rating_avg:4.8, rating_count:560,  view_count:25000, click_count:11000, platforms:['windows','mac','linux'],created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'6',  slug:'elevenlabs',    name:'ElevenLabs',    tagline:'Hyper-realistic AI voice generation',         website:'https://elevenlabs.io',          category:CATEGORIES[10],pricing_model:'freemium',    starting_price:'Free / $5/mo',  has_free_trial:true,  has_api:true,  no_code:true,  gdpr_compliant:true,  status:'verified', is_featured:false, is_sponsored:false, upvotes:1890, rating_avg:4.7, rating_count:430,  view_count:20000, click_count:9000,  platforms:['web','api'],            created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'7',  slug:'perplexity',    name:'Perplexity AI', tagline:'AI search engine with cited answers',         website:'https://perplexity.ai',          category:CATEGORIES[11],pricing_model:'freemium',    starting_price:'Free / $20/mo', has_free_trial:true,  has_api:true,  no_code:true,  gdpr_compliant:true,  status:'claimed',  is_featured:false, is_sponsored:false, upvotes:1720, rating_avg:4.5, rating_count:380,  view_count:18000, click_count:8000,  platforms:['web','ios','android'],  created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'8',  slug:'jasper',        name:'Jasper',        tagline:'AI writing for marketing teams',              website:'https://jasper.ai',              category:CATEGORIES[4], pricing_model:'subscription', starting_price:'$39/mo',        has_free_trial:true,  has_api:true,  no_code:true,  gdpr_compliant:true,  status:'claimed',  is_featured:false, is_sponsored:false, upvotes:980,  rating_avg:4.3, rating_count:290,  view_count:12000, click_count:5000,  platforms:['web'],                  created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'9',  slug:'runway',        name:'Runway ML',     tagline:'AI video generation for creatives',           website:'https://runwayml.com',           category:CATEGORIES[2], pricing_model:'freemium',    starting_price:'Free / $15/mo', has_free_trial:true,  has_api:true,  no_code:true,  gdpr_compliant:true,  status:'verified', is_featured:false, is_sponsored:false, upvotes:1540, rating_avg:4.5, rating_count:310,  view_count:16000, click_count:7000,  platforms:['web','api'],            created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'10', slug:'stable-diffusion',name:'Stable Diffusion',tagline:'Open-source AI image generation',       website:'https://stability.ai',          category:CATEGORIES[1], pricing_model:'free',         starting_price:'Free',          has_free_trial:true,  has_api:true,  no_code:false, gdpr_compliant:true,  status:'auto',     is_featured:false, is_sponsored:false, upvotes:2100, rating_avg:4.4, rating_count:520,  view_count:22000, click_count:10000, platforms:['web','api','linux'],    created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'11', slug:'suno',          name:'Suno',          tagline:'Create songs with AI in seconds',            website:'https://suno.com',               category:CATEGORIES[5], pricing_model:'freemium',    starting_price:'Free / $8/mo',  has_free_trial:true,  has_api:false, no_code:true,  gdpr_compliant:false, status:'auto',     is_featured:false, is_sponsored:false, upvotes:1230, rating_avg:4.6, rating_count:270,  view_count:13000, click_count:6000,  platforms:['web'],                  created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'12', slug:'synthesia',     name:'Synthesia',     tagline:'AI avatar videos from text scripts',         website:'https://synthesia.io',           category:CATEGORIES[2], pricing_model:'subscription', starting_price:'$22/mo',        has_free_trial:true,  has_api:false, no_code:true,  gdpr_compliant:true,  status:'claimed',  is_featured:false, is_sponsored:false, upvotes:870,  rating_avg:4.4, rating_count:210,  view_count:10000, click_count:4500,  platforms:['web'],                  created_at:'2024-01-01', updated_at:'2024-01-01' },
]

interface Props {
  searchParams: Promise<{ q?: string; category?: string; pricing?: string; sort?: string; trial?: string; api?: string; promo?: string }>
}

export default async function DirectoryPage({ searchParams }: Props) {
  const sp = await searchParams
  const q        = sp.q?.toLowerCase() ?? ''
  const category = sp.category ?? ''
  const pricing  = sp.pricing ?? ''
  const sort     = sp.sort ?? 'popular'
  const trial    = sp.trial === '1'
  const api      = sp.api === '1'
  const promo    = sp.promo === '1'

  let tools = ALL_TOOLS.filter(t => {
    if (q && !t.name.toLowerCase().includes(q) && !t.tagline?.toLowerCase().includes(q)) return false
    if (category && t.category?.slug !== category) return false
    if (pricing && t.pricing_model !== pricing) return false
    if (trial && !t.has_free_trial) return false
    if (api && !t.has_api) return false
    if (promo && !t.promo_code) return false
    return true
  })

  tools = [...tools].sort((a, b) => {
    if (sort === 'popular') return b.upvotes - a.upvotes
    if (sort === 'rating')  return b.rating_avg - a.rating_avg
    if (sort === 'name')    return a.name.localeCompare(b.name)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">AI Tools Directory</h1>
        <p className="mt-1 text-slate-400">Discover and compare {ALL_TOOLS.length}+ AI tools</p>
        <div className="mt-4 max-w-xl">
          <Suspense>
            <SearchBar defaultValue={q} />
          </Suspense>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <Suspense>
          <FilterSidebar categories={CATEGORIES} />
        </Suspense>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">{tools.length}</span> tools found
              {q && <span> for &ldquo;<span className="text-brand-red">{q}</span>&rdquo;</span>}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-brand-border p-1">
              <button className="rounded-md p-1.5 bg-white/5 text-white">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-slate-500 hover:text-white">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {tools.length === 0 ? (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-12 text-center">
              <p className="text-2xl">🤔</p>
              <p className="mt-2 font-semibold text-white">No tools found</p>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
