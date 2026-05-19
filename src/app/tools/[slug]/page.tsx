import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ExternalLink, Globe, CheckCircle2, Shield, AlertCircle,
  Star, Code2, Smartphone, Monitor,
  ArrowLeft, Share2, Flag, Zap, Building2, MapPin, Calendar, Copy,
} from 'lucide-react'
import PromoCard from '@/components/promo/PromoCard'
import ToolCard from '@/components/listing/ToolCard'
import ClaimModal from '@/components/listing/ClaimModal'
import RatingWidget from '@/components/listing/RatingWidget'
import UpvoteButton from '@/components/listing/UpvoteButton'
import { AiTool, Category, Promotion } from '@/types'
import { PRICING_LABELS, PRICING_COLORS, PLATFORM_LABELS, formatCount, cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Append ?ref=listmyai to every outbound link */
function outbound(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('ref', 'listmyai')
    return u.toString()
  } catch { return url }
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { id:1,  slug:'chatbot',    name:'Chatbot / Assistant', icon:'MessageSquare', color:'#6366f1', count:24 },
  { id:4,  slug:'code',       name:'Code Assistant',      icon:'Code2',         color:'#06b6d4', count:15 },
  { id:10, slug:'voice',      name:'Voice & Speech',      icon:'Mic',           color:'#14b8a6', count:6  },
  { id:2,  slug:'image-gen',  name:'Image Generation',    icon:'Image',         color:'#ec4899', count:18 },
  { id:5,  slug:'writing',    name:'Writing & Copy',      icon:'PenLine',       color:'#10b981', count:21 },
  { id:12, slug:'research',   name:'Research',            icon:'BookOpen',      color:'#64748b', count:7  },
  { id:9,  slug:'automation', name:'Automation',          icon:'Zap',           color:'#a855f7', count:8  },
  { id:7,  slug:'seo',        name:'SEO & Marketing',     icon:'TrendingUp',    color:'#f59e0b', count:11 },
]

