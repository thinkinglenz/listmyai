// Generates the artwork behind a blog post's hero image.
//
// Generated once, when the post is written, and stored in Supabase — never on
// page view, so traffic can never turn into an image bill. The art carries no
// text: image models mangle words, and the title is drawn over the top in real
// type by /api/blog-hero/[slug]. Art is the background; typography stays ours.
//
// Every failure path returns null, and the caller falls back to the existing
// rendered card. A missing key, a rate limit or a bad response must never stop
// a post from shipping.
import { createClient } from '@supabase/supabase-js'

export const HERO_BUCKET = 'blog-heroes'

const GEMINI_MODEL = 'gemini-2.5-flash-image'

/** Public URL the art would live at. Existence is not checked. */
export function heroArtUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${HERO_BUCKET}/${slug}.png`
}

/**
 * House style. The point of spelling this out is that every post shares one
 * visual language instead of looking like seven different stock generators.
 */
function buildPrompt(title: string, tags: string[]): string {
  const subject = [title, ...tags.slice(0, 3)].join('. ')
  return [
    `Editorial illustration for a technology article titled: "${title}".`,
    tags.length ? `Themes: ${tags.slice(0, 4).join(', ')}.` : '',
    'Style: dark editorial tech illustration on a near-black background (#0d1117).',
    'Cinematic side lighting, deep shadows, a single warm accent light source.',
    'Concrete visual metaphor for the subject, rendered with depth and texture:',
    `physical objects, architecture or machinery that evoke ${subject}.`,
    'Composition: wide 16:9, subject off-centre, generous empty space in the',
    'upper left for a headline to be placed later.',
    'Absolutely no text, no words, no letters, no numbers, no logos, no watermarks.',
    'No user-interface mockups, no floating glass panels, no generic glowing',
    'blue neural networks, no circuit-board cliches, no robot faces.',
  ].filter(Boolean).join(' ')
}

function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

/** Gemini returns the image inline as base64 on a content part. */
async function generateWithGemini(prompt: string): Promise<Buffer | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { imageConfig: { aspectRatio: '16:9' } },
      }),
    }
  )
  if (!res.ok) {
    console.warn('[hero-image] gemini rejected the request:', res.status, (await res.text()).slice(0, 200))
    return null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => null)
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData
  if (!inline) {
    console.warn('[hero-image] gemini returned no image part')
    return null
  }
  return Buffer.from(inline.data, 'base64')
}

/** Used only if there is no Gemini key but an OpenAI one is present. */
async function generateWithOpenAI(prompt: string): Promise<Buffer | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1536x1024', n: 1 }),
  })
  if (!res.ok) {
    console.warn('[hero-image] openai rejected the request:', res.status, (await res.text()).slice(0, 200))
    return null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => null)
  const b64 = data?.data?.[0]?.b64_json
  return b64 ? Buffer.from(b64, 'base64') : null
}

/**
 * Generate and store the art for one post.
 *
 * Returns the public URL on success, or null if no provider is configured or
 * anything at all went wrong. Callers treat null as "use the rendered card".
 */
export async function generateHeroArt(
  slug: string,
  title: string,
  tags: string[] = []
): Promise<string | null> {
  const db = supabaseAdmin()
  if (!db) return null
  if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) return null

  try {
    const prompt = buildPrompt(title, tags)
    const png = (await generateWithGemini(prompt)) ?? (await generateWithOpenAI(prompt))
    if (!png) return null

    const { error } = await db.storage.from(HERO_BUCKET).upload(`${slug}.png`, png, {
      contentType: 'image/png',
      upsert: true,
    })
    if (error) {
      console.warn('[hero-image] upload failed:', error.message)
      return null
    }
    return heroArtUrl(slug)
  } catch (e) {
    console.warn('[hero-image] generation failed', e)
    return null
  }
}
