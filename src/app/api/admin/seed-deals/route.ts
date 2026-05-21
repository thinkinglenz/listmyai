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
  if (/image|photo|art|headshot|jewel/i.test(t)) return 'Image Generation'
  if (/video|film|animation|clip/i.test(t)) return 'Video Generation'
  if (/audio|music|sound|voice|speech|song/i.test(t)) return 'Audio & Music'
  if (/code|program|developer|github|next\.?js/i.test(t)) return 'Code Assistant'
  if (/seo|marketing|ads|campaign|poster/i.test(t)) return 'SEO & Marketing'
  if (/write|writing|copy|blog|essay|content|ppt|powerpoint|present/i.test(t)) return 'Writing & Copy'
  if (/data|analytic|chart|spreadsheet|scrape|crawl/i.test(t)) return 'Data & Analytics'
  if (/search|research|knowledge|market research/i.test(t)) return 'AI Search'
  if (/automat|workflow|integrat/i.test(t)) return 'Automation'
  if (/education|learn|study|tutor/i.test(t)) return 'Education'
  if (/health|medical|fitness|sport/i.test(t)) return 'Healthcare'
  if (/finance|legal|law|contract|gift/i.test(t)) return 'Finance & Legal'
  if (/chat|assistant|bot|gpt|whatsapp/i.test(t)) return 'Chatbot / Assistant'
  if (/render|design|3d/i.test(t)) return 'Image Generation'
  return 'Other'
}

interface Deal {
  name: string
  promo_code?: string
  promo_desc?: string
  pricing_model?: string
  starting_price?: string
  has_free_trial?: boolean
  description?: string
}

