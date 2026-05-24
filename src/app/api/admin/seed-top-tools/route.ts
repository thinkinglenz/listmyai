import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 60)
}

interface TopTool {
  name: string
  website: string
  tagline: string
  description: string
  category: string  // category name to match
  pricing_model: string
  starting_price?: string
  has_free_trial?: boolean
  has_api?: boolean
  upvotes?: number  // seed popularity
  logo_url?: string
}

// The 40 most important AI tools every directory should have.
const TOP_TOOLS: TopTool[] = [
  // ── Conversational AI / Chatbots ─────────────────────────────────────────
  {
    name: 'ChatGPT', website: 'https://chat.openai.com',
    tagline: 'OpenAI’s flagship conversational AI for writing, coding, and analysis.',
    description: 'ChatGPT is OpenAI’s widely used conversational AI assistant powered by the GPT family of models. It handles writing, coding, research, analysis, image generation (via DALL·E), voice conversations, and tool use including web search and file uploads. Available via web, mobile, and desktop apps.',
    category: 'Chatbot', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: true, upvotes: 950,
    logo_url: 'https://cdn.simpleicons.org/openai/white',
  },
  {
    name: 'Claude', website: 'https://claude.ai',
    tagline: 'Anthropic’s AI assistant for thoughtful writing, analysis, and code.',
    description: 'Claude is Anthropic’s AI assistant known for long-context reasoning, careful writing, and high-quality code generation. It supports tool use, file analysis, vision, and computer use, and is available through the web app, mobile, the Claude API, and integrations like Claude Code.',
    category: 'Chatbot', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: true, upvotes: 880,
    logo_url: 'https://cdn.simpleicons.org/anthropic/D97757',
  },
  {
    name: 'Gemini', website: 'https://gemini.google.com',
    tagline: 'Google’s multimodal AI assistant integrated across Google products.',
    description: 'Gemini is Google’s flagship multimodal AI assistant, capable of text, image, audio, and video understanding. It integrates with Gmail, Docs, Sheets, and Workspace, and powers features in Android and Pixel devices. Available as a free tier, Gemini Advanced, and via the Gemini API.',
    category: 'Chatbot', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: true, upvotes: 820,
    logo_url: 'https://cdn.simpleicons.org/googlegemini/8E75B2',
  },
  {
    name: 'Microsoft Copilot', website: 'https://copilot.microsoft.com',
    tagline: 'Microsoft’s AI assistant across Windows, Edge, and Microsoft 365.',
    description: 'Microsoft Copilot is an AI companion built into Windows, Edge, Bing, and Microsoft 365 apps like Word, Excel, Outlook, and Teams. It uses GPT models with web grounding, image generation, and enterprise-grade data protection.',
    category: 'Chatbot', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: false, upvotes: 700,
  },
  {
    name: 'Grok', website: 'https://grok.com',
    tagline: 'xAI’s conversational AI integrated with X (Twitter).',
    description: 'Grok is xAI’s conversational AI assistant with real-time access to X (Twitter) data. It supports image understanding, image generation (Aurora), and is available via the Grok app, X premium, and the xAI API.',
    category: 'Chatbot', pricing_model: 'freemium', starting_price: '$30/mo',
    has_free_trial: true, has_api: true, upvotes: 540,
  },
  {
    name: 'DeepSeek', website: 'https://chat.deepseek.com',
    tagline: 'Open-source reasoning AI from DeepSeek.',
    description: 'DeepSeek is a Chinese AI lab known for releasing high-performance open-weight models like DeepSeek-V3 and DeepSeek-R1 with strong reasoning, math, and coding ability. Free via the DeepSeek chat app and available through a low-cost API.',
    category: 'Chatbot', pricing_model: 'freemium', has_api: true, upvotes: 480,
  },

  // ── AI Search & Research ─────────────────────────────────────────────────
  {
    name: 'Perplexity', website: 'https://www.perplexity.ai',
    tagline: 'AI-powered answer engine with cited sources.',
    description: 'Perplexity is an AI search and research engine that answers questions with cited sources from the web. It supports follow-up questions, focus modes (Academic, Reddit, YouTube), file uploads, and Spaces for organizing research. Available via web, mobile, and Pro tier with model choice.',
    category: 'Search', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: true, upvotes: 760,
  },
  {
    name: 'Google AI Studio', website: 'https://aistudio.google.com',
    tagline: 'Free playground to prototype with Gemini models.',
    description: 'Google AI Studio is a free browser-based playground for prototyping with Gemini models. It lets you test prompts, tune parameters, generate code, work with multimodal inputs, and export to the Gemini API. Includes generous free tier limits for developers.',
    category: 'Code', pricing_model: 'freemium', has_api: true, upvotes: 520,
  },
  {
    name: 'You.com', website: 'https://you.com',
    tagline: 'Multi-model AI assistant and search.',
    description: 'You.com is an AI assistant and search platform giving access to multiple frontier models (GPT, Claude, Gemini, Grok) in one interface. Offers personal and team plans with web search, file analysis, image generation, and custom AI agents.',
    category: 'Search', pricing_model: 'freemium', starting_price: '$15/mo',
    has_free_trial: true, has_api: true, upvotes: 320,
  },

  // ── Coding Assistants ────────────────────────────────────────────────────
  {
    name: 'Cursor', website: 'https://cursor.com',
    tagline: 'The AI-first code editor built on VS Code.',
    description: 'Cursor is an AI-powered code editor (forked from VS Code) with deep model integration. It offers chat with your codebase, multi-file edits via Composer, Tab autocomplete, agent mode, and works with frontier models like Claude, GPT, and Gemini.',
    category: 'Code', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: false, upvotes: 840,
  },
  {
    name: 'GitHub Copilot', website: 'https://github.com/features/copilot',
    tagline: 'AI pair programmer from GitHub and Microsoft.',
    description: 'GitHub Copilot is an AI coding assistant from GitHub and Microsoft. Provides inline code suggestions, chat, agentic editing, and PR review across VS Code, JetBrains, Neovim, and Visual Studio. Available for individuals, business, and enterprise.',
    category: 'Code', pricing_model: 'subscription', starting_price: '$10/mo',
    has_free_trial: true, has_api: false, upvotes: 790,
  },
  {
    name: 'Claude Code', website: 'https://www.anthropic.com/claude-code',
    tagline: 'Anthropic’s agentic coding tool in your terminal.',
    description: 'Claude Code is Anthropic’s command-line agentic coding tool that lives in your terminal. It can read your codebase, run commands, edit files, run tests, and complete multi-step engineering tasks autonomously. Powered by Claude models.',
    category: 'Code', pricing_model: 'subscription', starting_price: '$20/mo',
    has_free_trial: true, has_api: false, upvotes: 720,
  },
  {
    name: 'Windsurf', website: 'https://windsurf.com',
    tagline: 'AI-native IDE with agentic Cascade workflow.',
    description: 'Windsurf (formerly Codeium) is an AI-native IDE with the Cascade agent that can read, plan, and edit across your codebase. Includes autocomplete, chat, and supercomplete features. Free tier available with paid plans for power users and teams.',
    category: 'Code', pricing_model: 'freemium', starting_price: '$15/mo',
    has_free_trial: true, has_api: false, upvotes: 480,
  },
  {
    name: 'Lovable', website: 'https://lovable.dev',
    tagline: 'Build production-ready web apps from a prompt.',
    description: 'Lovable is an AI app builder that turns natural-language prompts into full-stack web applications. Generates React + Tailwind code with Supabase integration, real-time editing, GitHub sync, and one-click deploy.',
    category: 'Code', pricing_model: 'freemium', starting_price: '$25/mo',
    has_free_trial: true, has_api: false, upvotes: 560,
  },
  {
    name: 'Bolt.new', website: 'https://bolt.new',
    tagline: 'AI full-stack web app builder by StackBlitz.',
    description: 'Bolt.new is an in-browser AI app builder by StackBlitz that generates and runs full-stack web apps from a prompt. Supports React, Vue, Svelte, Astro, Next.js with live preview, GitHub deploy, and one-click hosting.',
    category: 'Code', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: false, upvotes: 530,
  },
  {
    name: 'v0', website: 'https://v0.dev',
    tagline: 'Vercel’s AI UI generator and full-stack builder.',
    description: 'v0 by Vercel is an AI-powered generative UI tool that turns prompts and screenshots into production React + Tailwind + shadcn/ui code. Supports full-stack builds with Next.js, deployment to Vercel, and chat-based iteration.',
    category: 'Code', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: false, upvotes: 510,
  },
  {
    name: 'Replit', website: 'https://replit.com',
    tagline: 'Browser IDE with the Replit Agent for building apps.',
    description: 'Replit is a browser-based development platform with the Replit Agent, an AI that builds, deploys, and iterates on full apps from natural-language prompts. Includes hosting, databases, multi-language support, and team collaboration.',
    category: 'Code', pricing_model: 'freemium', starting_price: '$25/mo',
    has_free_trial: true, has_api: false, upvotes: 470,
  },

  // ── Image Generation ─────────────────────────────────────────────────────
  {
    name: 'Midjourney', website: 'https://www.midjourney.com',
    tagline: 'Premier AI image generator with cinematic quality.',
    description: 'Midjourney is an AI image generator known for distinctive, high-quality, cinematic outputs. Used via the Midjourney web app or Discord with style references, character references, and a powerful prompt language. Subscription-only.',
    category: 'Image', pricing_model: 'subscription', starting_price: '$10/mo',
    has_api: false, upvotes: 880,
  },
  {
    name: 'DALL·E 3', website: 'https://openai.com/dall-e-3',
    tagline: 'OpenAI’s image generator inside ChatGPT.',
    description: 'DALL·E 3 is OpenAI’s text-to-image model integrated into ChatGPT and the OpenAI API. Known for prompt fidelity and natural-language editing. Available with ChatGPT Plus or via API for developers.',
    category: 'Image', pricing_model: 'subscription', starting_price: '$20/mo',
    has_api: true, upvotes: 690,
  },
  {
    name: 'Stable Diffusion', website: 'https://stability.ai',
    tagline: 'Open-weight image generation models from Stability AI.',
    description: 'Stable Diffusion is the open-weight family of image generation models from Stability AI, including SD 3.5 and SDXL. Powers thousands of tools and can be run locally, in the cloud, or via the Stability AI API.',
    category: 'Image', pricing_model: 'freemium', has_api: true, upvotes: 720,
  },
  {
    name: 'Leonardo.Ai', website: 'https://leonardo.ai',
    tagline: 'AI image and asset generation for creators.',
    description: 'Leonardo.Ai is a generative image and asset platform for game art, marketing assets, and concept design. Includes fine-tuned models, image-to-image, in-painting, real-time canvas, and an API for production use.',
    category: 'Image', pricing_model: 'freemium', starting_price: '$12/mo',
    has_free_trial: true, has_api: true, upvotes: 520,
  },
  {
    name: 'Ideogram', website: 'https://ideogram.ai',
    tagline: 'AI image generator known for accurate text rendering.',
    description: 'Ideogram is a text-to-image AI especially strong at rendering legible text inside images — useful for posters, logos, mockups, and typography-heavy designs. Free tier available with paid plans for more generations and commercial use.',
    category: 'Image', pricing_model: 'freemium', starting_price: '$8/mo',
    has_free_trial: true, has_api: true, upvotes: 440,
  },
  {
    name: 'Flux', website: 'https://blackforestlabs.ai',
    tagline: 'High-quality open image models from Black Forest Labs.',
    description: 'Flux is a family of open image generation models from Black Forest Labs (Flux.1, Flux Pro, Flux Schnell). Known for photorealism and prompt adherence; available via API and open-source weights for self-hosting.',
    category: 'Image', pricing_model: 'pay_per_use', has_api: true, upvotes: 410,
  },

  // ── Video Generation ─────────────────────────────────────────────────────
  {
    name: 'Sora', website: 'https://sora.com',
    tagline: 'OpenAI’s text-to-video model.',
    description: 'Sora is OpenAI’s text-to-video generation model capable of producing realistic and imaginative video clips from prompts, images, or existing videos. Available to ChatGPT Plus and Pro subscribers via the Sora app.',
    category: 'Video', pricing_model: 'subscription', starting_price: '$20/mo',
    has_api: false, upvotes: 680,
  },
  {
    name: 'Runway', website: 'https://runwayml.com',
    tagline: 'Pro-grade AI video generation and editing suite.',
    description: 'Runway is a pioneering AI video platform with the Gen-3 and Gen-4 video models, plus tools for inpainting, motion brush, lip-sync, and frame interpolation. Used by filmmakers and creative studios. Web app and API.',
    category: 'Video', pricing_model: 'freemium', starting_price: '$15/mo',
    has_free_trial: true, has_api: true, upvotes: 620,
  },
  {
    name: 'Veo', website: 'https://deepmind.google/technologies/veo',
    tagline: 'Google DeepMind’s state-of-the-art video model.',
    description: 'Veo is Google DeepMind’s state-of-the-art text-to-video model, available through Google AI Studio, Vertex AI, the Gemini app, and Google Vids. Supports long shots, cinematic control, and synchronized audio (Veo 3).',
    category: 'Video', pricing_model: 'freemium', has_api: true, upvotes: 530,
  },
  {
    name: 'Kling AI', website: 'https://klingai.com',
    tagline: 'Kuaishou’s photorealistic AI video generator.',
    description: 'Kling AI is a text-to-video and image-to-video model from Kuaishou with strong physics, motion realism, and long-clip generation. Used for ads, shorts, and product videos. Available via web app and API.',
    category: 'Video', pricing_model: 'freemium', starting_price: '$10/mo',
    has_free_trial: true, has_api: true, upvotes: 460,
  },
  {
    name: 'Synthesia', website: 'https://www.synthesia.io',
    tagline: 'AI video creation with realistic avatars.',
    description: 'Synthesia is an enterprise AI video platform that turns text into studio-quality videos with realistic AI avatars in 140+ languages. Used for training, marketing, and internal communications by thousands of companies.',
    category: 'Video', pricing_model: 'subscription', starting_price: '$29/mo',
    has_free_trial: true, has_api: true, upvotes: 540,
  },
  {
    name: 'HeyGen', website: 'https://www.heygen.com',
    tagline: 'AI avatars, video translation, and dubbing.',
    description: 'HeyGen creates realistic AI avatar videos, translates and dubs existing videos into 175+ languages, and offers interactive avatars for training and marketing. Includes API and avatar studio for custom personas.',
    category: 'Video', pricing_model: 'freemium', starting_price: '$24/mo',
    has_free_trial: true, has_api: true, upvotes: 510,
  },

  // ── Voice & Audio ────────────────────────────────────────────────────────
  {
    name: 'ElevenLabs', website: 'https://elevenlabs.io',
    tagline: 'Hyper-realistic AI text-to-speech and voice cloning.',
    description: 'ElevenLabs is a leading AI audio platform for text-to-speech, voice cloning, dubbing, and sound effect generation. Supports 70+ languages with low-latency streaming. Used in apps, audiobooks, games, and accessibility tools. Web app and API.',
    category: 'Audio', pricing_model: 'freemium', starting_price: '$5/mo',
    has_free_trial: true, has_api: true, upvotes: 690,
  },
  {
    name: 'Suno', website: 'https://suno.com',
    tagline: 'AI music generation from a text prompt.',
    description: 'Suno generates complete songs — vocals, instruments, and lyrics — from a single prompt. Used to create original tracks in any genre with optional custom lyrics, persona voices, and stems export. Web app with API access.',
    category: 'Audio', pricing_model: 'freemium', starting_price: '$10/mo',
    has_free_trial: true, has_api: true, upvotes: 580,
  },
  {
    name: 'Udio', website: 'https://www.udio.com',
    tagline: 'High-fidelity AI music creation.',
    description: 'Udio is an AI music generator producing high-fidelity songs across genres with custom lyrics, audio uploads, extension, and remix workflows. Free tier with paid plans for more monthly generations and higher quality.',
    category: 'Audio', pricing_model: 'freemium', starting_price: '$10/mo',
    has_free_trial: true, has_api: false, upvotes: 360,
  },

  // ── Writing & Productivity ───────────────────────────────────────────────
  {
    name: 'Notion AI', website: 'https://www.notion.so/product/ai',
    tagline: 'AI writing, summarization, and Q&A inside Notion.',
    description: 'Notion AI is the AI layer inside Notion workspaces, offering writing assistance, summaries, action items, translation, and a Q&A agent that searches your workspace and connected apps like Slack, Google Drive, and Jira.',
    category: 'Writing', pricing_model: 'subscription', starting_price: '$10/mo',
    has_free_trial: true, has_api: false, upvotes: 580,
  },
  {
    name: 'Grammarly', website: 'https://www.grammarly.com',
    tagline: 'AI writing assistant for grammar, clarity, and tone.',
    description: 'Grammarly is an AI writing assistant offering real-time grammar, spelling, clarity, and tone suggestions across browsers, desktop, and mobile. Grammarly Pro adds generative AI for drafting, rewriting, and citations.',
    category: 'Writing', pricing_model: 'freemium', starting_price: '$12/mo',
    has_free_trial: true, has_api: false, upvotes: 460,
  },
  {
    name: 'Jasper', website: 'https://www.jasper.ai',
    tagline: 'AI content platform for marketing teams.',
    description: 'Jasper is an enterprise AI marketing platform for blog posts, ad copy, brand voice training, campaigns, and image generation. Used by marketing teams with brand controls, workflows, and integrations.',
    category: 'Writing', pricing_model: 'subscription', starting_price: '$39/mo',
    has_free_trial: true, has_api: true, upvotes: 380,
  },
  {
    name: 'Otter.ai', website: 'https://otter.ai',
    tagline: 'AI meeting notes, transcription, and summaries.',
    description: 'Otter.ai records, transcribes, and summarizes meetings across Zoom, Google Meet, and Microsoft Teams. Generates action items, supports searchable transcripts, and integrates with Slack, Salesforce, and HubSpot.',
    category: 'Productivity', pricing_model: 'freemium', starting_price: '$10/mo',
    has_free_trial: true, has_api: false, upvotes: 410,
  },

  // ── Design ───────────────────────────────────────────────────────────────
  {
    name: 'Canva AI', website: 'https://www.canva.com/ai',
    tagline: 'Magic Studio AI tools inside Canva.',
    description: 'Canva’s Magic Studio brings AI features to Canva’s design platform: Magic Write, Magic Edit, Magic Design, Magic Switch, AI image and video generation, and AI presentation building. Free tier with Canva Pro for full access.',
    category: 'Design', pricing_model: 'freemium', starting_price: '$15/mo',
    has_free_trial: true, has_api: true, upvotes: 510,
  },
  {
    name: 'Figma AI', website: 'https://www.figma.com/ai',
    tagline: 'AI features inside Figma for design and prototyping.',
    description: 'Figma AI brings generative features to the Figma design platform — including Make Designs from prompts, asset search, layer rename, content fill, and prototype generation. Available across the Figma suite of design tools.',
    category: 'Design', pricing_model: 'freemium', starting_price: '$15/mo',
    has_free_trial: true, has_api: false, upvotes: 380,
  },

  // ── Automation / Agents ──────────────────────────────────────────────────
  {
    name: 'Zapier AI', website: 'https://zapier.com/ai',
    tagline: 'Build AI agents and automations across 7,000+ apps.',
    description: 'Zapier connects 7,000+ apps with automation and AI features, including Zapier Agents (no-code AI agents), Tables, Interfaces, and Chatbots. Used by millions to automate workflows across the SaaS stack.',
    category: 'Automation', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: true, upvotes: 480,
  },
  {
    name: 'Make', website: 'https://www.make.com',
    tagline: 'Visual no-code platform for AI and app automation.',
    description: 'Make is a visual automation platform for building multi-step workflows across 2,000+ apps including AI services. Features a drag-and-drop scenario builder, AI agents, and granular control over data flow.',
    category: 'Automation', pricing_model: 'freemium', starting_price: '$9/mo',
    has_free_trial: true, has_api: true, upvotes: 320,
  },
  {
    name: 'n8n', website: 'https://n8n.io',
    tagline: 'Open-source workflow automation for technical teams.',
    description: 'n8n is an open-source, source-available workflow automation tool with 400+ integrations and a visual builder. Supports AI workflows with LLMs, vector stores, and agents. Self-hostable or cloud-managed.',
    category: 'Automation', pricing_model: 'freemium', starting_price: '$20/mo',
    has_free_trial: true, has_api: true, upvotes: 360,
  },
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'listmyai_import_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load all categories once
  const { data: cats } = await supabase.from('categories').select('id, name, slug')
  const catList = cats ?? []
  function findCategoryId(needle: string): string | null {
    const n = needle.toLowerCase()
    // Try exact-ish match first, then includes
    const exact = catList.find(c => c.name?.toLowerCase() === n || c.slug?.toLowerCase() === n)
    if (exact) return exact.id
    const partial = catList.find(c => c.name?.toLowerCase().includes(n) || n.includes(c.name?.toLowerCase() ?? ''))
    return partial?.id ?? null
  }

  let updated = 0, created = 0, errors = 0
  const details: { name: string; result: string; error?: string }[] = []

  for (const tool of TOP_TOOLS) {
    try {
      // Find existing by name OR by website OR by domain
      const { data: byName } = await supabase
        .from('ai_tools')
        .select('id, name, website')
        .ilike('name', tool.name)
        .maybeSingle()

      let existing = byName
      if (!existing) {
        const { data: byWeb } = await supabase
          .from('ai_tools')
          .select('id, name, website')
          .eq('website', tool.website)
          .maybeSingle()
        existing = byWeb
      }
      if (!existing) {
        const domain = tool.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('/')[0]
        const { data: byDomain } = await supabase
          .from('ai_tools')
          .select('id, name, website')
          .ilike('website', `%${domain}%`)
          .maybeSingle()
        existing = byDomain
      }

      const catId = findCategoryId(tool.category)
      const slug = slugify(tool.name)

      const baseRow: Record<string, unknown> = {
        name: tool.name,
        slug,
        tagline: tool.tagline,
        description: tool.description,
        website: tool.website,
        pricing_model: tool.pricing_model,
        has_free_trial: tool.has_free_trial ?? false,
        has_api: tool.has_api ?? false,
        is_featured: true,
        status: 'active',
      }
      if (tool.starting_price) baseRow.starting_price = tool.starting_price
      if (tool.logo_url) baseRow.logo_url = tool.logo_url
      if (catId) baseRow.category_id = catId
      if (tool.upvotes) baseRow.upvotes = tool.upvotes

      if (existing) {
        const { error: upErr } = await supabase.from('ai_tools').update(baseRow).eq('id', existing.id)
        if (upErr) {
          // Retry without pricing_model if constraint fails
          if (upErr.message?.includes('check constraint') || upErr.message?.includes('pricing_model')) {
            const r = { ...baseRow }
            delete r.pricing_model
            const { error: e2 } = await supabase.from('ai_tools').update(r).eq('id', existing.id)
            if (e2) { details.push({ name: tool.name, result: 'error', error: e2.message }); errors++; continue }
          } else if (upErr.message?.includes('duplicate key') || upErr.code === '23505') {
            // Slug clash with another row — fall back to keeping existing slug
            const r = { ...baseRow }
            delete r.slug
            const { error: e2 } = await supabase.from('ai_tools').update(r).eq('id', existing.id)
            if (e2) { details.push({ name: tool.name, result: 'error', error: e2.message }); errors++; continue }
          } else {
            details.push({ name: tool.name, result: 'error', error: upErr.message }); errors++; continue
          }
        }
        details.push({ name: tool.name, result: `updated (was: ${existing.name})` })
        updated++
      } else {
        const insertRow = {
          ...baseRow,
          claimed: false,
          is_auto_enrolled: false,
          is_sponsored: false,
          rating_avg: 0,
          rating_count: 0,
          view_count: 0,
          click_count: 0,
        }
        const { error: insErr } = await supabase.from('ai_tools').insert(insertRow)
        if (insErr) {
          if (insErr.code === '23505') {
            // Slug already used — append suffix
            const row2: Record<string, unknown> = { ...insertRow, slug: `${slug}-ai` }
            const { error: e2 } = await supabase.from('ai_tools').insert(row2)
            if (e2) { details.push({ name: tool.name, result: 'error', error: e2.message }); errors++; continue }
          } else {
            details.push({ name: tool.name, result: 'error', error: insErr.message }); errors++; continue
          }
        }
        details.push({ name: tool.name, result: 'created' })
        created++
      }
    } catch (err) {
      details.push({ name: tool.name, result: 'error', error: String(err) })
      errors++
    }
  }

  return NextResponse.json({ updated, created, errors, total: TOP_TOOLS.length, details })
}
