'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Sparkles, ExternalLink, Star, RefreshCw } from 'lucide-react'

// ─── Questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'goal',
    question: 'What do you primarily want to do?',
    options: [
      { label: 'Write content', value: 'writing', emoji: '✍️' },
      { label: 'Generate images or video', value: 'creative', emoji: '🎨' },
      { label: 'Write or review code', value: 'coding', emoji: '💻' },
      { label: 'Analyse data or research', value: 'data', emoji: '📊' },
      { label: 'Automate tasks & workflows', value: 'automation', emoji: '⚡' },
      { label: 'Chat / general assistant', value: 'chat', emoji: '💬' },
    ],
  },
  {
    id: 'who',
    question: 'Who is this for?',
    options: [
      { label: 'Just me (personal use)', value: 'personal', emoji: '🙋' },
      { label: 'My small team', value: 'team', emoji: '👥' },
      { label: 'A business or startup', value: 'business', emoji: '🏢' },
      { label: 'Students or learning', value: 'education', emoji: '🎓' },
    ],
  },
  {
    id: 'budget',
    question: "What's your monthly budget?",
    options: [
      { label: 'Free only', value: 'free', emoji: '🆓' },
      { label: 'Up to $20/mo', value: 'low', emoji: '💵' },
      { label: '$20–$100/mo', value: 'mid', emoji: '💰' },
      { label: 'No limit / enterprise', value: 'high', emoji: '🏦' },
    ],
  },
  {
    id: 'skill',
    question: 'How technical are you?',
    options: [
      { label: 'Non-technical — I just need it to work', value: 'beginner', emoji: '😊' },
      { label: 'Comfortable with tools & settings', value: 'intermediate', emoji: '🛠️' },
      { label: 'Developer / can use APIs', value: 'advanced', emoji: '🤖' },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most to you?',
    options: [
      { label: 'Ease of use', value: 'ease', emoji: '🎯' },
      { label: 'Output quality', value: 'quality', emoji: '⭐' },
      { label: 'Speed', value: 'speed', emoji: '🚀' },
      { label: 'Privacy / runs locally', value: 'privacy', emoji: '🔒' },
      { label: 'Integrations & API', value: 'integrations', emoji: '🔗' },
    ],
  },
]

// ─── Mock recommendation engine ───────────────────────────────────────────────
interface Recommendation {
  name: string
  slug: string
  tagline: string
  category: string
  pricing: string
  rating: number
  why: string
  badge?: string
}

