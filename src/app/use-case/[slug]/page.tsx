import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Zap } from 'lucide-react'
import ToolCard from '@/components/listing/ToolCard'
import { AiTool, Category } from '@/types'

export const revalidate = 3600

interface UseCase {
  slug: string
  title: string
  heading: string
  description: string
  keywords: string[]
  categoryMatches: string[]
  taglineMatches: string[]
}

const USE_CASES: UseCase[] = [
  {
    slug: 'writing',
    title: 'Best AI Writing Tools',
    heading: 'Best AI Writing Tools in 2026',
    description: 'Find the best AI writing tools for blog posts, essays, copywriting, and content creation. Compare features, pricing, and free trials.',
    keywords: ['AI writing tools', 'AI copywriting', 'AI content writer', 'AI blog writer'],
    categoryMatches: ['writing', 'Writing & Copy'],
    taglineMatches: ['writ', 'copy', 'content', 'blog', 'essay', 'article'],
  },
  {
    slug: 'image-generation',
    title: 'Best AI Image Generators',
    heading: 'Best AI Image Generators in 2026',
    description: 'Compare the top AI image generators — from text-to-image tools to AI art creators. Find free and paid options with pricing breakdowns.',
    keywords: ['AI image generator', 'text to image AI', 'AI art generator', 'AI photo editor'],
    categoryMatches: ['image', 'Image Generation'],
    taglineMatches: ['image', 'photo', 'art', 'dall', 'midjourney', 'generat'],
  },
  {
    slug: 'video-creation',
    title: 'Best AI Video Tools',
    heading: 'Best AI Video Creation & Editing Tools in 2026',
    description: 'Discover the best AI video generators, editors, and animation tools. Create professional videos with AI in minutes.',
    keywords: ['AI video generator', 'AI video editor', 'AI animation', 'text to video AI'],
    categoryMatches: ['video', 'Video Generation'],
    taglineMatches: ['video', 'film', 'animation', 'clip', 'edit'],
  },
  {
    slug: 'coding',
    title: 'Best AI Coding Assistants',
    heading: 'Best AI Coding Assistants & Developer Tools in 2026',
    description: 'Compare AI code assistants, debugging tools, and developer platforms. Write better code faster with the top AI coding tools.',
    keywords: ['AI code assistant', 'AI coding tool', 'AI programmer', 'AI debugging tool'],
    categoryMatches: ['code', 'Code Assistant', 'developer', 'Developer Tools'],
    taglineMatches: ['code', 'program', 'develop', 'debug', 'github', 'IDE'],
  },
  {
    slug: 'chatbots',
    title: 'Best AI Chatbots',
    heading: 'Best AI Chatbots & Assistants in 2026',
    description: 'Compare the top AI chatbots — ChatGPT, Claude, Gemini, and more. Find the right conversational AI for customer support, research, or daily tasks.',
    keywords: ['best AI chatbot', 'AI assistant', 'ChatGPT alternatives', 'conversational AI'],
    categoryMatches: ['chatbot', 'Chatbot / Assistant'],
    taglineMatches: ['chat', 'assistant', 'convers', 'gpt', 'llm'],
  },
  {
    slug: 'marketing',
    title: 'Best AI Marketing Tools',
    heading: 'Best AI Marketing & SEO Tools in 2026',
    description: 'Find the best AI tools for marketing, SEO, social media, ad copy, and campaign optimization. Grow your business with AI-powered marketing.',
    keywords: ['AI marketing tools', 'AI SEO tool', 'AI ad copy', 'AI social media'],
    categoryMatches: ['marketing', 'SEO & Marketing'],
    taglineMatches: ['market', 'seo', 'ads', 'campaign', 'social media', 'growth'],
  },
  {
    slug: 'music-audio',
    title: 'Best AI Music & Audio Tools',
    heading: 'Best AI Music Generators & Audio Tools in 2026',
    description: 'Create music, clone voices, edit audio, and generate sound effects with the best AI audio tools. Compare free and paid options.',
    keywords: ['AI music generator', 'AI audio tool', 'AI voice cloner', 'text to speech AI'],
    categoryMatches: ['audio', 'Audio & Music', 'voice', 'Voice & Speech'],
    taglineMatches: ['music', 'audio', 'voice', 'speech', 'sound', 'tts', 'song'],
  },
  {
    slug: 'design',
    title: 'Best AI Design Tools',
    heading: 'Best AI Design & Creative Tools in 2026',
    description: 'Discover AI tools for graphic design, UI/UX, logo creation, and visual content. Design like a pro with AI-powered creative tools.',
    keywords: ['AI design tool', 'AI graphic design', 'AI logo maker', 'AI UI design'],
    categoryMatches: ['design', 'Design & Creative', 'photography', 'Photography'],
    taglineMatches: ['design', 'logo', 'graphic', 'ui', 'ux', 'visual', 'creative'],
  },
  {
    slug: 'productivity',
    title: 'Best AI Productivity Tools',
    heading: 'Best AI Productivity & Workflow Tools in 2026',
    description: 'Boost your productivity with AI-powered task managers, note-taking apps, email assistants, and workflow automation tools.',
    keywords: ['AI productivity tools', 'AI task manager', 'AI note taking', 'AI email assistant'],
    categoryMatches: ['productivity', 'Productivity', 'automation', 'Automation'],
    taglineMatches: ['productiv', 'workflow', 'automat', 'task', 'note', 'email', 'schedule'],
  },
  {
    slug: 'research',
    title: 'Best AI Research Tools',
    heading: 'Best AI Research & Knowledge Tools in 2026',
    description: 'Accelerate your research with AI tools for literature review, data analysis, citation management, and knowledge discovery.',
    keywords: ['AI research tool', 'AI literature review', 'AI academic', 'AI knowledge base'],
    categoryMatches: ['research', 'Research', 'search', 'AI Search', 'analytics', 'Analytics & Data'],
    taglineMatches: ['research', 'academic', 'paper', 'citation', 'knowledge', 'search', 'analys'],
  },
  {
    slug: 'education',
    title: 'Best AI Education Tools',
    heading: 'Best AI Tools for Students & Teachers in 2026',
    description: 'Find the best AI tutors, study assistants, language learning apps, and educational platforms for students and educators.',
    keywords: ['AI education tools', 'AI tutor', 'AI study assistant', 'AI for students'],
    categoryMatches: ['education', 'Education & Learning'],
    taglineMatches: ['learn', 'study', 'tutor', 'education', 'student', 'teach', 'course'],
  },
  {
    slug: 'email-marketing',
    title: 'Best AI Email Marketing Tools',
    heading: 'Best AI Email Marketing Tools in 2026',
    description: 'Automate email campaigns, personalize outreach, and boost open rates with AI-powered email marketing tools.',
    keywords: ['AI email marketing', 'AI email tool', 'AI outreach', 'AI email automation'],
    categoryMatches: ['marketing', 'SEO & Marketing'],
    taglineMatches: ['email', 'outreach', 'newsletter', 'campaign', 'mail'],
  },
  {
    slug: 'customer-support',
    title: 'Best AI Customer Support Tools',
    heading: 'Best AI Customer Support & Helpdesk Tools in 2026',
    description: 'Automate customer support with AI chatbots, ticket routing, knowledge bases, and helpdesk platforms.',
    keywords: ['AI customer support', 'AI helpdesk', 'AI chatbot for support', 'AI ticket system'],
    categoryMatches: ['chatbot', 'Chatbot / Assistant'],
    taglineMatches: ['support', 'helpdesk', 'ticket', 'customer service', 'help desk'],
  },
  {
    slug: 'data-analysis',
    title: 'Best AI Data Analysis Tools',
    heading: 'Best AI Data Analysis & Business Intelligence Tools in 2026',
    description: 'Analyze data, build dashboards, and extract insights with the best AI-powered analytics and business intelligence tools.',
    keywords: ['AI data analysis', 'AI analytics', 'AI BI tool', 'AI spreadsheet'],
    categoryMatches: ['analytics', 'Analytics & Data'],
    taglineMatches: ['data', 'analytic', 'insight', 'dashboard', 'spreadsheet', 'chart'],
  },
  {
    slug: 'presentation',
    title: 'Best AI Presentation Tools',
    heading: 'Best AI Presentation & Slide Deck Tools in 2026',
    description: 'Create stunning presentations in minutes with AI-powered slide generators, design tools, and storytelling platforms.',
    keywords: ['AI presentation maker', 'AI slides', 'AI pitch deck', 'AI PowerPoint'],
    categoryMatches: ['design', 'Design & Creative', 'productivity', 'Productivity'],
    taglineMatches: ['present', 'slide', 'pitch', 'deck', 'powerpoint'],
  },
  {
    slug: 'summarization',
    title: 'Best AI Summarization Tools',
    heading: 'Best AI Summarization & Document Tools in 2026',
    description: 'Summarize articles, PDFs, meetings, and videos with the best AI summarization tools. Save hours of reading time.',
    keywords: ['AI summarizer', 'AI document summary', 'AI meeting notes', 'AI PDF summary'],
    categoryMatches: ['summariser', 'Summarisation'],
    taglineMatches: ['summar', 'document', 'meeting note', 'pdf', 'digest', 'tldr'],
  },
  {
    slug: 'translation',
    title: 'Best AI Translation Tools',
    heading: 'Best AI Translation & Localization Tools in 2026',
    description: 'Translate content across 100+ languages with AI. Compare real-time translators, localization platforms, and multilingual AI tools.',
    keywords: ['AI translator', 'AI translation tool', 'AI localization', 'AI language tool'],
    categoryMatches: ['translation', 'Translation'],
    taglineMatches: ['translat', 'language', 'locali', 'multilingual'],
  },
  {
    slug: 'legal',
    title: 'Best AI Legal Tools',
    heading: 'Best AI Legal & Contract Tools in 2026',
    description: 'Streamline legal work with AI contract reviewers, legal research assistants, and compliance automation tools.',
    keywords: ['AI legal tool', 'AI contract review', 'AI legal assistant', 'AI compliance'],
    categoryMatches: ['legal', 'Legal & Compliance'],
    taglineMatches: ['legal', 'contract', 'law', 'compliance', 'attorney'],
  },
]

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface PageProps { params: Promise<{ slug: string }> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeTool(t: any, catMap: Map<string, Category>): AiTool {
  const cat = catMap.get(String(t.category_id))
  return {
    id: String(t.id), slug: t.slug, name: t.name,
    tagline: t.tagline ?? '', website: t.website ?? '',
    category: cat, pricing_model: t.pricing_model ?? 'free',
    starting_price: t.starting_price ?? '', has_free_trial: t.has_free_trial ?? false,
    has_api: t.has_api ?? false, no_code: true, gdpr_compliant: false,
    status: t.status ?? 'active', is_featured: t.is_featured ?? false,
    is_sponsored: t.is_sponsored ?? false, upvotes: t.upvotes ?? 0,
    rating_avg: t.rating_avg ?? 0, rating_count: t.rating_count ?? 0,
    view_count: t.view_count ?? 0, click_count: t.click_count ?? 0,
    platforms: t.platforms ?? [], promo_code: t.promo_code ?? undefined,
    promo_desc: t.promo_desc ?? undefined,
    created_at: t.created_at ?? new Date().toISOString(),
    updated_at: t.updated_at ?? new Date().toISOString(),
  }
}

async function fetchToolsForUseCase(uc: UseCase) {
  const sb = getSupabase()
  if (!sb) return []

  const { data: cats } = await sb.from('categories').select('id, slug, name, icon, color').order('name')
  const catMap = new Map<string, Category>()
  const matchingCatIds: string[] = []
  for (const c of (cats ?? [])) {
    catMap.set(String(c.id), { id: c.id, slug: c.slug, name: c.name, icon: c.icon ?? 'Layers', color: c.color ?? '#6366f1', count: 0 })
    if (uc.categoryMatches.some(m => c.slug === m || c.name === m)) {
      matchingCatIds.push(String(c.id))
    }
  }

  // Fetch by category
  let tools: AiTool[] = []
  if (matchingCatIds.length > 0) {
    const { data } = await sb
      .from('ai_tools')
      .select('id, slug, name, tagline, website, pricing_model, starting_price, has_free_trial, has_api, status, is_featured, is_sponsored, upvotes, rating_avg, rating_count, view_count, click_count, category_id, platforms, promo_code, promo_desc, created_at, updated_at')
      .eq('status', 'active')
      .in('category_id', matchingCatIds)
      .order('upvotes', { ascending: false })
      .limit(30)
    tools = (data ?? []).map(t => shapeTool(t, catMap))
  }

  // Supplement with tagline matches if we don't have enough
  if (tools.length < 12 && uc.taglineMatches.length > 0) {
    const orFilter = uc.taglineMatches.map(m => `tagline.ilike.%${m}%`).join(',')
    const existingIds = new Set(tools.map(t => t.id))
    const { data } = await sb
      .from('ai_tools')
      .select('id, slug, name, tagline, website, pricing_model, starting_price, has_free_trial, has_api, status, is_featured, is_sponsored, upvotes, rating_avg, rating_count, view_count, click_count, category_id, platforms, promo_code, promo_desc, created_at, updated_at')
      .eq('status', 'active')
      .or(orFilter)
      .order('upvotes', { ascending: false })
      .limit(20)
    for (const t of (data ?? [])) {
      if (!existingIds.has(String(t.id))) {
        tools.push(shapeTool(t, catMap))
      }
    }
  }

  return tools
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const uc = USE_CASES.find(u => u.slug === slug)
  if (!uc) return { title: 'Use Case Not Found | ListmyAI' }

  return {
    title: `${uc.title} in 2026 — Compare & Find the Best`,
    description: uc.description,
    keywords: uc.keywords,
    openGraph: {
      title: `${uc.title} | ListmyAI`,
      description: uc.description,
      url: `https://listmyai.com/use-case/${slug}`,
      type: 'website',
      siteName: 'ListmyAI',
    },
    twitter: { card: 'summary_large_image', title: uc.title, description: uc.description },
    alternates: { canonical: `https://listmyai.com/use-case/${slug}` },
  }
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params
  const uc = USE_CASES.find(u => u.slug === slug)
  if (!uc) notFound()

  const tools = await fetchToolsForUseCase(uc)
  const freeTools = tools.filter(t => t.pricing_model === 'free' || t.pricing_model === 'freemium')
  const paidTools = tools.filter(t => t.pricing_model !== 'free' && t.pricing_model !== 'freemium')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: uc.heading,
    url: `https://listmyai.com/use-case/${slug}`,
    description: uc.description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tools.length,
      itemListElement: tools.slice(0, 20).map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://listmyai.com/tools/${t.slug}`,
        name: t.name,
        description: t.tagline,
      })),
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What are the best ${uc.title.replace('Best ', '').toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The top ${uc.title.replace('Best ', '').toLowerCase()} include ${tools.slice(0, 5).map(t => t.name).join(', ')}. Compare features, pricing, and reviews on ListmyAI.`,
        },
      },
      ...(freeTools.length > 0 ? [{
        '@type': 'Question',
        name: `Are there free ${uc.title.replace('Best ', '').toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, free options include ${freeTools.slice(0, 5).map(t => t.name).join(', ')}.`,
        },
      }] : []),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/directory" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Directory
          </Link>
          <span>/</span>
          <span className="text-slate-300">{uc.title}</span>
        </div>

        {/* Hero */}
        <div className="mb-10 rounded-2xl border p-8" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h1 className="text-3xl font-black text-white sm:text-4xl">{uc.heading}</h1>
          <p className="mt-3 max-w-2xl text-slate-400">{uc.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {uc.keywords.slice(0, 4).map(kw => (
              <span key={kw} className="rounded-full border px-3 py-1 text-xs text-slate-400"
                style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.03)' }}>
                {kw}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">
            <span className="font-semibold text-white">{tools.length}</span> tools found — updated daily
          </p>
        </div>

        {/* All tools grid */}
        {tools.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-2xl">🔍</p>
            <p className="mt-2 font-semibold text-white">No tools found for this use case yet</p>
            <p className="mt-1 text-sm text-slate-500">We&apos;re adding new tools daily. Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Top picks */}
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-white">Top Picks</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {tools.slice(0, 6).map(t => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>

            {/* Free tools */}
            {freeTools.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-xl font-bold text-white">Free {uc.title.replace('Best ', '')}</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {freeTools.slice(0, 6).map(t => <ToolCard key={t.id} tool={t} />)}
                </div>
              </section>
            )}

            {/* More tools */}
            {tools.length > 6 && (
              <section className="mb-10">
                <h2 className="mb-4 text-xl font-bold text-white">More {uc.title.replace('Best ', '')}</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.slice(6).map(t => <ToolCard key={t.id} tool={t} />)}
                </div>
              </section>
            )}
          </>
        )}

        {/* FAQ */}
        <section className="mb-10 rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-5 text-lg font-bold text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-semibold text-white">What are the best {uc.title.replace('Best ', '').toLowerCase()}?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                The most popular options include {tools.slice(0, 5).map(t => t.name).join(', ')}.
                Compare features and pricing above to find the right fit.
              </p>
            </div>
            {freeTools.length > 0 && (
              <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
                <p className="font-semibold text-white">Are there free {uc.title.replace('Best ', '').toLowerCase()}?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Yes! {freeTools.slice(0, 5).map(t => t.name).join(', ')} {freeTools.length === 1 ? 'offers' : 'offer'} free plans
                  or generous free tiers.
                </p>
              </div>
            )}
            <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="font-semibold text-white">How do I choose the right tool?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Consider your budget, required features, and team size. Start with tools that offer free trials
                so you can test before committing. Use our{' '}
                <Link href="/find" className="underline" style={{ color: '#e94560' }}>AI Tool Finder</Link>{' '}
                for personalized recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* Browse other use cases */}
        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-4 text-lg font-bold text-white">Explore Other Use Cases</h2>
          <div className="flex flex-wrap gap-2">
            {USE_CASES.filter(u => u.slug !== slug).slice(0, 12).map(u => (
              <Link key={u.slug} href={`/use-case/${u.slug}`}
                className="rounded-full border px-3 py-1.5 text-sm text-slate-400 transition hover:text-white hover:bg-white/5"
                style={{ borderColor: '#1e2a3a' }}>
                {u.title.replace('Best ', '')}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
