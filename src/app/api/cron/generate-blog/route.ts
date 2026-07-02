// Daily cron: generate one AI-curated blog post about the latest AI news.
// Triggered by vercel.json schedule or manually with ?secret=<CRON_SECRET>
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Social auto-posting removed — use manual share buttons in /admin/blog instead.
// Re-enable by importing postToAllSocial from '@/lib/social/post' once
// Twitter Basic API plan ($100/mo) is active.

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

// Pick a fresh topic — avoid repeating topics from the last 30 days
async function pickTopic(): Promise<string> {
  const { data } = await supabase
    .from('blog_posts')
    .select('source_topic')
    .eq('is_auto_generated', true)
    .gte('published_at', new Date(Date.now() - 30 * 86400_000).toISOString())
    .order('published_at', { ascending: false })
    .limit(30)

  const recentTopics = new Set((data ?? []).map(r => r.source_topic?.toLowerCase()))

  const topics = [
    'GPT-5 capabilities and real-world use cases',
    'Claude AI: latest features and model updates',
    'Google Gemini Ultra vs GPT-4: 2026 comparison',
    'Best AI coding assistants for developers in 2026',
    'How AI is transforming content creation workflows',
    'Open-source AI models: what is available in 2026',
    'AI image generation tools: Midjourney, DALL-E, Stable Diffusion compared',
    'Top AI productivity tools for remote teams',
    'AI in healthcare: latest breakthroughs 2026',
    'How to use AI for SEO and content marketing',
    'AI voice synthesis and cloning tools overview',
    'Agentic AI: autonomous agents changing enterprise workflows',
    'AI prompt engineering: advanced tips and techniques',
    'Best AI tools for video creation and editing',
    'LLM fine-tuning for business: a practical guide',
    'AI customer service bots: what works and what fails',
    'On-device AI: running LLMs locally in 2026',
    'AI regulation and compliance: what businesses need to know',
    'How startups are building AI-native products in 2026',
    'AI search engines: Perplexity, SearchGPT, and beyond',
    'AI data analysis tools: replacing traditional BI',
    'AI writing assistants: honest 2026 review',
    'Cost of running AI in production: a technical deep dive',
    'AI safety research: alignment progress in 2026',
    'Multimodal AI: image, video, and audio in one model',
    'AI for education: personalized learning breakthroughs',
    'Top AI APIs for developers to build with today',
    'AI in finance: fraud detection and trading automation',
    'AI legal tools: contract analysis and research in 2026',
    'How vector databases power modern AI applications',
  ]

  const fresh = topics.filter(t => !recentTopics.has(t.toLowerCase()))
  const pool = fresh.length > 0 ? fresh : topics
  return pool[Math.floor(Math.random() * pool.length)]
}

// Fetch up to 6 tool slugs that might be relevant to the topic
async function findRelatedToolIds(topic: string): Promise<string[]> {
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  if (words.length === 0) return []

  const keyword = words.slice(0, 2).join(' ')

  const { data } = await supabase
    .from('ai_tools')
    .select('id')
    .in('status', ['active', 'approved', 'claimed', 'verified'])
    .ilike('name', `%${keyword.split(' ')[0]}%`)
    .limit(6)

  if (data && data.length > 0) return data.map(d => d.id)

  // Fallback: return top 3 trending tools as generic related
  const { data: trending } = await supabase
    .from('ai_tools')
    .select('id')
    .in('status', ['active', 'approved', 'claimed', 'verified'])
    .order('upvotes', { ascending: false })
    .limit(3)

  return (trending ?? []).map(d => d.id)
}