const DEALS: Deal[] = [
  // Featured Deals
  { name: 'FineVoice', promo_code: 'TOPAITOOLS26', promo_desc: '30% off — Create personalized AI voices and video voiceovers', pricing_model: 'subscription', description: 'Create personalized AI voices and video voiceovers with advanced voice cloning technology.' },
  { name: 'Osum', promo_code: 'TOPAI', promo_desc: '20% off — Instant market research reports with AI insights', pricing_model: 'subscription', description: 'Instant AI-powered market research reports with deep insights for businesses.' },
  { name: 'Nova Headshot', promo_code: 'TRYNOW50', promo_desc: '50% off — Generate high-quality AI headshots', pricing_model: 'pay_per_use', description: 'Generate high-quality professional headshots using AI for LinkedIn, resumes, and online platforms.' },
  { name: 'TheLibrarian.io', promo_code: 'TOPAI50', promo_desc: '50% off for 3 months — AI-powered WhatsApp assistant', pricing_model: 'subscription', description: 'Enhance productivity through an AI-powered WhatsApp assistant that manages your knowledge.' },

  // Lifetime Deals
  { name: 'IdeaAize', promo_desc: 'Lifetime deal — $79 for AI content, image, code, chatbot, and voice creation', pricing_model: 'one_time', starting_price: '$79', description: 'AI platform for content, image, code, chatbot, and voice creation — all in one.' },
  { name: 'QuillGenius', promo_desc: 'Lifetime deal — $39 for AI copywriting and collaboration', pricing_model: 'one_time', starting_price: '$39', description: 'AI copywriting tool for seamless content creation and team collaboration.' },
  { name: '1min.AI', promo_desc: 'Lifetime deal — $39 for AI text, image, audio, and video', pricing_model: 'one_time', starting_price: '$39', description: 'AI-powered all-in-one platform for text, image, audio, and video content creation.' },
  { name: 'Screpy', promo_desc: 'Lifetime deal — $69 for AI website optimization and SEO', pricing_model: 'one_time', starting_price: '$69', description: 'AI-powered tool that optimizes website visibility, performance, and search engine reach.' },
  { name: 'Notepad AI', promo_desc: 'Lifetime deal — $29 for all-in-one AI editor', pricing_model: 'one_time', starting_price: '$29', description: 'All-in-one editor with AI-driven writing, coding, and design capabilities.' },
  { name: 'Learnitive', promo_desc: 'Lifetime deal — $49 for AI writing, coding, and project management', pricing_model: 'one_time', starting_price: '$49', description: 'AI-powered writing, coding, and project management workspace in one platform.' },
  { name: 'Slashit App', promo_desc: 'Lifetime deal — $49 for AI writing automation', pricing_model: 'one_time', starting_price: '$49', description: 'Automate and personalize writing with AI templates, prompts, and intelligent suggestions.' },

  // Limited Time Deals
  { name: 'PosterMyWall', promo_code: 'TOPAI30', promo_desc: '30% off — Create marketing designs and campaign creatives', pricing_model: 'subscription', description: 'Create outstanding marketing designs and campaign creatives with AI-assisted tools.' },
  { name: 'Wonderchat', promo_code: 'TOPAITOOLS384HV', promo_desc: '10% off — Build custom AI chatbots from your data', pricing_model: 'subscription', description: 'Build custom AI chatbots trained on your website or business data in minutes.' },
  { name: 'Mysports.AI', promo_code: 'topai777', promo_desc: '15% off — AI-powered sports predictions', pricing_model: 'subscription', description: 'AI-powered sports prediction platform for analyzing and forecasting sports event outcomes.' },
  { name: 'Vadoo AI', promo_code: 'AI30', promo_desc: '30% off — AI video creation from text and images', pricing_model: 'subscription', description: 'AI-driven video creation platform that turns text and images into professional videos.' },
  { name: 'Cabina AI', promo_code: 'TOPAI25TOOLS', promo_desc: '25% off — Streamlined AI content creation', pricing_model: 'subscription', description: 'Streamlined content creation platform using multiple AI models for text and images.' },
  { name: 'Flowith', promo_code: 'TOPAITOOLS', promo_desc: 'Free Nano tier — Canvas-based agentic AI workspace', pricing_model: 'freemium', has_free_trial: true, description: 'Canvas-based agentic workspace powered by AI for creative and productive workflows.' },
  { name: 'MusicMakerApp', promo_code: 'TOPAITOOL30', promo_desc: '30% off — Generate AI songs from text or lyrics', pricing_model: 'subscription', description: 'Generate AI-composed, platform-ready songs from text descriptions or lyrics input.' },
  { name: 'Tool.Video', promo_code: 'TOOLVIDEO', promo_desc: 'Special discount — AI videos, images, music, and ads', pricing_model: 'subscription', description: 'AI-driven platform for generating videos, images, music, and advertising assets.' },
  { name: 'FaceFinder ID', promo_code: 'TOPAI30', promo_desc: '30% off — AI reverse face and image search', pricing_model: 'subscription', description: 'AI-powered reverse face search and image recognition platform.' },
  { name: 'Pixwit.ai', promo_code: 'PIXWIT', promo_desc: '30% off — AI video from text and images', pricing_model: 'subscription', description: 'AI-powered platform generating multi-scene videos from text and image inputs.' },
  { name: 'GIFTS AI', promo_code: 'NEWUSER15', promo_desc: '$15 off — AI personalized gift recommendations', pricing_model: 'subscription', description: 'AI-driven personalized gift recommendations and curated gift lists for any occasion.' },
  { name: 'Text to Song AI', promo_code: 'TOPAITOOLS', promo_desc: '10% off — Generate full songs from text', pricing_model: 'subscription', description: 'AI generates full multi-track songs from lyrics and text descriptions.' },
  { name: 'GoalSim', promo_code: 'GOALSIMBEFOREAPR26', promo_desc: '40% off — AI goal simulation and planning', pricing_model: 'subscription', description: 'AI generates branching narratives simulating long-term goal pursuit and outcomes.' },
  { name: 'GenPPT AI', promo_code: 'GENPPT40OFF', promo_desc: '40% off — AI PowerPoint presentations', pricing_model: 'subscription', description: 'AI generates editable PowerPoint presentations from text, files, and web content.' },
  { name: 'Accomplish It', promo_code: 'FRIENDS20', promo_desc: '20% off for 3 months — AI accomplishment tracking', pricing_model: 'subscription', description: 'AI-driven capture and organization of professional accomplishments and career highlights.' },
  { name: 'RenderAI', promo_code: 'TOPAI20RAI113', promo_desc: 'Special discount — AI sketch-to-4K renders', pricing_model: 'subscription', description: 'AI-powered tool converting sketches into photorealistic 4K renders and animations.' },
  { name: 'Olostep', promo_code: 'AITOOLYKZ10', promo_desc: '10% off — AI web crawling and scraping', pricing_model: 'subscription', description: 'AI-powered web crawling and scraping platform for intelligent data extraction.' },
  { name: 'AI Jewellery Model', promo_code: 'WELCOME30', promo_desc: '30% off — AI product photos for jewelry', pricing_model: 'pay_per_use', description: 'AI-generated model-wearing jewelry product images for e-commerce listings.' },
  { name: 'PageAI', promo_code: 'TOPAI', promo_desc: '30% off — AI-generated Next.js websites', pricing_model: 'subscription', description: 'AI generates production-ready Next.js websites from a single text prompt.' },
  { name: 'MygomSEO', promo_code: 'TOPAI2026', promo_desc: 'Special offer — AI SEO audits and publishing', pricing_model: 'subscription', description: 'AI automates SEO audits, content workflows, and cross-platform publishing for marketers.' },
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
      // Try to find existing tool by name (case-insensitive)
      const { data: existing } = await supabase
        .from('ai_tools')
        .select('id, name, promo_code')
        .ilike('name', deal.name)
        .maybeSingle()

      if (existing) {
        // Update existing tool with deal info
        const updates: Record<string, unknown> = {}
        if (deal.promo_code) updates.promo_code = deal.promo_code
        if (deal.promo_desc) updates.promo_desc = deal.promo_desc
        if (deal.pricing_model) updates.pricing_model = deal.pricing_model
        if (deal.starting_price) updates.starting_price = deal.starting_price
        if (deal.has_free_trial) updates.has_free_trial = true

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
        details.push({ name: deal.name, result: 'updated' })
        updated++
      } else {
        // Create new tool
        const combined = `${deal.name} ${deal.description ?? ''} ${deal.promo_desc ?? ''}`
        const category = guessCategory(combined)
        const { data: cat } = await supabase.from('categories').select('id').ilike('name', `%${category.split(' ')[0]}%`).maybeSingle()

        const slug = `${slugify(deal.name)}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        const tagline = (deal.description ?? deal.promo_desc ?? deal.name).split(/[.!?]/)[0].slice(0, 120)

        const row: Record<string, unknown> = {
          slug, name: deal.name, tagline,
          description: deal.description ?? deal.promo_desc ?? '',
          website: '', category_id: cat?.id ?? null,
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
          if (insErr.message?.includes('check constraint') || insErr.message?.includes('pricing_model')) {
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
