import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, PenLine, Image, Video, Code2, MessageSquare, TrendingUp, Music, Palette, Briefcase, BookOpen, GraduationCap, Mail, HeadphonesIcon, BarChart3, Presentation, FileText, Globe, Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Tools by Use Case — Find the Right Tool for Any Task',
  description: 'Browse AI tools organized by use case — writing, image generation, coding, marketing, video creation, and more. Find the perfect AI tool for your specific task.',
  openGraph: {
    title: 'AI Tools by Use Case | ListmyAI',
    description: 'Find the best AI tool for any task. Browse by use case: writing, coding, design, marketing, and 15+ more categories.',
    url: 'https://listmyai.com/use-case',
  },
  alternates: { canonical: 'https://listmyai.com/use-case' },
}

const USE_CASES = [
  { slug: 'writing', name: 'AI Writing Tools', icon: PenLine, color: '#22c55e', desc: 'Blog posts, copywriting, essays, content creation' },
  { slug: 'image-generation', name: 'AI Image Generators', icon: Image, color: '#ec4899', desc: 'Text-to-image, art generation, photo editing' },
  { slug: 'video-creation', name: 'AI Video Tools', icon: Video, color: '#f97316', desc: 'Video creation, editing, animation' },
  { slug: 'coding', name: 'AI Coding Assistants', icon: Code2, color: '#06b6d4', desc: 'Code completion, debugging, developer tools' },
  { slug: 'chatbots', name: 'AI Chatbots', icon: MessageSquare, color: '#6366f1', desc: 'Conversational AI, virtual assistants' },
  { slug: 'marketing', name: 'AI Marketing Tools', icon: TrendingUp, color: '#f59e0b', desc: 'SEO, ads, social media, campaigns' },
  { slug: 'music-audio', name: 'AI Music & Audio', icon: Music, color: '#a855f7', desc: 'Music generation, voice cloning, audio editing' },
  { slug: 'design', name: 'AI Design Tools', icon: Palette, color: '#e94560', desc: 'Graphic design, UI/UX, logo creation' },
  { slug: 'productivity', name: 'AI Productivity', icon: Briefcase, color: '#0ea5e9', desc: 'Task management, automation, workflows' },
  { slug: 'research', name: 'AI Research Tools', icon: BookOpen, color: '#6366f1', desc: 'Literature review, data analysis, knowledge' },
  { slug: 'education', name: 'AI Education', icon: GraduationCap, color: '#10b981', desc: 'Tutoring, study aids, language learning' },
  { slug: 'email-marketing', name: 'AI Email Marketing', icon: Mail, color: '#ef4444', desc: 'Email campaigns, outreach, newsletters' },
  { slug: 'customer-support', name: 'AI Customer Support', icon: HeadphonesIcon, color: '#14b8a6', desc: 'Helpdesk, ticket routing, chatbots' },
  { slug: 'data-analysis', name: 'AI Data Analysis', icon: BarChart3, color: '#3b82f6', desc: 'Analytics, BI, dashboards, spreadsheets' },
  { slug: 'presentation', name: 'AI Presentations', icon: Presentation, color: '#8b5cf6', desc: 'Slide decks, pitch decks, visual stories' },
  { slug: 'summarization', name: 'AI Summarization', icon: FileText, color: '#fb923c', desc: 'Document summaries, meeting notes, TL;DR' },
  { slug: 'translation', name: 'AI Translation', icon: Globe, color: '#38bdf8', desc: 'Translation, localization, multilingual' },
  { slug: 'legal', name: 'AI Legal Tools', icon: Scale, color: '#78716c', desc: 'Contract review, legal research, compliance' },
]

export default function UseCaseIndex() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
          style={{ borderColor: 'rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.08)', color: '#e94560' }}>
          <Sparkles className="h-3.5 w-3.5" /> {USE_CASES.length} Use Cases
        </div>
        <h1 className="text-4xl font-black text-white">Find AI Tools by Use Case</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Not sure which AI tool you need? Browse by what you want to accomplish — we&apos;ll show you the best options.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map(uc => {
          const Icon = uc.icon
          return (
            <Link key={uc.slug} href={`/use-case/${uc.slug}`}
              className="group flex items-start gap-4 rounded-2xl border p-5 transition-all hover:scale-[1.01]"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${uc.color}20` }}>
                <Icon className="h-5 w-5" style={{ color: uc.color }} />
              </div>
              <div>
                <p className="font-semibold text-white">{uc.name}</p>
                <p className="mt-1 text-xs text-slate-500">{uc.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