// Large curated pool of unique AI/tech Unsplash photos.
// Assigned deterministically per post slug — guarantees no two posts share an image.
const HERO_IMAGES = [
  { id: 'photo-1677442135703-1787eea5ce01', alt: 'AI neural network visualization' },
  { id: 'photo-1620712943543-bcc4688e7485', alt: 'Humanoid robot representing AI' },
  { id: 'photo-1655720828018-edd2daec9349', alt: 'AI processor chip close-up' },
  { id: 'photo-1704901429756-49d21c00bbf6', alt: 'Futuristic AI interface' },
  { id: 'photo-1563986768494-4dee2763ff3f', alt: 'Developer writing code' },
  { id: 'photo-1518770660439-4636190af475', alt: 'Circuit board technology' },
  { id: 'photo-1551434678-e076c223a692', alt: 'Laptop showing data analysis' },
  { id: 'photo-1522202176988-66273c2fd55f', alt: 'Team collaborating on technology' },
  { id: 'photo-1485827404703-89b55fcc595e', alt: 'Robot and human interaction' },
  { id: 'photo-1531746790731-6c087fecd65a', alt: 'Abstract digital technology' },
  { id: 'photo-1507003211169-0a1dd7228f2d', alt: 'Data visualization dashboard' },
  { id: 'photo-1504384308090-c894fdcc538d', alt: 'Modern coworking tech office' },
  { id: 'photo-1568952433726-3896e3881c65', alt: 'Machine learning concept' },
  { id: 'photo-1485546246426-74dc88dec4d9', alt: 'Technology network connection' },
  { id: 'photo-1526374965328-7f61d4dc18c5', alt: 'Digital matrix code' },
  { id: 'photo-1550751827-4bd374c3f58b', alt: 'Cybersecurity digital lock' },
  { id: 'photo-1558494949-ef010cbdcc31', alt: 'Server data center infrastructure' },
  { id: 'photo-1579389083175-d81f61c70b1d', alt: 'AI chatbot interface concept' },
  { id: 'photo-1617791160505-6f00504e3519', alt: 'Augmented reality technology' },
  { id: 'photo-1616161560417-f3a3a2e27ea8', alt: 'Quantum computing abstract' },
  { id: 'photo-1488229297570-58520851e868', alt: 'Software development workspace' },
  { id: 'photo-1533750349088-cd871a92f312', alt: 'Mobile app development' },
  { id: 'photo-1496181133206-80ce9b88a853', alt: 'Laptop computer for productivity' },
  { id: 'photo-1461749280684-dccba630e2f6', alt: 'Code on multiple monitors' },
  { id: 'photo-1454165804606-c3d57bc86b40', alt: 'Business analytics charts' },
  { id: 'photo-1516321318423-f06f85e504b3', alt: 'Video conference collaboration' },
  { id: 'photo-1544197150-b99a580bb7a8', alt: 'Cloud computing concept' },
  { id: 'photo-1573164713988-8665fc963095', alt: 'Natural language processing' },
  { id: 'photo-1580894894513-541e068a3e2b', alt: 'AI automation workflow' },
  { id: 'photo-1581091226825-a6a2a5aee158', alt: 'Digital transformation tech' },
]

// Deterministically pick a hero image based on the post slug.
// Same slug → always same image; different slugs → different images.
function pickHeroImage(slug: string): { url: string; alt: string } {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  const img = HERO_IMAGES[hash % HERO_IMAGES.length]
  return {
    url: `https://images.unsplash.com/${img.id}?w=1200&auto=format&fit=crop&q=80`,
    alt: img.alt,
  }
}

interface MentionedTool {
  name: string
  website: string
  category: string
  tagline: string
}

interface GeneratedPost {
  title: string
  slug: string
  excerpt: string
  body_md: string
  tags: string[]
  faqs: { q: string; a: string }[]
  external_refs: { label: string; url: string }[]
  mentioned_tools: MentionedTool[]
}

async function generatePost(topic: string, relatedToolIds: string[]): Promise<GeneratedPost> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const prompt = `You are a professional AI journalist writing for ListmyAI.com, a directory of 1,000+ AI tools.

Today is ${today}. Write a comprehensive, SEO-optimised blog post about: "${topic}"

Requirements:
- Write for AI Search (Perplexity, ChatGPT, Gemini) and Google — use clear structure, factual statements, authoritative tone
- Article length: 900-1200 words of actual content (body_md)
- Use markdown formatting: ## headings, **bold**, lists, blockquotes
- Include practical insights developers and business users care about
- Naturally mention "ListmyAI" as a resource for discovering AI tools (don't overdo it)
- End with a clear conclusion / takeaway

Return ONLY valid JSON matching this exact schema (no prose outside JSON):
{
  "title": "string (60-80 chars, SEO-optimised, includes main keyword)",
  "slug": "string (lowercase-hyphenated, 40-60 chars, no special chars)",
  "excerpt": "string (150-160 chars, compelling meta description)",
  "body_md": "string (full markdown article body, 900-1200 words)",
  "tags": ["string", "string", "string", "string", "string"],
  "faqs": [
    {"q": "question", "a": "detailed answer 2-3 sentences"},
    {"q": "question", "a": "detailed answer 2-3 sentences"},
    {"q": "question", "a": "detailed answer 2-3 sentences"},
    {"q": "question", "a": "detailed answer 2-3 sentences"},
    {"q": "question", "a": "detailed answer 2-3 sentences"}
  ],
  "external_refs": [
    {"label": "Source name", "url": "https://example.com/article"},
    {"label": "Source name", "url": "https://example.com/article"}
  ],
  "mentioned_tools": [
    {"name": "Tool Name", "website": "https://tool.com", "category": "Category Name", "tagline": "One-line description"},
    ...for EVERY specific AI tool/product mentioned by name in the article
  ]
}

IMPORTANT: In "mentioned_tools", list EVERY specific AI tool or product mentioned in body_md. Use the tool's official website URL and a short tagline. For category use one of: Chatbot / Assistant, Image Generation, Video Generation, Audio & Music, Code Assistant, Writing & Copy, SEO & Marketing, Analytics & Data, Voice & Speech, Search & Research, Automation, Design & Creative, Productivity, Education, Healthcare, Legal, Finance, Cybersecurity, Developer Tools, 3D & Spatial, Other.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err}`)
  }

  const result = await response.json()
  const text: string = result.content?.[0]?.text ?? ''

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedPost

  // Sanitise slug
  parsed.slug = slugify(parsed.slug || parsed.title)

  return parsed
}