const TOOLS: Record<string, AiTool> = {
  'chatgpt': {
    id:'1', slug:'chatgpt', name:'ChatGPT',
    tagline:"The world's most popular AI assistant",
    description:`ChatGPT is a conversational AI assistant developed by OpenAI. Powered by GPT-4o, it can answer questions, write and debug code, draft long-form content, analyse data, translate languages, and reason through complex problems in natural language.

It is available on the web, iOS, and Android, with a free tier offering access to GPT-4o and paid plans unlocking advanced capabilities including image generation (DALL-E 3), data analysis, custom GPTs, and API access.

ChatGPT is used by over 200 million people worldwide — from students and developers to enterprise teams — making it the most adopted AI assistant in history.`,
    website:'https://chat.openai.com',
    pricing_url:'https://openai.com/pricing',
    category: CATEGORIES[0],
    pricing_model:'freemium', starting_price:'Free / $20 per month',
    has_free_trial:true, trial_duration:'Free tier available (no time limit)',
    promo_code:'', promo_desc:'',
    has_api:true, api_docs_url:'https://platform.openai.com/docs',
    no_code:true, gdpr_compliant:true,
    platforms:['web','ios','android'],
    company_name:'OpenAI', founded_year:'2022', hq_location:'San Francisco, CA',
    use_cases:'Writing & editing\nCoding & debugging\nResearch & summarisation\nData analysis\nTranslation\nImage generation\nCustom AI agents',
    alternatives:['Claude','Gemini','Copilot','Perplexity AI'],
    status:'verified', is_featured:true, is_sponsored:false,
    upvotes:4820, rating_avg:4.7, rating_count:1240, view_count:50000, click_count:20000,
    created_at:'2022-11-30', updated_at:'2024-01-01',
  },
  'claude': {
    id:'2', slug:'claude', name:'Claude',
    tagline:'Anthropic\'s safety-focused AI assistant for analysis and writing',
    description:`Claude is a conversational AI assistant built by Anthropic with a focus on safety, reliability, and nuanced reasoning. Powered by the Claude 3 family of models (Haiku, Sonnet, Opus), it excels at long-document analysis, thoughtful writing, coding, and complex multi-step tasks.

A standout feature is Claude's 200,000-token context window — large enough to process an entire novel or codebase in a single conversation. Claude is available via claude.ai, an iOS/Android app, and the Anthropic API, which powers thousands of products worldwide.

Claude is widely regarded as the best AI for long-form writing, document understanding, and tasks requiring careful reasoning.`,
    website:'https://claude.ai',
    pricing_url:'https://www.anthropic.com/pricing',
    category: CATEGORIES[0],
    pricing_model:'freemium', starting_price:'Free / $20 per month',
    has_free_trial:true, trial_duration:'Free tier available (no time limit)',
    promo_code:'', promo_desc:'',
    has_api:true, api_docs_url:'https://docs.anthropic.com',
    no_code:true, gdpr_compliant:true,
    platforms:['web','ios','android','api'],
    company_name:'Anthropic', founded_year:'2021', hq_location:'San Francisco, CA',
    use_cases:'Long document analysis\nWriting & editing\nCoding & debugging\nResearch\nData extraction\nQ&A over documents',
    alternatives:['ChatGPT','Gemini','Perplexity AI','Mistral'],
    status:'verified', is_featured:true, is_sponsored:false,
    upvotes:3200, rating_avg:4.8, rating_count:890, view_count:38000, click_count:16000,
    created_at:'2023-03-14', updated_at:'2024-01-01',
  },
  'midjourney': {
    id:'5', slug:'midjourney', name:'Midjourney',
    tagline:'Create stunning AI-generated images from text prompts',
    description:`Midjourney is one of the most powerful AI image generation tools available. Operated through Discord, users submit text prompts and receive four high-quality image options within seconds. The model is known for producing images with exceptional artistic quality, coherent composition, and photorealistic detail.

Midjourney Version 6 produces images that are often indistinguishable from professional photography or digital art. It supports aspect ratios, style references, character consistency, and image-to-image generation.

Despite having no traditional web UI (Discord-only), Midjourney has become the tool of choice for designers, concept artists, marketers, and creative professionals worldwide.`,
    website:'https://midjourney.com',
    pricing_url:'https://midjourney.com/account',
    category: CATEGORIES[3],
    pricing_model:'subscription', starting_price:'$10 per month',
    has_free_trial:false, trial_duration:'',
    promo_code:'', promo_desc:'',
    has_api:false, no_code:true, gdpr_compliant:false,
    platforms:['web','discord'],
    company_name:'Midjourney, Inc.', founded_year:'2022', hq_location:'San Francisco, CA',
    use_cases:'Digital art & illustration\nMarketing visuals\nConcept art\nSocial media content\nProduct mockups\nBook covers',
    alternatives:['DALL-E 3','Stable Diffusion','Adobe Firefly','Ideogram'],
    status:'verified', is_featured:true, is_sponsored:false,
    upvotes:2890, rating_avg:4.9, rating_count:1800, view_count:40000, click_count:18000,
    created_at:'2022-07-12', updated_at:'2024-01-01',
  },
  'cursor': {
    id:'3', slug:'cursor', name:'Cursor',
    tagline:'The AI-first code editor built for pair programming at scale',
    description:`Cursor is a code editor built from the ground up to work with AI. Based on VS Code, it is fully compatible with your existing extensions and settings but adds deeply integrated AI features that go far beyond simple autocomplete.

Key features include multi-file editing (the AI can propose changes across your entire codebase), natural language code generation, an AI chat panel that understands your code context, and automatic bug detection. Cursor uses GPT-4 and Claude models under the hood.

It has rapidly become the favourite editor of AI-native developers and is used by engineers at OpenAI, Stripe, and many top startups.`,
    website:'https://cursor.com',
    pricing_url:'https://cursor.com/pricing',
    category: CATEGORIES[1],
    pricing_model:'freemium', starting_price:'Free / $20 per month',
    has_free_trial:true, trial_duration:'14-day Pro trial',
    promo_code:'', promo_desc:'',
    has_api:false, no_code:false, gdpr_compliant:true,
    platforms:['windows','mac','linux'],
    company_name:'Anysphere', founded_year:'2022', hq_location:'San Francisco, CA',
    use_cases:'Full-stack development\nCode refactoring\nBug fixing\nLearning new codebases\nTest generation\nDocumentation',
    alternatives:['GitHub Copilot','Windsurf','Zed AI','Amazon Q Developer'],
    status:'claimed', is_featured:false, is_sponsored:false,
    upvotes:2340, rating_avg:4.8, rating_count:560, view_count:25000, click_count:11000,
    created_at:'2022-09-01', updated_at:'2024-01-01',
  },
  'perplexity-ai': {
    id:'6', slug:'perplexity-ai', name:'Perplexity AI',
    tagline:'The AI-powered search engine that cites its sources',
    description:`Perplexity AI is a conversational search engine that combines real-time web search with large language model reasoning. Unlike traditional search engines that return a list of links, Perplexity returns a single, synthesised answer with inline citations showing exactly where each fact came from.

It supports follow-up questions, image uploads, file analysis, and has a Focus mode for searching specific sources (YouTube, Reddit, academic papers). The Pro plan unlocks access to GPT-4o, Claude, and Sonar Large models.

Perplexity is widely used by students, researchers, journalists, and anyone who wants fast, accurate, sourced answers without digging through dozens of web pages.`,
    website:'https://perplexity.ai',
    pricing_url:'https://perplexity.ai/pro',
    category: CATEGORIES[5],
    pricing_model:'freemium', starting_price:'Free / $20 per month',
    has_free_trial:true, trial_duration:'Free tier available',
    promo_code:'', promo_desc:'',
    has_api:true, api_docs_url:'https://docs.perplexity.ai',
    no_code:true, gdpr_compliant:true,
    platforms:['web','ios','android'],
    company_name:'Perplexity AI', founded_year:'2022', hq_location:'San Francisco, CA',
    use_cases:'Research & fact-checking\nNews summarisation\nAcademic research\nCompetitive intelligence\nTechnical Q&A',
    alternatives:['ChatGPT','You.com','Phind','Google Gemini'],
    status:'verified', is_featured:false, is_sponsored:false,
    upvotes:1600, rating_avg:4.6, rating_count:1100, view_count:18000, click_count:8000,
    created_at:'2022-08-01', updated_at:'2024-01-01',
  },
  'zapier-ai': {
    id:'7', slug:'zapier-ai', name:'Zapier AI',
    tagline:'Automate workflows with AI-powered no-code integrations',
    description:`Zapier is the world's leading workflow automation platform, and its AI features let you build automations using plain English. Describe what you want to happen — "When I receive an email with an invoice, extract the amount and add it to my Google Sheet" — and Zapier's AI builds the automation for you.

Zapier connects over 6,000 apps including Gmail, Slack, Salesforce, Notion, HubSpot, and thousands more. The AI Chatbot builder lets you create custom AI assistants trained on your own data and embed them on your website with no code.

Used by over 2.2 million businesses to save an average of 10 hours per week on repetitive tasks.`,
    website:'https://zapier.com',
    pricing_url:'https://zapier.com/pricing',
    category: CATEGORIES[6],
    pricing_model:'freemium', starting_price:'Free / $19.99 per month',
    has_free_trial:true, trial_duration:'14-day free trial of paid plans',
    promo_code:'', promo_desc:'',
    has_api:true, api_docs_url:'https://zapier.com/developer',
    no_code:true, gdpr_compliant:true,
    platforms:['web','api'],
    company_name:'Zapier Inc.', founded_year:'2011', hq_location:'Remote-first (San Francisco)',
    use_cases:'Workflow automation\nLead management\nEmail automation\nData sync between apps\nAI chatbot building\nReport generation',
    alternatives:['Make (Integromat)','n8n','Power Automate','Workato'],
    status:'verified', is_featured:false, is_sponsored:false,
    upvotes:1320, rating_avg:4.5, rating_count:970, view_count:15000, click_count:6500,
    created_at:'2011-10-01', updated_at:'2024-01-01',
  },
  'elevenlabs': {
    id:'8', slug:'elevenlabs', name:'ElevenLabs',
    tagline:'Generate hyper-realistic AI voices in seconds',
    description:`ElevenLabs is the leading AI voice generation platform, capable of creating speech that is nearly indistinguishable from a real human voice. Users can clone any voice from a short audio sample, select from hundreds of pre-built voices, or generate entirely new synthetic voices with precise emotional control.

Key features include Text to Speech, Voice Cloning, Dubbing (translate video audio while preserving the original speaker's voice), and an AI Sound Effects generator. The API is used by major podcasts, audiobook publishers, game developers, and accessibility tools worldwide.

ElevenLabs supports 29 languages and has been used to create content in over 100 countries.`,
    website:'https://elevenlabs.io',
    pricing_url:'https://elevenlabs.io/pricing',
    category: CATEGORIES[2],
    pricing_model:'freemium', starting_price:'Free / $5 per month',
    has_free_trial:true, trial_duration:'Free tier: 10,000 characters/month',
    promo_code:'', promo_desc:'',
    has_api:true, api_docs_url:'https://elevenlabs.io/docs',
    no_code:true, gdpr_compliant:true,
    platforms:['web','api','ios'],
    company_name:'ElevenLabs', founded_year:'2022', hq_location:'New York, NY',
    use_cases:'Podcast production\nAudiobook narration\nVideo voiceovers\nGame character voices\nAccessibility tools\nVideo dubbing',
    alternatives:['Play.ht','Murf.ai','LOVO','Resemble.ai'],
    status:'verified', is_featured:false, is_sponsored:false,
    upvotes:1890, rating_avg:4.7, rating_count:430, view_count:20000, click_count:9000,
    created_at:'2022-01-01', updated_at:'2024-01-01',
  },
  'notion-ai': {
    id:'9', slug:'notion-ai', name:'Notion AI',
    tagline:'AI writing and thinking assistant built into Notion',
    description:`Notion AI is an AI layer built directly into the Notion workspace. It can write, edit, summarise, translate, and brainstorm without leaving your documents. Ask it to turn rough bullet points into a polished email, summarise a long meeting note, or generate a first draft of a project brief.

Because it operates inside Notion, it has full context of your workspace — databases, pages, and linked docs — making its suggestions highly relevant to your work. Notion AI is available as an add-on to any Notion plan for $10/month per member.

It is particularly powerful for teams who already use Notion for documentation, project management, or knowledge management.`,
    website:'https://notion.so/product/ai',
    pricing_url:'https://notion.so/pricing',
    category: CATEGORIES[4],
    pricing_model:'subscription', starting_price:'$10/month add-on',
    has_free_trial:true, trial_duration:'20 free AI responses',
    promo_code:'', promo_desc:'',
    has_api:false, no_code:true, gdpr_compliant:true,
    platforms:['web','ios','android','mac','windows'],
    company_name:'Notion Labs', founded_year:'2016', hq_location:'San Francisco, CA',
    use_cases:'Meeting note summarisation\nProject brief writing\nKnowledge base Q&A\nEmail drafting\nContent translation\nBrainstorming',
    alternatives:['Coda AI','ClickUp AI','Confluence AI','Obsidian'],
    status:'verified', is_featured:false, is_sponsored:false,
    upvotes:980, rating_avg:4.5, rating_count:640, view_count:14000, click_count:5500,
    created_at:'2023-02-22', updated_at:'2024-01-01',
  },
  'github-copilot': {
    id:'4', slug:'github-copilot', name:'GitHub Copilot',
    tagline:'AI pair programmer for every developer',
    description:`GitHub Copilot is an AI-powered code completion tool that suggests code in real time as you type. Built on OpenAI Codex and GPT-4, it understands context from your code and comments to suggest entire functions, tests, and documentation.

Available across VS Code, JetBrains, Vim/Neovim, and GitHub.com, Copilot supports 40+ programming languages. The Copilot Chat feature lets you ask questions about your codebase in natural language — making it an always-available code reviewer and pair programmer.

Used by 1.8 million developers at companies including Airbnb, T-Mobile, and Duolingo.`,
    website:'https://github.com/features/copilot',
    pricing_url:'https://github.com/features/copilot#pricing',
    category: CATEGORIES[1],
    pricing_model:'subscription', starting_price:'$10 per month',
    has_free_trial:true, trial_duration:'30-day free trial',
    promo_code:'COPILOT30', promo_desc:'30-day free trial, no credit card required',
    has_api:false, no_code:false, gdpr_compliant:true,
    platforms:['vscode','windows','mac','linux'],
    company_name:'GitHub / Microsoft', founded_year:'2021', hq_location:'San Francisco, CA',
    use_cases:'Code completion\nCode generation\nTest writing\nDocumentation\nCode review\nBug fixing',
    alternatives:['Cursor','Tabnine','Codeium','Amazon CodeWhisperer'],
    status:'auto', is_featured:false, is_sponsored:false,
    upvotes:2900, rating_avg:4.6, rating_count:720, view_count:30000, click_count:12000,
    created_at:'2021-06-29', updated_at:'2024-01-01',
  },
}

