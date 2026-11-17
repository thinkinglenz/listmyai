/**
 * Works out which category a listing belongs to, from its own text.
 *
 * Roughly a quarter of the index sits in "Other" or in no category at all,
 * which makes category pages thin and leaves job-keyed pages with nothing to
 * map to. This assigns the obvious ones.
 *
 * The important rule is what it does when it is unsure: nothing. A listing in
 * "Other" is honestly unclassified, and a reader can see that. A listing moved
 * into the wrong category looks exactly like a decision somebody made on
 * purpose, and nothing downstream can tell the difference. So a guess here is
 * worse than silence, and `classify` returns null rather than reaching for the
 * best of a bad set of scores.
 */

export const CATEGORY_IDS = {
  'Chatbot / Assistant': 1,
  'Image Generation': 2,
  'Video Generation': 3,
  'Audio & Music': 4,
  'Code Assistant': 5,
  'Writing & Copy': 6,
  'SEO & Marketing': 7,
  'Data & Analytics': 8,
  'Voice & Speech': 9,
  'AI Search': 10,
  'Automation': 11,
  'Design & Creative': 12,
  'Research': 13,
  'Education': 14,
  'Healthcare': 15,
  'Finance & Legal': 16,
  'Other': 17,
} as const

export type CategoryName = keyof typeof CATEGORY_IDS

/** Categories a listing may be moved OUT of. Anything else is left alone. */
export const UNCLASSIFIED_IDS = [CATEGORY_IDS.Other]

/** A hit worth this much is a strong, on-the-nose signal. */
const STRONG = 3
const WEAK = 1

type Rule = [RegExp, number]

/**
 * A stem: matches from a word boundary and lets the word finish however it
 * likes, so `stem('video generat')` catches "video generation", "generated"
 * and "generator". Writing these by hand is a trap — `/video generat\b/` can
 * never match "video generation", because there is no word boundary between
 * "generat" and "ion", so the pattern silently matches nothing at all.
 */
function stem(...parts: string[]): RegExp {
  return new RegExp(`\\b(?:${parts.join('|')})`)
}

/** A whole word, bounded at both ends: `word('care')` will not match "career". */
function word(...parts: string[]): RegExp {
  return new RegExp(`\\b(?:${parts.join('|')})\\b`)
}

/**
 * Patterns per category. Written against lowercased text, so they carry no
 * /i flag. Strong patterns name the thing itself; weak ones are supporting
 * evidence that only decides a tie.
 */
