// Instagram caption, shared by auto-posting and the admin Social Post modal so
// the two never drift apart. Pure: safe to import from client components.

// Comment → DM works for every commenter (see lib/social/instagram-dm), so
// the call to action is on unless explicitly switched off.
export const COMMENT_DM_ON = process.env.NEXT_PUBLIC_INSTAGRAM_COMMENT_DM !== 'off'

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
  const tags = [t.category, 'AI', 'AITools', 'ArtificialIntelligence', 'ListmyAI', 'NewTool', 'Productivity']
    .filter(Boolean).map(s => hashtag(s as string)).join(' ')
  return [
    t.hook ? `${t.hook} ⚡` : `🚀 New on ListmyAI: ${t.name}`,
    '',
    `${t.name} — ${t.tagline}`.slice(0, 300),
    '',
    COMMENT_DM_ON
      ? `💬 Comment "LINK" and we'll DM you the link right away.\n➕ Follow @listmyai for a new AI tool every day.`
      : `🔗 Find it on listmyai.com — follow @listmyai for more.`,
    '',
    tags,
  ].join('\n')
}

// The portrait card is cached for a week, so its URL has to change whenever
// its headline does. A tiny string hash is enough to tell versions apart.
export function instagramImagePath(slug: string, hook?: string | null, origin = ''): string {
  let h = 0
  for (const ch of hook ?? '') h = (h * 31 + ch.charCodeAt(0)) | 0
  return `${origin}/api/tool-social/${slug}?format=portrait&v=5&h=${(h >>> 0).toString(36)}`
}
