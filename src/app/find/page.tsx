'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Sparkles, ExternalLink, RefreshCw, Loader2, Zap } from 'lucide-react'

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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Recommendation {
  slug: string
  name: string
  reason: string
  fit_percent: number
  highlight: string
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FindPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Recommendation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const q = QUESTIONS[step]
  const progress = (step / QUESTIONS.length) * 100

  async function select(value: string) {
    const updated = { ...answers, [q.id]: value }
    setAnswers(updated)

    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      // Last answer — call Claude API
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/find', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ answers: updated }),
        })
        const json = await res.json()
        if (!res.ok || json.error) {
          setError(json.error ?? 'Something went wrong. Please try again.')
        } else {
          setResults(json.recommendations)
        }
      } catch {
        setError('Network error. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setResults(null)
    setError(null)
    setLoading(false)
  }

  const isDone = results !== null || loading || error !== null

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
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Tool Finder — Free
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Find the right AI tool<br />
            <span style={{ background: 'linear-gradient(90deg,#e94560,#f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              for your exact use case
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Answer {QUESTIONS.length} quick questions and our AI matches you with the best tools — with personalised reasons why each one fits <em>you</em>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
            {['Takes 60 seconds', 'No sign-up required', 'Powered by Claude AI'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span style={{ color: '#e94560' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {!isDone ? (
          <>
            {/* Progress bar */}
            <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
              <span>Question {step + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}% done</span>
            </div>
            <div className="mb-8 h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: '#e94560' }} />
            </div>

            {/* Question card */}
            <div className="rounded-2xl border p-8" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <h2 className="mb-6 text-xl font-bold text-white text-center">{q.question}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        ) : loading ? (
          /* Loading state */
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(233,69,96,0.12)' }}>
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#e94560' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Finding your perfect tools…</h2>
            <p className="text-slate-500 text-sm">Our AI is analysing your answers and matching them against our database</p>
            <div className="mt-6 flex justify-center gap-6 text-xs text-slate-600">
              {['Analysing answers', 'Scanning tool database', 'Generating matches'].map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3" style={{ color: i === 0 ? '#e94560' : '#334155' }} />
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : error ? (
          /* Error state */
          <div className="rounded-2xl border p-10 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : results && results.length > 0 ? (
          <>
            {/* Results */}
            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(233,69,96,0.15)' }}>
                <Sparkles className="h-6 w-6" style={{ color: '#e94560' }} />
              </div>
              <h1 className="text-3xl font-black text-white">Your top matches</h1>
              <p className="mt-2 text-slate-500">AI-curated picks based on your answers</p>
            </div>

            <div className="space-y-4 mb-8">
              {results.map((tool, i) => (
                <div key={`${tool.slug}-${i}`}
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
                        <span className="text-xs text-slate-500">#{i + 1}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">{tool.highlight}</p>
                    </div>
                    {/* Fit meter */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-black" style={{ color: '#e94560' }}>{tool.fit_percent}%</div>
                      <div className="text-[10px] text-slate-600 uppercase tracking-wider">match</div>
                    </div>
                  </div>

                  {/* Fit bar */}
                  <div className="mb-3 h-1 w-full rounded-full overflow-hidden" style={{ background: '#1e2a3a' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${tool.fit_percent}%`, background: i === 0 ? '#e94560' : '#334155' }} />
                  </div>

                  <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs text-slate-400">
                      <span className="text-emerald-400 font-semibold">Why this fits you: </span>
                      {tool.reason}
                    </p>
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
                Browse all AI tools in directory →
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
