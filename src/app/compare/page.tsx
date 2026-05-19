'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, X, Star, Check, Minus, ArrowRight, RefreshCw, Zap } from 'lucide-react'

// ─── Mock tool data ────────────────────────────────────────────────────────────
interface Tool {
  slug: string
  name: string
  tagline: string
  category: string
  pricing: string
  pricingFree: boolean
  rating: number
  ratingCount: number
  upvotes: number
  api: boolean
  mobile: boolean
  teams: boolean
  offline: boolean
  openSource: boolean
  pros: string[]
  cons: string[]
  useCases: string[]
  website: string
}

const TOOLS: Tool[] = [
  {
    slug: 'github-copilot', name: 'GitHub Copilot', tagline: 'AI pair programmer for VS Code',
    category: 'Code Generation', pricing: '$10/mo (free for students)', pricingFree: true,
    rating: 4.7, ratingCount: 720, upvotes: 1420, api: true, mobile: false, teams: true, offline: false, openSource: false,
    pros: ['Excellent inline code completion', 'Understands full repo context', 'Supports 20+ languages', 'GitHub integration'],
    cons: ['Requires internet connection', 'Can suggest insecure code', 'Expensive for large teams'],
    useCases: ['Code autocompletion', 'Unit test generation', 'Documentation writing', 'Boilerplate generation'],
    website: 'github.com/features/copilot',
  },
  {
    slug: 'chatgpt', name: 'ChatGPT', tagline: 'OpenAI\'s flagship general-purpose AI',
    category: 'General AI', pricing: 'Free / $20 mo (Plus)', pricingFree: true,
    rating: 4.8, ratingCount: 3400, upvotes: 3200, api: true, mobile: true, teams: true, offline: false, openSource: false,
    pros: ['Extremely versatile', 'Largest plugin ecosystem', 'Great for non-technical users', 'Web browsing on Plus'],
    cons: ['Can hallucinate facts', 'Free tier has limits', 'Context window not always enough'],
    useCases: ['Writing & editing', 'Research & summaries', 'Code assistance', 'Customer support drafts'],
    website: 'chat.openai.com',
  },
  {
    slug: 'claude', name: 'Claude', tagline: 'Anthropic\'s safety-focused AI assistant',
    category: 'General AI', pricing: 'Free / $20 mo (Pro)', pricingFree: true,
    rating: 4.8, ratingCount: 2100, upvotes: 2800, api: true, mobile: true, teams: true, offline: false, openSource: false,
    pros: ['200K token context window', 'Excellent at long documents', 'Strong reasoning', 'Refuses harmful requests well'],
    cons: ['No image generation', 'Fewer integrations than GPT-4', 'Sometimes overly cautious'],
    useCases: ['Long-form writing', 'Document analysis', 'Coding', 'Research'],
    website: 'claude.ai',
  },
  {
    slug: 'midjourney', name: 'Midjourney', tagline: 'Best-in-class AI image generation',
    category: 'Image Generation', pricing: '$10–$60/mo', pricingFree: false,
    rating: 4.9, ratingCount: 1800, upvotes: 2890, api: false, mobile: false, teams: true, offline: false, openSource: false,
    pros: ['Highest quality artistic images', 'Strong community', 'Fast generation', 'Consistent style control'],
    cons: ['Discord-only interface', 'No free tier', 'No API access', 'Images default to public'],
    useCases: ['Digital art', 'Marketing visuals', 'Concept art', 'Social media content'],
    website: 'midjourney.com',
  },
  {
    slug: 'cursor', name: 'Cursor', tagline: 'The AI-first code editor',
    category: 'Code Generation', pricing: 'Free / $20 mo (Pro)', pricingFree: true,
    rating: 4.7, ratingCount: 890, upvotes: 1200, api: false, mobile: false, teams: true, offline: false, openSource: false,
    pros: ['Full VS Code compatibility', 'Chat with your codebase', 'Multi-file edits', 'Uses GPT-4 & Claude'],
    cons: ['Relatively new product', 'Can be resource heavy', 'Privacy concerns with code upload'],
    useCases: ['Full-stack development', 'Code refactoring', 'Bug fixing', 'Codebase exploration'],
    website: 'cursor.sh',
  },
  {
    slug: 'perplexity-ai', name: 'Perplexity AI', tagline: 'AI search engine with cited sources',
    category: 'Research', pricing: 'Free / $20 mo (Pro)', pricingFree: true,
    rating: 4.6, ratingCount: 1100, upvotes: 1600, api: true, mobile: true, teams: false, offline: false, openSource: false,
    pros: ['Real-time web search', 'Cited sources always shown', 'Great for research', 'Fast answers'],
    cons: ['Not ideal for creative writing', 'Pro features locked behind paywall', 'Sources can be low quality'],
    useCases: ['Research & fact-checking', 'News summaries', 'Academic research', 'Competitive intel'],
    website: 'perplexity.ai',
  },
]

