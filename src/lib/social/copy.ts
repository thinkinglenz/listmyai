// Instagram caption, shared by auto-posting and the admin Social Post modal so
// the two never drift apart. Pure: safe to import from client components.

export const COMMENT_DM_ON = process.env.NEXT_PUBLIC_INSTAGRAM_COMMENT_DM === 'on'

export function hashtag(s: string) {
  return `#${s.replace(/[^A-Za-z0-9]/g, '')}`
}

export function instagramCaption(t: {
  name: string
  tagline: string
  hook?: string | null
  slug: string
  category?: string | null
}): string {
  const url = `https://listmyai.com/tools/${t.slug}`
  const tags = [t.category, 'AI', 'AITools', 'ArtificialIntelligence', 'ListmyAI', 'NewTool', 'Productivity']
    .filter(Boolean).map(s => hashtag(s as string)).join(' ')
  return [
    t.hook ? `${t.hook} ⚡` : `🚀 New on ListmyAI: ${t.name}`,
    '',
    `${t.name} — ${t.tagline}`.slice(0, 300),
    '',
    COMMENT_DM_ON
      ? `💬 Want the link? DM us "${t.name}" and we'll send it straight to you.\n(Follow @listmyai so our reply reaches you.)`
      : `🔗 Find it on listmyai.com`,
    '',
    // Kept even with the DM flow: it is how a comment is matched to this tool.
    url,
    '',
    tags,
  ].join('\n')
}

// The portrait card is cached for a week, so its URL has to change whenever
// its headline does. A tiny string hash is enough to tell versions apart.
export function instagramImagePath(slug: string, hook?: string | null, origin = ''): string {
  let h = 0
  for (const ch of hook ?? '') h = (h * 31 + ch.charCodeAt(0)) | 0
  return `${origin}/api/tool-social/${slug}?format=portrait&v=3&h=${(h >>> 0).toString(36)}`
}