function getRecommendations(answers: Record<string, string>): Recommendation[] {
  const { goal, budget, skill } = answers

  const pool: Recommendation[] = [
    { name: 'ChatGPT', slug: 'chatgpt', tagline: 'The world\'s most versatile AI assistant', category: 'General AI', pricing: 'Free / $20 mo', rating: 4.8, why: 'Best all-around assistant for writing, Q&A, and brainstorming.', badge: '🏆 Most Popular' },
    { name: 'GitHub Copilot', slug: 'github-copilot', tagline: 'AI pair programmer for VS Code and JetBrains', category: 'Code Generation', pricing: '$10/mo', rating: 4.7, why: 'Industry-leading code completion and generation directly in your editor.' },
    { name: 'Midjourney', slug: 'midjourney', tagline: 'Stunning AI image generation via Discord', category: 'Image Generation', pricing: '$10/mo', rating: 4.9, why: 'Produces the highest quality artistic images of any AI tool.', badge: '🎨 Best Quality' },
    { name: 'Claude', slug: 'claude', tagline: 'Anthropic\'s thoughtful, safety-focused assistant', category: 'General AI', pricing: 'Free / $20 mo', rating: 4.8, why: 'Exceptional for long documents, analysis, and nuanced writing.' },
    { name: 'Notion AI', slug: 'notion-ai', tagline: 'AI built into the notes and docs you already use', category: 'Productivity', pricing: '$10/mo add-on', rating: 4.5, why: 'Perfect if your team already uses Notion for docs and project management.' },
    { name: 'Perplexity AI', slug: 'perplexity-ai', tagline: 'AI-powered search with cited sources', category: 'Research', pricing: 'Free / $20 mo', rating: 4.6, why: 'Best for research — gives answers with real-time web citations.', badge: '🔍 Best for Research' },
    { name: 'Runway ML', slug: 'runway-ml', tagline: 'Professional AI video generation and editing', category: 'Video Generation', pricing: '$15/mo', rating: 4.6, why: 'Leading platform for AI video generation and creative editing.' },
    { name: 'Zapier AI', slug: 'zapier-ai', tagline: 'Automate anything with AI-powered workflows', category: 'Automation', pricing: 'Free / $19 mo', rating: 4.5, why: 'Connect thousands of apps and automate repetitive tasks without code.' },
    { name: 'Notion AI', slug: 'notion-ai', tagline: 'AI writing assistant built into Notion', category: 'Productivity', pricing: '$10 mo add-on', rating: 4.5, why: 'Perfect if your team already uses Notion — AI directly inside your docs.' },
    { name: 'Cursor', slug: 'cursor', tagline: 'The AI-first code editor', category: 'Code Generation', pricing: 'Free / $20 mo', rating: 4.7, why: 'Purpose-built AI code editor with deep codebase understanding.', badge: '🚀 Rising Fast' },
  ]

  // Score each tool by how well it matches
  function score(t: Recommendation): number {
    let s = 0
    if (goal === 'coding' && (t.category === 'Code Generation')) s += 3
    if (goal === 'creative' && (t.category === 'Image Generation' || t.category === 'Video Generation')) s += 3
    if (goal === 'writing' && (t.category === 'General AI' || t.name === 'Notion AI')) s += 3
    if (goal === 'data' && (t.name === 'Perplexity AI' || t.name === 'ChatGPT')) s += 2
    if (goal === 'automation' && t.category === 'Automation') s += 3
    if (goal === 'chat' && t.category === 'General AI') s += 2

    if (budget === 'free' && t.pricing.includes('Free')) s += 2
    if (budget === 'low' && (t.pricing.includes('Free') || t.pricing.includes('$10') || t.pricing.includes('$16') || t.pricing.includes('$19') || t.pricing.includes('$20'))) s += 1
    if (budget === 'high') s += 1

    if (skill === 'beginner' && (t.name === 'ChatGPT' || t.name === 'Notion AI' || t.name === 'Otter.ai')) s += 1
    if (skill === 'advanced' && (t.name === 'Cursor' || t.name === 'GitHub Copilot' || t.name === 'Zapier AI')) s += 1

    s += t.rating / 5
    return s
  }

  return pool.sort((a, b) => score(b) - score(a)).slice(0, 4)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FindPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const q = QUESTIONS[step]
  const progress = ((step) / QUESTIONS.length) * 100

  function select(value: string) {
    const updated = { ...answers, [q.id]: value }
    setAnswers(updated)
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      setDone(true)
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setDone(false)
  }

  const results = done ? getRecommendations(answers) : []

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: '#1e2a3a', background: 'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(233,69,96,0.14) 0%,transparent 70%)' }} />
        <nav className="relative flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-bold" style={{ color: '#e94560' }}>← ListmyAI</Link>
          <Link href="/directory" className="text-sm text-slate-500 hover:text-white transition">Browse all tools</Link>
        </nav>
        <div className="relative mx-auto max-w-3xl px-4 pb-14 pt-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
            <Sparkles className="h-3.5 w-3.5" /> AI Tool Finder — Free
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Find the right AI tool<br />
            <span style={{ background: 'linear-gradient(90deg,#e94560,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              for your exact use case
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Our intelligent recommendation engine asks {QUESTIONS.length} quick questions and returns personalised tool picks — with reasons why each one fits <em>you</em>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
            {['Takes 60 seconds', 'No sign-up required', '1,000+ tools evaluated'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span style={{ color: '#e94560' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {!done ? (
          <>
            {/* Header */}
            <div className="mb-6 text-center">
              <p className="text-slate-500 text-sm">Answer the questions below — we&apos;ll match you instantly</p>
            </div>

            {/* Progress bar */}
            <div className="mb-8 h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: '#e94560' }} />
            </div>

            {/* Step counter */}
            <p className="mb-4 text-xs text-slate-600 text-center">
              Question {step + 1} of {QUESTIONS.length}
            </p>

            {/* Question card */}
            <div className="rounded-2xl border p-8" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <h2 className="mb-6 text-xl font-bold text-white text-center">{q.question}</h2>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map(opt => (
                  <button key={opt.value} onClick={() => select(opt.value)}
                    className="flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition hover:border-red-500/40 hover:bg-red-500/5"
                    style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)', color: '#e2e8f0' }}>
                    <span className="text-xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Back */}
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(233,69,96,0.15)' }}>
                <Sparkles className="h-6 w-6" style={{ color: '#e94560' }} />
              </div>
              <h1 className="text-3xl font-black text-white">Your top matches</h1>
              <p className="mt-2 text-slate-500">Based on your answers, here are the best AI tools for you</p>
            </div>

            <div className="space-y-4 mb-8">
              {results.map((tool, i) => (
                <div key={tool.slug}
                  className="rounded-2xl border p-5 transition hover:border-red-500/30"
                  style={{ borderColor: i === 0 ? 'rgba(233,69,96,0.3)' : '#1e2a3a', background: '#161b27' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {i === 0 && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: '#e94560' }}>
                            #1 PICK
                          </span>
                        )}
                        {tool.badge && (
                          <span className="text-xs text-slate-400">{tool.badge}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                      <p className="text-sm text-slate-500">{tool.tagline}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-white">{tool.pricing}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-slate-400">{tool.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs text-slate-400"><span className="text-emerald-400 font-semibold">Why this fits you: </span>{tool.why}</p>
                  </div>
                  <Link href={`/tools/${tool.slug}`}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{ background: i === 0 ? '#e94560' : '#1e2a3a' }}>
                    View {tool.name} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button onClick={reset}
                className="flex items-center gap-2 text-sm text-slate-500 transition hover:text-white">
                <RefreshCw className="h-4 w-4" /> Start over with different answers
              </button>
              <Link href="/directory" className="text-sm hover:underline" style={{ color: '#e94560' }}>
                Browse all {'>'}1,000 AI tools →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
