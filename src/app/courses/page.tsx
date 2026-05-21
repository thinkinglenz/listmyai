import Link from 'next/link'
import { Star, Users, PlayCircle, BookOpen, Zap, CheckCircle, Clock } from 'lucide-react'

export const metadata = {
  title: 'AI Courses & Resources — ListmyAI',
  description: 'Learn how to master AI tools with our curated courses, guides, and resources. From beginner to expert — start building with AI today.',
}

const COURSES = [
  {
    id: 1,
    title: 'The Complete AI Tools Masterclass',
    subtitle: 'From zero to productive with ChatGPT, Midjourney, Claude & more',
    price: '$47',
    originalPrice: '$97',
    badge: '🔥 Bestseller',
    rating: 4.9,
    students: '2,400+',
    duration: '6 hours',
    lessons: 42,
    level: 'Beginner → Intermediate',
    includes: [
      'ChatGPT prompt engineering from scratch',
      'Image generation with Midjourney & DALL-E',
      'AI writing workflows for content creators',
      'Automation with Zapier AI & Make',
      'Building an AI-powered side hustle',
      'Lifetime access + future updates',
    ],
    gumroadUrl: null,
    image: null,
    color: '#e94560',
  },
  {
    id: 2,
    title: 'AI for Founders & Marketers',
    subtitle: 'Cut your content & research time by 80% using AI tools',
    price: '$37',
    originalPrice: '$77',
    badge: '⚡ New',
    rating: 4.8,
    students: '890+',
    duration: '4 hours',
    lessons: 28,
    level: 'Intermediate',
    includes: [
      'AI-powered SEO content strategy',
      'Automating social media with AI',
      'Market research in minutes (not weeks)',
      'Email sequences written by AI',
      'Competitor analysis on autopilot',
      'Real campaign templates included',
    ],
    gumroadUrl: null,
    image: null,
    color: '#6366f1',
  },
  {
    id: 3,
    title: 'AI Coding Accelerator',
    subtitle: 'Build 10x faster with GitHub Copilot, Cursor & Claude',
    price: '$57',
    originalPrice: '$117',
    badge: '👨‍💻 Developer',
    rating: 4.9,
    students: '1,100+',
    duration: '8 hours',
    lessons: 55,
    level: 'Intermediate → Advanced',
    includes: [
      'Cursor & GitHub Copilot deep dives',
      'Prompt patterns for senior-level code',
      'AI-assisted debugging & refactoring',
      'Building full features with Claude',
      'Test generation & code review automation',
      'Real project walkthroughs (React + Next.js)',
    ],
    gumroadUrl: null,
    image: null,
    color: '#10b981',
  },
]

const FREE_RESOURCES = [
  { title: 'The 50 Best AI Prompts for 2025', href: '/blog', type: 'Guide' },
  { title: 'ChatGPT vs Claude vs Gemini: Full Comparison', href: '/compare', type: 'Comparison' },
  { title: 'AI Tools for Beginners: Where to Start', href: '/find', type: 'Quiz' },
  { title: 'How to Build an AI Workflow in 30 Minutes', href: '/blog', type: 'Tutorial' },
]

export default function CoursesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: '#1e2a3a', background: 'linear-gradient(135deg,#0f172a 0%,#0d1b2e 50%,#0f172a 100%)' }}>
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.12) 0%,transparent 70%)' }} />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>
            <BookOpen className="h-3.5 w-3.5" /> AI Courses & Resources
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Master AI tools.<br />
            <span style={{ background: 'linear-gradient(90deg,#818cf8,#e94560)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Work 10× faster.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-slate-400">
            Practical, no-fluff courses that teach you to use AI tools for real work — not just toy demos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
            {['Self-paced', 'Lifetime access', 'Instant download', 'Money-back guarantee'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="space-y-8">
          {COURSES.map((course, i) => (
            <div key={course.id}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: i === 0 ? 'rgba(233,69,96,0.3)' : '#1e2a3a', background: '#161b27' }}>
              <div className="p-6 sm:p-8 grid gap-8 sm:grid-cols-[1fr_240px]">
                {/* Course info */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{course.badge}</span>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      style={{ borderColor: '#1e2a3a' }}>
                      {course.level}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white mb-1">{course.title}</h2>
                  <p className="text-slate-400 text-sm mb-4">{course.subtitle}</p>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 mb-5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> {course.rating} rating
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {course.students} students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PlayCircle className="h-3.5 w-3.5" /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> {course.lessons} lessons
                    </span>
                  </div>

                  {/* Includes */}
                  <div className="grid grid-cols-2 gap-2">
                    {course.includes.map(item => (
                      <div key={item} className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Purchase card */}
                <div className="rounded-2xl border p-5 flex flex-col items-center text-center"
                  style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="mb-1">
                    <span className="text-4xl font-black text-white">{course.price}</span>
                  </div>
                  {course.originalPrice && (
                    <p className="text-sm text-slate-600 line-through mb-4">{course.originalPrice}</p>
                  )}

                  {course.gumroadUrl ? (
                    <a href={course.gumroadUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 mb-3"
                      style={{ background: course.color }}>
                      Get Instant Access
                    </a>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-slate-400 mb-3 cursor-not-allowed"
                      style={{ background: '#1e2a3a' }}>
                      <Clock className="h-4 w-4" /> Coming Soon
                    </div>
                  )}
                  <p className="text-xs text-slate-600">
                    {course.gumroadUrl ? 'Secure checkout via Gumroad' : 'Notify me when available'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Free resources */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-white mb-2">Free Resources</h2>
          <p className="text-slate-500 text-sm mb-8">Start here — no purchase needed</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FREE_RESOURCES.map(r => (
              <Link key={r.title} href={r.href}
                className="group flex items-center gap-4 rounded-2xl border p-4 transition hover:border-red-500/30"
                style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <div className="flex-shrink-0 rounded-xl p-2.5" style={{ background: 'rgba(233,69,96,0.1)' }}>
                  <Zap className="h-4 w-4" style={{ color: '#e94560' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm group-hover:text-red-400 transition line-clamp-1">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{r.type}</p>
                </div>
                <span className="text-slate-600 group-hover:text-white transition text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-white mb-8">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Do I get lifetime access?', a: 'Yes — all purchases include lifetime access and any future updates to the course content.' },
              { q: 'What if I\'m not happy?', a: 'We offer a full 30-day money-back guarantee, no questions asked. Just email us at listmyai@gmail.com.' },
              { q: 'Are there prerequisites?', a: 'No coding or technical skills required for Beginner courses. Intermediate/Advanced courses assume basic familiarity with the tools.' },
              { q: 'How are courses delivered?', a: 'Courses are digital downloads + video lessons hosted on a private portal. You get instant access after purchase via Gumroad.' },
            ].map(faq => (
              <div key={faq.q} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
                <p className="font-bold text-white mb-2">{faq.q}</p>
                <p className="text-sm text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