const RELATED: AiTool[] = [
  { id:'2', slug:'claude', name:'Claude', tagline:'AI assistant built for safety and reasoning', website:'https://claude.ai', category:CATEGORIES[0], pricing_model:'freemium', starting_price:'Free / $20/mo', has_free_trial:true, has_api:true, no_code:true, gdpr_compliant:true, status:'verified', is_featured:true, is_sponsored:false, upvotes:3200, rating_avg:4.8, rating_count:890, view_count:38000, click_count:16000, created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'3', slug:'cursor', name:'Cursor', tagline:'The AI-first code editor', website:'https://cursor.com', category:CATEGORIES[1], pricing_model:'freemium', starting_price:'Free / $20/mo', has_free_trial:true, has_api:false, no_code:false, gdpr_compliant:true, status:'claimed', is_featured:false, is_sponsored:false, upvotes:2340, rating_avg:4.8, rating_count:560, view_count:25000, click_count:11000, created_at:'2024-01-01', updated_at:'2024-01-01' },
  { id:'4', slug:'elevenlabs', name:'ElevenLabs', tagline:'Hyper-realistic AI voice generation', website:'https://elevenlabs.io', category:CATEGORIES[2], pricing_model:'freemium', starting_price:'Free / $5/mo', has_free_trial:true, has_api:true, no_code:true, gdpr_compliant:true, status:'verified', is_featured:false, is_sponsored:false, upvotes:1890, rating_avg:4.7, rating_count:430, view_count:20000, click_count:9000, created_at:'2024-01-01', updated_at:'2024-01-01' },
]

