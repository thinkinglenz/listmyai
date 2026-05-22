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

function guessCategory(text: string): string {
  const t = text.toLowerCase()
  if (/image|photo|art|headshot|jewel|render|design/i.test(t)) return 'Image Generation'
  if (/video|film|animation|clip/i.test(t)) return 'Video Generation'
  if (/audio|music|sound|voice|speech|song/i.test(t)) return 'Audio & Music'
  if (/code|program|developer|github|next\.?js|website build/i.test(t)) return 'Code Assistant'
  if (/seo|marketing|ads|campaign|poster/i.test(t)) return 'SEO & Marketing'
  if (/write|writing|copy|blog|essay|content|ppt|powerpoint|present/i.test(t)) return 'Writing & Copy'
  if (/data|analytic|chart|spreadsheet|scrape|crawl/i.test(t)) return 'Data & Analytics'
  if (/search|research|knowledge|market research/i.test(t)) return 'AI Search'
  if (/automat|workflow|integrat/i.test(t)) return 'Automation'
  if (/education|learn|study|tutor/i.test(t)) return 'Education'
  if (/health|medical|fitness|sport/i.test(t)) return 'Healthcare'
  if (/finance|legal|law|contract|gift/i.test(t)) return 'Finance & Legal'
  if (/chat|assistant|bot|gpt|whatsapp/i.test(t)) return 'Chatbot / Assistant'
  return 'Other'
}

interface Deal {
  name: string
  website: string
  promo_code?: string
  promo_desc?: string
  pricing_model?: string
  starting_price?: string
  has_free_trial?: boolean
  description?: string
}