const RULES: Record<Exclude<CategoryName, 'Other'>, Rule[]> = {
  'Image Generation': [
    [stem('text[- ]to[- ]image', 'image generat', 'ai image', 'generate image', 'ai art', 'art generat'), STRONG],
    [stem('stable diffusion', 'midjourney', 'midjourny', 'flux', 'sdxl', 'lora'), STRONG],
    [word('dall[- ]?e'), STRONG],
    [stem('headshot', 'avatar generat', 'logo generat', 'thumbnail generat', 'upscal', 'background remov', 'inpaint', 'outpaint'), STRONG],
    [word('photo', 'photos', 'picture', 'pictures', 'illustration', 'illustrations', 'wallpaper', 'wallpapers', 'sticker', 'stickers'), WEAK],
  ],
  'Video Generation': [
    [stem('text[- ]to[- ]video', 'image[- ]to[- ]video', 'video generat', 'ai video', 'generate video'), STRONG],
    [stem('runway', 'kling', 'pika', 'lip[- ]?sync', 'deepfake', 'face[- ]?swap'), STRONG],
    [word('sora', 'veo'), STRONG],
    [stem('short[- ]?form video', 'video edit', 'subtitle', 'caption video', 'b[- ]?roll'), STRONG],
    [word('reel', 'reels', 'clip', 'clips', 'footage', 'animation', 'render'), WEAK],
  ],
  'Audio & Music': [
    [stem('music generat', 'ai music', 'song generat', 'compose music', 'backing track', 'royalty[- ]free music'), STRONG],
    [stem('audio edit', 'sound effect', 'mastering', 'stem separat', 'noise remov', 'podcast edit'), STRONG],
    [word('suno', 'udio', 'beat', 'beats'), STRONG],
    [word('audio', 'sound', 'track', 'tracks', 'mix'), WEAK],
  ],
  'Voice & Speech': [
    [stem('text[- ]to[- ]speech', 'speech[- ]to[- ]text', 'voice clon', 'voice ?over', 'transcrib', 'transcription'), STRONG],
    [stem('dictation', 'speech recognition', 'voice agent', 'voice assistant', 'answering service', 'receptionist'), STRONG],
    [word('tts', 'stt', 'ivr'), STRONG],
    [stem('ai (?:phone|call)', 'call cent', 'cold call'), STRONG],
    [word('voice', 'speech', 'spoken', 'accent'), WEAK],
  ],
  'Code Assistant': [
    [stem('code (?:assistant|completion|review|generat)', 'ai coding', 'coding (?:agent|assistant|copilot)'), STRONG],
    [stem('pull request', 'code review', 'refactor', 'debug', 'unit test', 'linter', 'jetbrains'), STRONG],
    [stem('developer tool', 'api client', 'devops', 'deployment', 'cli tool'), STRONG],
    [word('ide', 'sdk', 'vs ?code', 'ci/cd', 'terminal'), STRONG],
    [word('python', 'javascript', 'typescript', 'react', 'github', 'repository', 'codebase', 'programming'), WEAK],
  ],
  'Writing & Copy': [
    [stem('ai writ', 'writing assistant', 'copywrit', 'content writ', 'blog (?:post )?generat', 'article generat'), STRONG],
    [stem('paraphras', 'rewrit', 'grammar', 'proofread', 'summaris', 'summariz', 'ghostwrit'), STRONG],
    [stem('cover letter', 'email writ', 'cv builder'), STRONG],
    [word('essay', 'essays', 'resume'), STRONG],
    [word('text', 'draft', 'editor', 'prose', 'tone'), WEAK],
  ],
  'SEO & Marketing': [
    [stem('search engine optimi', 'backlink', 'keyword research', 'rank track'), STRONG],
    [word('seo', 'serp', 'ppc'), STRONG],
    [stem('marketing automation', 'ad (?:copy|creative|campaign)', 'google ads', 'meta ads', 'influencer'), STRONG],
    [stem('social media (?:post|manage|schedul)', 'content calendar', 'newsletter', 'email campaign', 'lead magnet'), STRONG],
    [word('brand', 'audience', 'engagement', 'conversion', 'funnel', 'campaign'), WEAK],
  ],
  'Data & Analytics': [
    [stem('data (?:analytic|visuali|pipeline|warehouse)', 'business intelligence', 'dashboard'), STRONG],
    [word('etl', 'sql', 'csv', 'bigquery', 'snowflake', 'tableau', 'power ?bi', 'excel', 'spreadsheet'), STRONG],
    [stem('predictive', 'forecast', 'report builder'), STRONG],
    [word('kpi', 'metric', 'metrics', 'a/b test'), STRONG],
    [word('data', 'analytics', 'chart', 'charts', 'insight', 'insights', 'statistic', 'statistics'), WEAK],
  ],
  'AI Search': [
    [stem('ai search', 'semantic search', 'vector (?:search|database)', 'retrieval[- ]augmented'), STRONG],
    [stem('search engine', 'knowledge base search', 'enterprise search', 'site search', 'embedding'), STRONG],
    [word('rag', 'pinecone', 'weaviate', 'qdrant', 'chroma', 'milvus'), STRONG],
    [word('search', 'query', 'index', 'lookup'), WEAK],
  ],
  'Automation': [
    [stem('workflow automation', 'automation platform', 'no[- ]?code automation', 'zapier', 'make\\.com'), STRONG],
    [word('rpa', 'n8n'), STRONG],
    [stem('ai agent', 'autonomous agent', 'agentic', 'multi[- ]agent', 'agent (?:framework|builder|orchestrat)'), STRONG],
    [stem('browser automation', 'web scrap', 'crawler', 'bot builder', 'integrat', 'webhook', 'trigger'), STRONG],
    [stem('automat', 'orchestrat'), WEAK],
    [word('workflow', 'pipeline', 'task', 'tasks'), WEAK],
  ],
  'Chatbot / Assistant': [
    [stem('chat ?bot', 'conversational ai', 'customer support (?:bot|agent)', 'helpdesk', 'live chat'), STRONG],
    [stem('ai (?:assistant|companion|chat)', 'personal assistant', 'virtual assistant', 'copilot'), STRONG],
    [stem('llm (?:chat|interface)', 'chat with (?:your )?(?:pdf|doc|data)'), STRONG],
    [word('assistant', 'conversation', 'prompt', 'chat'), WEAK],
  ],
  'Design & Creative': [
    [stem('design (?:system|tool)', 'figma', 'prototyp', 'wireframe', 'mockup'), STRONG],
    [word('ui/ux', 'ui', 'ux', 'cad'), STRONG],
    [stem('graphic design', 'presentation', 'slide deck', 'pitch deck', 'poster', 'brand kit', '3d model'), STRONG],
    [stem('interior design', 'architect', 'floor ?plan', 'fashion design'), STRONG],
    [word('design', 'creative', 'template', 'layout', 'visual'), WEAK],
  ],
  'Research': [
    [stem('research (?:assistant|tool|paper)', 'literature review', 'academic', 'citation', 'scholar'), STRONG],
    [stem('systematic review', 'peer[- ]review', 'preprint', 'thesis', 'dissertation'), STRONG],
    [word('arxiv', 'pubmed'), STRONG],
    [stem('market research', 'competitive (?:intelligence|analysis)', 'due diligence'), STRONG],
    [word('research', 'study', 'paper', 'evidence', 'source'), WEAK],
  ],
  'Education': [
    [stem('tutor', 'teach', 'classroom', 'curriculum', 'lesson plan', 'flashcard'), STRONG],
    [word('student', 'students', 'course', 'courses', 'quiz', 'quizzes', 'exam', 'exams', 'homework'), STRONG],
    [stem('study (?:guide|aid)', 'language learning', 'e[- ]?learning', 'training (?:platform|material)'), STRONG],
    [word('lms', 'school', 'university'), STRONG],
    // 'learning' is weak on purpose: "machine learning" is not a school.
    [word('education', 'knowledge', 'skill', 'skills', 'practice', 'learn', 'learning'), WEAK],
  ],
  'Healthcare': [
    [stem('health', 'medical', 'clinic', 'patient', 'doctor', 'physician', 'hospital'), STRONG],
    [stem('diagnos', 'symptom', 'therapy', 'mental health', 'wellness', 'nutrition', 'medication', 'radiolog', 'patholog'), STRONG],
    [word('nurse', 'nurses', 'ehr', 'emr', 'hipaa', 'fitness'), STRONG],
    [stem('dental', 'dentist', 'oral hygiene', 'veterinar', 'physiotherap', 'pharmac'), STRONG],
    [stem('telemedicine', 'drug discovery'), STRONG],
    [word('care', 'treatment', 'wellbeing'), WEAK],
  ],
  'Finance & Legal': [
    [stem('invoice', 'accounting', 'bookkeep', 'expense', 'payroll', 'reconcil', 'auditing'), STRONG],
    [word('tax', 'taxes', 'audit', 'gdpr'), STRONG],
    [stem('legal', 'contract (?:review|analysis)', 'compliance', 'law firm', 'paralegal', 'litigation'), STRONG],
    [stem('fintech', 'trading', 'investment', 'banking', 'insurance', 'underwrit', 'fraud detection'), STRONG],
    [stem('portfolio (?:rebalanc|management|analys)', 'investment portfolio', 'stock portfolio'), STRONG],
    [word('finance', 'financial', 'payment', 'payments', 'budget', 'revenue', 'portfolio'), WEAK],
  ],
}