const PROMOS_BY_SLUG: Record<string, Promotion[]> = {
  'github-copilot': [{
    id:'p1', tool_id:'4', promo_type:'trial', title:'30-Day Free Trial',
    description:'Try GitHub Copilot free for 30 days. Full access to all AI coding features, no credit card required.',
    promo_code:'COPILOT30', discount_pct:0, trial_days:30,
    valid_until:'2025-12-31', is_verified:true, created_at:'2024-01-01',
  }],
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactElement; cls: string }> = {
  verified: { label:'Verified',  icon:<CheckCircle2 className="h-4 w-4" />, cls:'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  claimed:  { label:'Claimed',   icon:<Shield className="h-4 w-4" />,       cls:'text-blue-400 bg-blue-500/10 border-blue-500/25' },
  pending:  { label:'Pending',   icon:<AlertCircle className="h-4 w-4" />,  cls:'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  auto:     { label:'Unclaimed', icon:<AlertCircle className="h-4 w-4" />,  cls:'text-amber-400 bg-amber-500/10 border-amber-500/25' },
}

// ── SEO ───────────────────────────────────────────────────────────────────────

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tool = TOOLS[slug]
  if (!tool) return { title: 'Tool Not Found | ListmyAI' }

  const title = `${tool.name} — ${tool.tagline} | ListmyAI`
  const description = `${tool.name}: ${tool.tagline}. ${tool.pricing_model === 'free' ? 'Free' : tool.starting_price ?? 'See pricing'}. ${tool.has_free_trial ? 'Free trial available. ' : ''}Discover deals, reviews, and alternatives on ListmyAI.`

  return {
    title,
    description,
    keywords: [tool.name, tool.category?.name ?? '', 'AI tool', 'artificial intelligence', tool.company_name ?? '', 'review', 'pricing', 'alternative'].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://listmyai.com/tools/${slug}`,
      siteName: 'ListmyAI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: `https://listmyai.com/tools/${slug}` },
  }
}

// ── FAQ generator ─────────────────────────────────────────────────────────────

function buildFAQs(tool: AiTool) {
  const faqs = [
    { q: `Is ${tool.name} free?`, a: tool.pricing_model === 'free' ? `Yes, ${tool.name} is completely free to use.` : tool.pricing_model === 'freemium' ? `${tool.name} has a free tier. Paid plans start at ${tool.starting_price ?? 'various price points'} for advanced features.` : `${tool.name} is a paid tool starting at ${tool.starting_price ?? 'see website for pricing'}.` },
    ...(tool.has_free_trial ? [{ q: `Does ${tool.name} have a free trial?`, a: tool.trial_duration ? `Yes — ${tool.trial_duration}.` : `Yes, ${tool.name} offers a free trial. Check the website for current trial terms.` }] : []),
    ...(tool.has_api ? [{ q: `Does ${tool.name} have an API?`, a: `Yes, ${tool.name} provides a developer API${tool.api_docs_url ? `. API documentation is available at ${tool.api_docs_url}.` : '.'}` }] : []),
    { q: `What is ${tool.name} used for?`, a: tool.use_cases ? `${tool.name} is commonly used for: ${tool.use_cases.split('\n').filter(Boolean).join(', ')}.` : `${tool.name} is an AI tool used for ${tool.category?.name ?? 'various AI tasks'}.` },
    { q: `Who makes ${tool.name}?`, a: `${tool.name} is developed by ${tool.company_name ?? 'its respective company'}${tool.hq_location ? `, headquartered in ${tool.hq_location}` : ''}.` },
    { q: `What are the best alternatives to ${tool.name}?`, a: tool.alternatives?.length ? `Popular alternatives to ${tool.name} include: ${tool.alternatives.join(', ')}.` : `Browse the ListmyAI ${tool.category?.name ?? ''} category to find alternatives.` },
  ]
  return faqs
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function buildJsonLd(tool: AiTool, faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: tool.name,
        description: tool.tagline,
        url: tool.website,
        applicationCategory: 'AIApplication',
        operatingSystem: tool.platforms?.join(', ') ?? 'Web',
        offers: {
          '@type': 'Offer',
          price: tool.pricing_model === 'free' ? '0' : undefined,
          priceCurrency: 'USD',
          description: tool.starting_price,
        },
        ...(tool.rating_count > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tool.rating_avg.toFixed(1),
            reviewCount: tool.rating_count,
            bestRating: '5',
            worstRating: '1',
          },
        } : {}),
        author: { '@type': 'Organization', name: tool.company_name ?? tool.name },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Directory', item: 'https://listmyai.com/directory' },
          ...(tool.category ? [{ '@type': 'ListItem', position: 2, name: tool.category.name, item: `https://listmyai.com/directory?category=${tool.category.slug}` }] : []),
          { '@type': 'ListItem', position: tool.category ? 3 : 2, name: tool.name, item: `https://listmyai.com/tools/${tool.slug}` },
        ],
      },
    ],
  }
}