const DEALS: Deal[] = [
  // Featured Deals
  { name: 'FineVoice', website: 'https://finevoice.ai', promo_code: 'TOPAITOOLS26', promo_desc: '30% off — Create personalized AI voices and video voiceovers', pricing_model: 'subscription', description: 'Create personalized AI voices and video voiceovers with advanced voice cloning technology. Supports 1,500+ voices in 154 languages.' },
  { name: 'Osum', website: 'https://osum.com', promo_code: 'TOPAI', promo_desc: '20% off — Instant market research reports with AI insights', pricing_model: 'subscription', description: 'Instant AI-powered market research reports with deep insights, SWOT analysis, buyer personas, and growth opportunities for any product or business.' },
  { name: 'Nova Headshot', website: 'https://www.novaheadshot.com', promo_code: 'TRYNOW50', promo_desc: '50% off — Generate high-quality AI headshots', pricing_model: 'pay_per_use', description: 'Generate high-quality professional headshots using AI for LinkedIn, resumes, and online platforms. Transform selfies into studio-quality photos in minutes.' },
  { name: 'TheLibrarian.io', website: 'https://thelibrarian.io', promo_code: 'TOPAI50', promo_desc: '50% off for 3 months — AI-powered WhatsApp assistant', pricing_model: 'subscription', description: 'AI-powered WhatsApp personal assistant that manages your inbox, calendar, and reminders. Integrates with Gmail, Google Drive, Slack, and Notion.' },

  // Lifetime Deals
  { name: 'IdeaAize', website: 'https://ideaaize.com', promo_desc: 'Lifetime deal — $79 for AI content, image, code, chatbot, and voice creation', pricing_model: 'one_time', starting_price: '$79', description: 'All-in-one AI creation hub for content, images, code, chatbots, and voiceovers. Supports 55+ languages with OpenAI and Stable Diffusion models.' },
  { name: 'QuillGenius', website: 'https://quillgenius.com', promo_desc: 'Lifetime deal — $39 for AI copywriting and collaboration', pricing_model: 'one_time', starting_price: '$39', description: 'AI copywriting assistant that generates blog posts, social media content, product descriptions, and more with text-to-speech and AI chat features.' },
  { name: '1min.AI', website: 'https://1min.ai', promo_desc: 'Lifetime deal — $39 for AI text, image, audio, and video', pricing_model: 'one_time', starting_price: '$39', description: 'All-in-one AI app for text, image, audio, and video creation powered by OpenAI, Stability AI, Google, and Anthropic models. Available on web, iOS, Android, and desktop.' },
  { name: 'Screpy', website: 'https://screpy.com', promo_desc: 'Lifetime deal — $69 for AI website optimization and SEO', pricing_model: 'one_time', starting_price: '$69', description: 'AI-powered website analysis tool for SEO audits, pagespeed monitoring, uptime tracking, keyword ranking, and competitor analysis in one dashboard.' },
  { name: 'Notepad AI', website: 'https://www.learnitive.com', promo_desc: 'Lifetime deal — $29 for all-in-one AI editor', pricing_model: 'one_time', starting_price: '$29', description: 'All-in-one AI-powered editor with writing assistance, code execution, and design capabilities. Supports multiple file formats with dark and light themes.' },
  { name: 'Learnitive', website: 'https://www.learnitive.com', promo_desc: 'Lifetime deal — $49 for AI writing, coding, and project management', pricing_model: 'one_time', starting_price: '$49', description: 'AI-enabled interactive academic workspace with AI writer, code playgrounds in 50+ languages, Kanban boards, calendars, and collaborative note-taking.' },
  { name: 'Slashit App', website: 'https://www.slashit.app', promo_desc: 'Lifetime deal — $49 for AI writing automation', pricing_model: 'one_time', starting_price: '$49', description: 'Text expander and AI writing tool with dynamic templates, snippets, clipboard history, and AI-powered sentence rewriting. Works with ChatGPT and Gemini.' },

  // Limited Time Deals
  { name: 'PosterMyWall', website: 'https://www.postermywall.com', promo_code: 'TOPAI30', promo_desc: '30% off — Create marketing designs and campaign creatives', pricing_model: 'freemium', description: 'All-in-one AI marketing platform for creating designs, social posts, email campaigns, and event pages with millions of templates and drag-and-drop editing.' },
  { name: 'Wonderchat', website: 'https://wonderchat.io', promo_code: 'TOPAITOOLS384HV', promo_desc: '10% off — Build custom AI chatbots from your data', pricing_model: 'freemium', description: 'No-code AI chatbot builder that creates custom chatbots trained on your website, PDFs, or Zendesk data. Supports 40+ languages with 5-minute setup.' },
  { name: 'Mysports.AI', website: 'https://mysports.ai', promo_code: 'topai777', promo_desc: '15% off — AI-powered sports predictions', pricing_model: 'subscription', starting_price: '$199/mo', description: 'AI sports prediction platform covering NBA, NFL, MLB, NHL, EPL, La Liga, and more. Uses deep machine learning with 75%+ accuracy across 200+ daily matches.' },
  { name: 'Vadoo AI', website: 'https://www.vadoo.tv', promo_code: 'AI30', promo_desc: '30% off — AI video creation from text and images', pricing_model: 'freemium', description: 'All-in-one AI video generator for TikToks, Reels, Shorts, and podcasts with AI scriptwriting, captions, voiceovers, B-roll, and auto-posting.' },
  { name: 'Cabina AI', website: 'https://cabina.ai', promo_code: 'TOPAI25TOOLS', promo_desc: '25% off — All-in-one AI chat workspace', pricing_model: 'freemium', description: 'Universal AI workspace integrating 25+ models including ChatGPT, Claude, and Gemini in one chat. Supports PDF analysis, image generation, and custom actions.' },
  { name: 'Flowith', website: 'https://flowith.io', promo_code: 'TOPAITOOLS', promo_desc: 'Free Nano tier — Canvas-based agentic AI workspace', pricing_model: 'freemium', has_free_trial: true, description: 'Agentic AI workspace on an infinite canvas with 40+ AI models, knowledge management, and real-time collaboration. Used by 1M+ users worldwide.' },
  { name: 'MusicMakerApp', website: 'https://www.musicmakerapp.com', promo_code: 'TOPAITOOL30', promo_desc: '30% off — Generate AI songs from text or lyrics', pricing_model: 'freemium', description: 'AI music generator creating royalty-free songs with vocals, instruments, and mixing from text descriptions or lyrics. By Dreamspark AI LLC.' },
  { name: 'Tool.Video', website: 'https://tool.video', promo_code: 'TOOLVIDEO', promo_desc: 'Special discount — AI videos, images, music, and ads', pricing_model: 'subscription', description: 'All-in-one AI video generation toolkit with Sora 2, Nano Banana Pro, and Suno 5 integration for videos, thumbnails, images, and music from one dashboard.' },
  { name: 'FaceFinder ID', website: 'https://www.facefinder.id', promo_code: 'TOPAI30', promo_desc: '30% off — AI reverse face and image search', pricing_model: 'pay_per_use', description: 'AI reverse face search engine scanning 50M+ indexed faces across social media, dating sites, and the web for identity verification and people search.' },
  { name: 'Pixwit.ai', website: 'https://pixwit.ai', promo_code: 'PIXWIT', promo_desc: '30% off — AI video from text and images', pricing_model: 'subscription', description: 'All-in-one AI video platform integrating Sora 2, Kling, Runway, Veo, Wan, and Seedance models. Create ads, avatars, and long-form videos from text or images.' },
  { name: 'GIFTS AI', website: 'https://giftsai.com', promo_code: 'NEWUSER15', promo_desc: '$15 off — AI personalized gift recommendations', pricing_model: 'subscription', description: 'AI-driven personalized gift recommendations analyzing recipient preferences, relationship dynamics, and trends. Includes occasion reminders and gift management.' },
  { name: 'Text to Song AI', website: 'https://texttosong.ai', promo_code: 'TOPAITOOLS', promo_desc: '10% off — Generate full songs from text', pricing_model: 'freemium', description: 'AI song generator creating complete multi-track songs with vocals, instruments, and mixing from lyrics or text descriptions in under 30 seconds.' },
  { name: 'GoalSim', website: 'https://goalsim.com', promo_code: 'GOALSIMBEFOREAPR26', promo_desc: '40% off — AI life goal simulation game', pricing_model: 'freemium', description: 'AI-powered life simulation game with branching narratives. Set any goal — becoming President, walking on Mars — and the AI adapts the story to your decisions.' },
  { name: 'GenPPT AI', website: 'https://genppt.com', promo_code: 'GENPPT40OFF', promo_desc: '40% off — AI PowerPoint presentations', pricing_model: 'freemium', description: 'Fastest AI PowerPoint generator creating complete slide decks with speaker notes from text prompts. Compatible with PowerPoint, Google Slides, and Keynote.' },
  { name: 'Accomplish It', website: 'https://www.goaccomplishit.com', promo_code: 'FRIENDS20', promo_desc: '20% off for 3 months — AI accomplishment tracking', pricing_model: 'subscription', description: 'AI-driven professional accomplishment tracker. Email weekly updates, let AI polish them into career artifacts like resumes, profiles, and shareable timelines.' },
  { name: 'RenderAI', website: 'https://renderai.app', promo_code: 'TOPAI20RAI113', promo_desc: 'Special discount — AI sketch-to-4K renders', pricing_model: 'subscription', description: 'AI tool converting hand-drawn sketches into photorealistic 4K+ renders and animations in seconds. For architects, interior designers, and product designers.' },
  { name: 'Olostep', website: 'https://www.olostep.com', promo_code: 'AITOOLYKZ10', promo_desc: '10% off — AI web crawling and scraping', pricing_model: 'freemium', description: 'Web scraping, crawling, and search API for AI agents. Extracts clean markdown or JSON from any URL with automatic JS rendering and anti-bot handling.' },
  { name: 'AI Jewellery Model', website: 'https://aijewelrymodel.com', promo_code: 'WELCOME30', promo_desc: '30% off — AI product photos for jewelry', pricing_model: 'pay_per_use', description: 'AI-generated model-wearing jewelry product images for e-commerce. Upload product shots, choose model style, and get realistic photos for Amazon, Shopify, and Etsy.' },
  { name: 'PageAI', website: 'https://pageai.pro', promo_code: 'TOPAI', promo_desc: '30% off — AI-generated Next.js websites', pricing_model: 'one_time', description: 'AI website builder generating production-ready Next.js codebases from a single prompt. Includes SEO, blog, themes, TypeScript, Tailwind CSS, and Shadcn UI.' },
  { name: 'MygomSEO', website: 'https://mygomseo.com', promo_code: 'TOPAI2026', promo_desc: 'Special offer — AI SEO audits and publishing', pricing_model: 'freemium', description: 'AI marketing agent replacing social schedulers, content writers, and SEO tools. Includes technical audits, keyword tracking, AI content writing, and social publishing.' },
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'listmyai_import_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let updated = 0, created = 0, errors = 0
  const details: { name: string; result: string; error?: string }[] = []

  for (const deal of DEALS) {
    try {
      // Try to find existing tool by name (case-insensitive) OR by website
      const { data: byName } = await supabase
        .from('ai_tools')
        .select('id, name, promo_code, website')
        .ilike('name', deal.name)
        .maybeSingle()

      let existing = byName
      if (!existing && deal.website) {
        // Also check by exact website URL
        const { data: byWeb } = await supabase
          .from('ai_tools')
          .select('id, name, promo_code, website')
          .eq('website', deal.website)
          .maybeSingle()
        existing = byWeb
      }
      if (!existing && deal.website) {
        // Also check by website domain (partial match)
        const domain = deal.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
        const { data: byDomain } = await supabase
          .from('ai_tools')
          .select('id, name, promo_code, website')
          .ilike('website', `%${domain}%`)
          .maybeSingle()
        existing = byDomain
      }
      if (!existing) {
        // Last resort: search by partial name match
        const shortName = deal.name.split(/[\s.]/)[0]  // "TheLibrarian.io" → "TheLibrarian"
        if (shortName.length >= 4) {
          const { data: byPartial } = await supabase
            .from('ai_tools')
            .select('id, name, promo_code, website')
            .ilike('name', `%${shortName}%`)
            .limit(1)
            .maybeSingle()
          existing = byPartial
        }
      }

      if (existing) {
        // Update existing tool with deal info + website if missing
        const updates: Record<string, unknown> = {}
        if (deal.promo_code) updates.promo_code = deal.promo_code
        if (deal.promo_desc) updates.promo_desc = deal.promo_desc
        if (deal.pricing_model) updates.pricing_model = deal.pricing_model
        if (deal.starting_price) updates.starting_price = deal.starting_price
        if (deal.has_free_trial) updates.has_free_trial = true
        if (deal.website && (!existing.website || existing.website === '')) updates.website = deal.website
        if (deal.description && deal.description.length > 30) updates.description = deal.description
        // Fix ugly timestamp slugs
        const existingName = (existing.name || '').toLowerCase()
        const cleanSlug = slugify(existing.name || deal.name)
        // If current name in DB contains timestamp pattern, update the slug
        updates.slug = cleanSlug
        updates.name = deal.name  // ensure proper casing

        if (Object.keys(updates).length > 0) {
          const { error: upErr } = await supabase.from('ai_tools').update(updates).eq('id', existing.id)
          if (upErr) {
            if (upErr.message?.includes('check constraint') || upErr.message?.includes('pricing_model')) {
              delete updates.pricing_model
              const { error: r2 } = await supabase.from('ai_tools').update(updates).eq('id', existing.id)
              if (r2) { details.push({ name: deal.name, result: 'error', error: r2.message }); errors++; continue }
            } else {
              details.push({ name: deal.name, result: 'error', error: upErr.message }); errors++; continue
            }
          }
        }
        details.push({ name: deal.name, result: `updated (${existing.name})` })
        updated++
      } else {
        // Create new tool
        const combined = `${deal.name} ${deal.description ?? ''} ${deal.promo_desc ?? ''}`
        const category = guessCategory(combined)
        const { data: cat } = await supabase.from('categories').select('id').ilike('name', `%${category.split(' ')[0]}%`).maybeSingle()

        const slug = slugify(deal.name)
        const tagline = (deal.description ?? deal.promo_desc ?? deal.name).split(/[.!?]/)[0].slice(0, 120)

        const row: Record<string, unknown> = {
          slug, name: deal.name, tagline,
          description: deal.description ?? deal.promo_desc ?? '',
          website: deal.website, category_id: cat?.id ?? null,
          status: 'active', claimed: false, is_auto_enrolled: true,
          is_featured: false, is_sponsored: false,
          upvotes: 0, rating_avg: 0, rating_count: 0, view_count: 0, click_count: 0,
        }
        if (deal.promo_code) row.promo_code = deal.promo_code
        if (deal.promo_desc) row.promo_desc = deal.promo_desc
        if (deal.pricing_model) row.pricing_model = deal.pricing_model
        if (deal.starting_price) row.starting_price = deal.starting_price
        if (deal.has_free_trial) row.has_free_trial = true

        const { error: insErr } = await supabase.from('ai_tools').insert(row)
        if (insErr) {
          // Duplicate slug → add timestamp
          if (insErr.code === '23505') {
            row.slug = `${slug}-${Date.now()}`
            const { error: r2 } = await supabase.from('ai_tools').insert(row)
            if (r2) {
              if (r2.message?.includes('check constraint') || r2.message?.includes('pricing_model')) {
                delete row.pricing_model
                const { error: r3 } = await supabase.from('ai_tools').insert(row)
                if (r3) { details.push({ name: deal.name, result: 'error', error: r3.message }); errors++; continue }
              } else {
                details.push({ name: deal.name, result: 'error', error: r2.message }); errors++; continue
              }
            }
          } else if (insErr.message?.includes('check constraint') || insErr.message?.includes('pricing_model')) {
            delete row.pricing_model
            const { error: r2 } = await supabase.from('ai_tools').insert(row)
            if (r2) { details.push({ name: deal.name, result: 'error', error: r2.message }); errors++; continue }
          } else {
            details.push({ name: deal.name, result: 'error', error: insErr.message }); errors++; continue
          }
        }
        details.push({ name: deal.name, result: 'created' })
        created++
      }
    } catch (err) {
      details.push({ name: deal.name, result: 'error', error: String(err) })
      errors++
    }
  }

  return NextResponse.json({ updated, created, errors, total: DEALS.length, details })
}