export interface ClassifyInput {
  name?: string | null
  tagline?: string | null
  description?: string | null
  tags?: string[] | null
}

export interface ClassifyResult {
  /** The category to move to, or null when no move is justified. */
  categoryId: number | null
  categoryName: CategoryName | null
  score: number
  runnerUp: number
  /** Why it declined, when it did. Shown in the dry-run report. */
  reason: 'confident' | 'no-signal' | 'too-close' | 'no-text'
}

/** A category must reach this to be considered at all. */
const MIN_SCORE = 3
/** ...and must beat the runner-up by this much, or the choice is a coin toss. */
const MIN_MARGIN = 2

function haystack(input: ClassifyInput): string {
  return [
    input.name,
    input.tagline,
    input.description,
    ...(Array.isArray(input.tags) ? input.tags : []),
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .join(' ')
    .toLowerCase()
}

export function classify(input: ClassifyInput): ClassifyResult {
  const text = haystack(input)
  const empty = { categoryId: null, categoryName: null, score: 0, runnerUp: 0 }
  // Nothing to read is not the same as nothing matching, and the dry-run
  // report should be able to tell those apart.
  if (text.length < 8) return { ...empty, reason: 'no-text' }

  const scores: { name: CategoryName; score: number }[] = []
  for (const [name, rules] of Object.entries(RULES) as [CategoryName, Rule[]][]) {
    let score = 0
    for (const [pattern, weight] of rules) if (pattern.test(text)) score += weight
    if (score > 0) scores.push({ name, score })
  }

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  const runnerUp = scores[1]?.score ?? 0

  if (!best || best.score < MIN_SCORE) {
    return { ...empty, score: best?.score ?? 0, runnerUp, reason: 'no-signal' }
  }
  if (best.score - runnerUp < MIN_MARGIN) {
    return { ...empty, score: best.score, runnerUp, reason: 'too-close' }
  }

  return {
    categoryId: CATEGORY_IDS[best.name],
    categoryName: best.name,
    score: best.score,
    runnerUp,
    reason: 'confident',
  }
}
