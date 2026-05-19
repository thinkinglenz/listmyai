'use client'

import Link from 'next/link'
import { MessageSquare, Image, Video, Music, Code2, PenLine, TrendingUp, BarChart3, Mic, Search, Zap, Palette, BookOpen, GraduationCap, Heart, Scale, Sparkles, Bot, Briefcase, Camera, Globe, Shield, Cpu, FileText } from 'lucide-react'

const CATEGORIES = [
  { slug:'chatbot',       name:'Chatbot / Assistant',  icon: MessageSquare, color:'#6366f1', count:24, desc:'Conversational AI, virtual assistants, customer support bots' },
  { slug:'image',         name:'Image Generation',     icon: Image,         color:'#ec4899', count:18, desc:'Text-to-image, art generation, photo editing AI tools' },
  { slug:'video',         name:'Video Generation',     icon: Video,         color:'#f97316', count:12, desc:'AI video creation, editing, animation and synthesis' },
  { slug:'audio',         name:'Audio & Music',        icon: Music,         color:'#a855f7', count:9,  desc:'AI music composition, voice cloning, audio editing' },
  { slug:'code',          name:'Code Assistant',       icon: Code2,         color:'#06b6d4', count:15, desc:'AI coding tools, code completion, debugging assistants' },
  { slug:'writing',       name:'Writing & Copy',       icon: PenLine,       color:'#22c55e', count:21, desc:'Copywriting, blog writing, content generation AI' },
  { slug:'marketing',     name:'SEO & Marketing',      icon: TrendingUp,    color:'#f59e0b', count:11, desc:'SEO tools, ad copy, social media AI assistants' },
  { slug:'analytics',     name:'Analytics & Data',     icon: BarChart3,     color:'#3b82f6', count:8,  desc:'Data analysis, business intelligence, AI insights' },
  { slug:'voice',         name:'Voice & Speech',       icon: Mic,           color:'#14b8a6', count:6,  desc:'Speech recognition, text-to-speech, voice AI' },
  { slug:'search',        name:'AI Search',            icon: Search,        color:'#8b5cf6', count:5,  desc:'AI-powered search engines, knowledge retrieval tools' },
  { slug:'automation',    name:'Automation',           icon: Zap,           color:'#eab308', count:8,  desc:'Workflow automation, RPA, AI agents and pipelines' },
  { slug:'design',        name:'Design & Creative',    icon: Palette,       color:'#e94560', count:14, desc:'UI/UX design, logo creation, visual AI tools' },
  { slug:'education',     name:'Education & Learning', icon: GraduationCap, color:'#10b981', count:7,  desc:'AI tutors, language learning, study assistants' },
  { slug:'research',      name:'Research',             icon: BookOpen,      color:'#6366f1', count:7,  desc:'Academic research, literature review, citation tools' },
  { slug:'health',        name:'Health & Wellness',    icon: Heart,         color:'#ef4444', count:5,  desc:'Medical AI, mental health, fitness AI assistants' },
  { slug:'legal',         name:'Legal & Compliance',   icon: Scale,         color:'#78716c', count:4,  desc:'Contract AI, legal research, compliance automation' },
  { slug:'productivity',  name:'Productivity',         icon: Briefcase,     color:'#0ea5e9', count:13, desc:'Task management, note-taking, calendar AI tools' },
  { slug:'avatar',        name:'Avatar & Persona',     icon: Bot,           color:'#f43f5e', count:6,  desc:'AI avatars, digital humans, character generation' },
  { slug:'photography',   name:'Photography',          icon: Camera,        color:'#84cc16', count:5,  desc:'Photo enhancement, upscaling, background removal' },
  { slug:'translation',   name:'Translation',          icon: Globe,         color:'#38bdf8', count:4,  desc:'AI translation, language detection, localisation' },
  { slug:'security',      name:'Security & Privacy',   icon: Shield,        color:'#64748b', count:3,  desc:'AI cybersecurity, threat detection, privacy tools' },
  { slug:'developer',     name:'Developer Tools',      icon: Cpu,           color:'#a3e635', count:9,  desc:'APIs, SDKs, AI infrastructure and DevOps tools' },
  { slug:'summariser',    name:'Summarisation',        icon: FileText,      color:'#fb923c', count:6,  desc:'Document summarisers, meeting notes, PDF AI tools' },
  { slug:'other',         name:'Other AI Tools',       icon: Sparkles,      color:'#94a3b8', count:17, desc:'Miscellaneous AI tools that don\'t fit neatly elsewhere' },
]

const TOTAL = CATEGORIES.reduce((s, c) => s + c.count, 0)

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" /> {TOTAL}+ AI Tools Catalogued
        </div>
        <h1 className="text-4xl font-black text-white">Browse by Category</h1>
        <p className="mt-3 text-slate-400">Find AI tools for every use case, role, and industry</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          return (
            <Link key={cat.slug} href={`/directory?category=${cat.slug}`}
              className="group flex items-start gap-4 rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.01]"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = `${cat.color}40`
                el.style.background = `${cat.color}08`
                el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4)`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = '#1e2a3a'
                el.style.background = '#161b27'
                el.style.boxShadow = 'none'
              }}>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${cat.color}20` }}>
                <Icon className="h-5 w-5" style={{ color: cat.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white leading-tight">{cat.name}</p>
                  <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: `${cat.color}18`, color: cat.color }}>
                    {cat.count}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{cat.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
        <h2 className="text-xl font-bold text-white">Don&apos;t see your category?</h2>
        <p className="mt-2 text-slate-400">Submit your AI tool and we&apos;ll find the right home for it.</p>
        <Link href="/submit"
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#e94560' }}>
          Submit Your AI Tool
        </Link>
      </div>
    </div>
  )
}