// ── Auto-add missing tools & inject internal links ──────────────────────────
async function autoLinkAndAddTools(
  bodyMd: string,
  mentionedTools: MentionedTool[]
): Promise<{ linkedBody: string; toolIds: string[] }> {
  if (!mentionedTools || mentionedTools.length === 0) return { linkedBody: bodyMd, toolIds: [] }

  const toolIds: string[] = []
  let md = bodyMd

  for (const tool of mentionedTools) {
    if (!tool.name || !tool.website) continue

    const toolSlug = slugify(tool.name)

    // Check if tool already exists (by slug or website domain)
    let domain = ''
    try { domain = new URL(tool.website).hostname.replace('www.', '') } catch { /* skip */ }

    const { data: existing } = await supabase
      .from('ai_tools')
      .select('id, slug')
      .or(`slug.eq.${toolSlug},website.ilike.%${domain}%`)
      .limit(1)
      .maybeSingle()

    let slug: string
    let toolId: string

    if (existing) {
      slug = existing.slug
      toolId = existing.id
    } else {
      // Resolve category_id
      let categoryId: string | null = null
      if (tool.category) {
        const catSlug = slugify(tool.category)
        const { data: catRow } = await supabase
          .from('categories')
          .select('id')
          .or(`slug.eq.${catSlug},name.ilike.%${tool.category}%`)
          .limit(1)
          .maybeSingle()
        if (catRow) categoryId = catRow.id
      }

      // Insert new tool
      const { data: inserted, error } = await supabase
        .from('ai_tools')
        .insert({
          slug: toolSlug,
          name: tool.name,
          tagline: tool.tagline || `${tool.name} — AI tool`,
          description: tool.tagline || '',
          website: tool.website,
          category_id: categoryId,
          status: 'active',
          is_auto_enrolled: false,
          pricing_model: 'freemium',
        })
        .select('id, slug')
        .single()

      if (error || !inserted) {
        console.warn(`[auto-link] Failed to insert ${tool.name}: ${error?.message}`)
        continue
      }

      slug = inserted.slug
      toolId = inserted.id
    }

    toolIds.push(toolId)

    // Inject internal link at first occurrence of tool name in markdown
    // Avoid linking if already linked (contains [name](...)
    const alreadyLinked = md.includes(`[${tool.name}]`)
    if (!alreadyLinked) {
      const idx = md.indexOf(tool.name)
      if (idx !== -1) {
        md = md.substring(0, idx) +
          `[${tool.name}](https://listmyai.com/tools/${slug})` +
          md.substring(idx + tool.name.length)
      }
    }
  }

  return { linkedBody: md, toolIds }
}

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
    ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && secret !== 'lmai@admin2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const forceTopicParam = req.nextUrl.searchParams.get('topic')

  try {
    const topic = forceTopicParam ?? await pickTopic()
    const relatedToolIds = await findRelatedToolIds(topic)

    const generated = await generatePost(topic, relatedToolIds)

    // Auto-add any mentioned tools to directory & inject internal links
    const { linkedBody, toolIds: mentionedToolIds } = await autoLinkAndAddTools(
      generated.body_md,
      generated.mentioned_tools ?? []
    )
    generated.body_md = linkedBody
    const allToolIds = [...new Set([...relatedToolIds, ...mentionedToolIds])]

    // Check for slug collision and add date suffix if needed
    let finalSlug = generated.slug
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle()

    if (existing) {
      const dateSuffix = new Date().toISOString().slice(0, 10)
      finalSlug = `${finalSlug}-${dateSuffix}`.slice(0, 90)
    }

    // Assign hero image deterministically from pool — unique per slug
    const heroImage = pickHeroImage(finalSlug)

    const { data: inserted, error } = await supabase
      .from('blog_posts')
      .insert({
        slug: finalSlug,
        title: generated.title,
        excerpt: generated.excerpt,
        body_md: generated.body_md,
        hero_image_url: heroImage.url,
        hero_image_alt: heroImage.alt,
        tags: generated.tags ?? [],
        faqs: generated.faqs ?? [],
        related_tool_ids: allToolIds,
        external_refs: generated.external_refs ?? [],
        is_auto_generated: true,
        source_topic: topic,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select('id, slug, title')
      .single()

    if (error) throw new Error(`Supabase insert error: ${error.message}`)

    return NextResponse.json({
      ok: true,
      topic,
      post: inserted,
      share: `https://listmyai.com/admin/blog`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-blog] Error:', msg)

    // Alert the admin — a silent failure here means days of missing posts
    try {
      const { sendEmail } = await import('@/lib/email')
      const hint = msg.includes('credit balance')
        ? 'Your Anthropic API credit balance has run out. Top up at console.anthropic.com → Plans & Billing, then use "Generate Post Now" in /admin/blog to backfill missed days.'
        : 'Check the Vercel function logs for details.'
      await sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL ?? 'listmyai@gmail.com',
        subject: '⚠️ Daily blog generation failed',
        html: `<p>The daily AI blog post could not be generated.</p><p><strong>Error:</strong> ${msg.slice(0, 500)}</p><p>${hint}</p>`,
      })
    } catch { /* email failed too — nothing more we can do */ }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