const FEATURE_ROWS = [
  { label: 'Free plan', key: 'pricingFree' as const, type: 'bool' },
  { label: 'Mobile app', key: 'mobile' as const, type: 'bool' },
  { label: 'API access', key: 'api' as const, type: 'bool' },
  { label: 'Team / collaboration', key: 'teams' as const, type: 'bool' },
  { label: 'Works offline', key: 'offline' as const, type: 'bool' },
  { label: 'Open source', key: 'openSource' as const, type: 'bool' },
]

export default function ComparePage() {
  const [search, setSearch] = useState('')
  const [slotA, setSlotA] = useState<Tool | null>(TOOLS[0])
  const [slotB, setSlotB] = useState<Tool | null>(TOOLS[1])
  const [pickingSlot, setPickingSlot] = useState<'A' | 'B' | null>(null)

  const filtered = TOOLS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  function pick(tool: Tool) {
    if (pickingSlot === 'A') setSlotA(tool)
    else setSlotB(tool)
    setPickingSlot(null)
    setSearch('')
  }

  function renderBool(val: boolean) {
    return val
      ? <Check className="h-5 w-5 mx-auto text-emerald-400" />
      : <Minus className="h-5 w-5 mx-auto text-slate-700" />
  }

  const comparing = slotA && slotB

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4" style={{ borderColor: '#1e2a3a' }}>
        <Link href="/" className="text-sm font-bold" style={{ color: '#e94560' }}>← ListmyAI</Link>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white">Compare AI Tools</h1>
          <p className="mt-2 text-slate-500">Side-by-side comparison powered by ListmyAI data</p>
        </div>

        {/* Tool selectors */}
        <div className="mb-8 grid grid-cols-2 gap-4 relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-10">
            <span className="rounded-full border px-3 py-1 text-xs font-bold text-slate-400"
              style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
              VS
            </span>
          </div>

          {(['A', 'B'] as const).map(slot => {
            const tool = slot === 'A' ? slotA : slotB
            return (
              <div key={slot}>
                <button
                  onClick={() => setPickingSlot(pickingSlot === slot ? null : slot)}
                  className="w-full rounded-2xl border p-4 text-left transition hover:border-red-500/40"
                  style={{
                    borderColor: pickingSlot === slot ? 'rgba(233,69,96,0.5)' : '#1e2a3a',
                    background: '#161b27',
                  }}>
                  {tool ? (
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white">{tool.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{tool.category}</p>
                        </div>
                        <span className="text-xs text-slate-600">Change ↓</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(tool.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">{tool.rating} ({tool.ratingCount})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-2xl">+</span>
                      <span className="text-sm">Select a tool</span>
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                {pickingSlot === slot && (
                  <div className="absolute z-30 mt-2 w-72 rounded-2xl border p-2 shadow-2xl"
                    style={{ borderColor: '#1e2a3a', background: '#161b27', [slot === 'A' ? 'left' : 'right']: 0 }}>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search tools…" autoFocus
                        className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none"
                        style={{ borderColor: '#1e2a3a', background: '#0d1117' }}
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {filtered.map(t => (
                        <button key={t.slug} onClick={() => pick(t)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5">
                          <div>
                            <p className="font-semibold text-white">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.category}</p>
                          </div>
                        </button>
                      ))}
                      {filtered.length === 0 && <p className="py-4 text-center text-xs text-slate-500">No tools found</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {comparing && (
          <div className="space-y-6">
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-4">
              {[slotA, slotB].map(tool => (
                <div key={tool!.slug} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <h3 className="font-bold text-white mb-0.5">{tool!.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{tool!.tagline}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category</span>
                      <span className="text-slate-300">{tool!.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pricing</span>
                      <span className="text-slate-300">{tool!.pricing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rating</span>
                      <span className="text-amber-400">★ {tool!.rating} ({tool!.ratingCount})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Upvotes</span>
                      <span className="text-slate-300">{tool!.upvotes.toLocaleString()}</span>
                    </div>
                  </div>
                  <Link href={`/tools/${tool!.slug}`}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold text-slate-300 transition hover:text-white"
                    style={{ borderColor: '#1e2a3a' }}>
                    View full listing <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Feature table */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="grid grid-cols-3 border-b px-5 py-3" style={{ borderColor: '#1e2a3a' }}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Feature</p>
                <p className="text-center text-xs font-bold text-white">{slotA.name}</p>
                <p className="text-center text-xs font-bold text-white">{slotB.name}</p>
              </div>
              <div className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {FEATURE_ROWS.map(row => (
                  <div key={row.key} className="grid grid-cols-3 items-center px-5 py-3">
                    <p className="text-sm text-slate-400">{row.label}</p>
                    <div className="text-center">{renderBool(slotA[row.key] as boolean)}</div>
                    <div className="text-center">{renderBool(slotB[row.key] as boolean)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pros & cons */}
            <div className="grid grid-cols-2 gap-4">
              {[slotA, slotB].map(tool => (
                <div key={tool!.slug} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <h4 className="font-bold text-white mb-3">{tool!.name}</h4>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wide">Pros</p>
                    <ul className="space-y-1.5">
                      {tool!.pros.map(p => (
                        <li key={p} className="flex items-start gap-2 text-xs text-slate-400">
                          <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-400" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Cons</p>
                    <ul className="space-y-1.5">
                      {tool!.cons.map(c => (
                        <li key={c} className="flex items-start gap-2 text-xs text-slate-400">
                          <X className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-400" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Use cases */}
            <div className="grid grid-cols-2 gap-4">
              {[slotA, slotB].map(tool => (
                <div key={tool!.slug} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Best for</p>
                  <div className="flex flex-wrap gap-2">
                    {tool!.useCases.map(u => (
                      <span key={u} className="rounded-full border px-3 py-1 text-xs text-slate-400"
                        style={{ borderColor: '#1e2a3a' }}>{u}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* AI verdict */}
            <div className="rounded-2xl border p-6" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4" style={{ color: '#e94560' }} />
                <p className="font-bold text-white">ListmyAI Verdict</p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">{slotA.rating >= slotB.rating ? slotA.name : slotB.name}</strong> edges ahead on community rating
                ({Math.max(slotA.rating, slotB.rating)} vs {Math.min(slotA.rating, slotB.rating)} ★).
                Choose <strong className="text-white">{slotA.name}</strong> if you need {slotA.useCases[0].toLowerCase()} — it excels with {slotA.pros[0].toLowerCase()}.
                Choose <strong className="text-white">{slotB.name}</strong> for {slotB.useCases[0].toLowerCase()} — especially valued for {slotB.pros[0].toLowerCase()}.
                Both have strong communities and active development.
              </p>
            </div>
          </div>
        )}

        {!comparing && (
          <div className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
            style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
            <p className="text-slate-500 text-sm mb-2">Select two tools above to compare them</p>
            <Link href="/directory" className="text-sm hover:underline" style={{ color: '#e94560' }}>
              Browse all tools →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