// ── ClaimBanner — rendered server-side, wraps client ClaimModal ───────────────

import ClaimBanner from '@/components/listing/ClaimBanner'

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const tool = TOOLS[slug]
  if (!tool) notFound()

  const status = STATUS_CONFIG[tool.status] ?? STATUS_CONFIG.auto
  const promos = PROMOS_BY_SLUG[slug] ?? []
  const useCases = tool.use_cases?.split('\n').filter(Boolean) ?? []
  const pricing = tool.pricing_model
  const faqs = buildFAQs(tool)
  const jsonLd = buildJsonLd(tool, faqs)
  const isUnclaimed = tool.status === 'auto'

  return (
    <>
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/directory" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Directory
          </Link>
          <span>/</span>
          {tool.category && (
            <>
              <Link href={`/directory?category=${tool.category.slug}`} className="hover:text-white transition-colors">
                {tool.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-300">{tool.name}</span>
        </div>

        {/* Claim banner for unclaimed tools */}
        {isUnclaimed && (
          <ClaimBanner
            toolName={tool.name}
            toolSlug={tool.slug}
            toolWebsite={tool.website}
          />
        )}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Hero card */}
            <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
                  style={{background:'rgba(255,255,255,0.08)',border:'1px solid #1e2a3a'}}>
                  {tool.name[0]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-white">{tool.name}</h1>
                    {tool.is_featured && (
                      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.25)',color:'#f59e0b'}}>
                        <Zap className="h-3 w-3" /> Featured
                      </span>
                    )}
                    <span className={cn('flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', status.cls)}>
                      {status.icon}{status.label}
                    </span>
                  </div>

                  <p className="mt-1 text-slate-300">{tool.tagline}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {tool.category && (
                      <span className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{background:`${tool.category.color}20`,color:tool.category.color,border:`1px solid ${tool.category.color}30`}}>
                        {tool.category.name}
                      </span>
                    )}
                    {pricing && (
                      <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', PRICING_COLORS[pricing])}>
                        {PRICING_LABELS[pricing]}
                      </span>
                    )}
                    {tool.has_free_trial && (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{background:'rgba(16,185,129,0.1)',color:'#10b981',border:'1px solid rgba(16,185,129,0.2)'}}>
                        ✓ Free Trial
                      </span>
                    )}
                    {tool.has_api && (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{background:'rgba(6,182,212,0.1)',color:'#06b6d4',border:'1px solid rgba(6,182,212,0.2)'}}>
                        <Code2 className="inline h-3 w-3 mr-1" />API
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  style={{background:'#e94560',boxShadow:'0 0 20px rgba(233,69,96,0.25)'}}>
                  <ExternalLink className="h-4 w-4" />
                  Visit {tool.name}
                </a>
                {tool.pricing_url && (
                  <a href={outbound(tool.pricing_url)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
                    style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.03)'}}>
                    <Globe className="h-4 w-4" /> Pricing
                  </a>
                )}
                <UpvoteButton toolName={tool.name} initialCount={tool.upvotes} />
                <button className="ml-auto flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm text-slate-500 transition hover:text-slate-300"
                  style={{borderColor:'#1e2a3a',background:'transparent'}}>
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Rating summary */}
              {tool.rating_count > 0 && (
                <div className="mt-4 flex items-center gap-3 border-t pt-4" style={{borderColor:'#1e2a3a'}}>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn('h-4 w-4', s <= Math.round(tool.rating_avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-700')} />
                    ))}
                  </div>
                  <span className="font-bold text-white">{tool.rating_avg.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">({tool.rating_count.toLocaleString()} ratings from ListmyAI users)</span>
                  <span className="ml-auto text-sm text-slate-500">{formatCount(tool.view_count)} views</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h2 className="mb-4 text-lg font-bold text-white">About {tool.name}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-300">
                {tool.description?.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>

            {/* Use cases */}
            {useCases.length > 0 && (
              <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h2 className="mb-4 text-lg font-bold text-white">Key Use Cases</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {useCases.map(uc => (
                    <div key={uc} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300"
                      style={{background:'rgba(255,255,255,0.03)',border:'1px solid #1e2a3a'}}>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{color:'#e94560'}} />
                      {uc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promotions */}
            {promos.length > 0 && (
              <div className="rounded-2xl border p-6" style={{borderColor:'rgba(233,69,96,0.2)',background:'rgba(233,69,96,0.04)'}}>
                <h2 className="mb-4 text-lg font-bold text-white">🎁 Active Deals & Promotions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {promos.map(p => <PromoCard key={p.id} promo={{...p, tool:{ id:tool.id, name:tool.name, slug:tool.slug, category:tool.category }}} />)}
                </div>
              </div>
            )}

            {/* Ratings & Reviews */}
            <RatingWidget toolName={tool.name} ratingAvg={tool.rating_avg} ratingCount={tool.rating_count} />

            {/* FAQ — SEO + AI optimised */}
            <div className="rounded-2xl border p-6" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h2 className="mb-5 text-lg font-bold text-white">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map(({ q, a }) => (
                  <div key={q} className="rounded-xl border p-4" style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.02)'}}>
                    <p className="font-semibold text-white">{q}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl p-4 text-xs leading-relaxed text-slate-500"
              style={{border:'1px solid #1e2a3a',background:'rgba(255,255,255,0.02)'}}>
              <strong className="text-slate-400">Disclaimer:</strong> All product names, logos, and trademarks are the property of {tool.company_name ?? tool.name}.
              ListmyAI is an independent directory and is not affiliated with, endorsed by, or sponsored by {tool.company_name ?? tool.name}.
              Information is for general informational purposes only and may not reflect the latest changes to pricing or features.
              {isUnclaimed && (
                <span className="block mt-1">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  This listing was auto-compiled from public sources and has not yet been claimed by the tool owner.
                </span>
              )}
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Quick facts */}
            <div className="rounded-2xl border p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Quick Facts</h3>
              <div className="space-y-3">
                {[
                  { icon:<Globe className="h-4 w-4" />,      label:'Website',  val:<a href={outbound(tool.website)} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{color:'#e94560'}}>{new URL(tool.website).hostname}</a> },
                  { icon:<Building2 className="h-4 w-4" />,  label:'Company',  val:tool.company_name },
                  { icon:<MapPin className="h-4 w-4" />,     label:'Location', val:tool.hq_location },
                  { icon:<Calendar className="h-4 w-4" />,   label:'Founded',  val:tool.founded_year },
                  { icon:<Globe className="h-4 w-4" />,      label:'Pricing',  val:tool.starting_price },
                ].filter(r => r.val).map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500">{row.icon}{row.label}</span>
                    <span className="text-right text-slate-300">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platforms */}
            {tool.platforms && tool.platforms.length > 0 && (
              <div className="rounded-2xl border p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Available On</h3>
                <div className="flex flex-wrap gap-2">
                  {tool.platforms.map(p => (
                    <span key={p} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-slate-300"
                      style={{borderColor:'#1e2a3a',background:'rgba(255,255,255,0.03)'}}>
                      {p === 'vscode' ? <Monitor className="h-3 w-3" /> : p === 'ios' || p === 'android' ? <Smartphone className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      {PLATFORM_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trial */}
            {tool.has_free_trial && (
              <div className="rounded-2xl border p-5" style={{borderColor:'rgba(16,185,129,0.2)',background:'rgba(16,185,129,0.04)'}}>
                <h3 className="mb-2 text-sm font-bold text-emerald-400">✓ Free Trial Available</h3>
                <p className="text-sm text-slate-400">{tool.trial_duration ?? 'Free trial available — check website for details.'}</p>
                <a href={outbound(tool.pricing_url ?? tool.website)} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:opacity-90"
                  style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.2)'}}>
                  Start Free Trial <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Alternatives */}
            {tool.alternatives && tool.alternatives.length > 0 && (
              <div className="rounded-2xl border p-5" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Similar Tools</h3>
                <div className="space-y-1">
                  {tool.alternatives.map(alt => (
                    <Link key={alt} href={`/directory?q=${encodeURIComponent(alt)}`}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
                      → {alt}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* API */}
            {tool.has_api && (
              <div className="rounded-2xl border p-5" style={{borderColor:'rgba(6,182,212,0.2)',background:'rgba(6,182,212,0.04)'}}>
                <h3 className="mb-2 text-sm font-bold" style={{color:'#06b6d4'}}>⚡ API Available</h3>
                <p className="text-sm text-slate-400">{tool.name} provides a developer API for integration into your own products.</p>
                {tool.api_docs_url && (
                  <a href={outbound(tool.api_docs_url)} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition hover:opacity-90"
                    style={{background:'rgba(6,182,212,0.12)',color:'#06b6d4',border:'1px solid rgba(6,182,212,0.2)'}}>
                    API Docs <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Backlink request (shown to all — subtle) */}
            <div className="rounded-2xl border p-4" style={{borderColor:'#1e2a3a',background:'#161b27'}}>
              <p className="text-xs font-semibold text-slate-400 mb-2">🔗 Using {tool.name}?</p>
              <p className="text-xs text-slate-600 mb-2">Link back to this listing and help others discover it.</p>
              <BacklinkCopy slug={tool.slug} />
            </div>

            {/* Report */}
            <div className="text-center">
              <Link href="/dmca" className="flex items-center justify-center gap-1.5 text-xs text-slate-600 transition hover:text-slate-400">
                <Flag className="h-3.5 w-3.5" /> Report inaccurate info
              </Link>
            </div>
          </div>
        </div>

        {/* Related tools */}
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-white">You might also like</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED.slice(0, 3).map(t => <ToolCard key={t.id} tool={t} />)}
          </div>
        </section>
      </div>
    </>
  )
}

// ── Small client component — backlink copy button ─────────────────────────────
function BacklinkCopy({ slug }: { slug: string }) {
  return <BacklinkCopyClient slug={slug} />
}

import BacklinkCopyClient from '@/components/listing/BacklinkCopyClient'
