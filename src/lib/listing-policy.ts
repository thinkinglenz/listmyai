// What the directory will not list.
//
// The nightly scraper imports whatever a source offers, with no view on what
// kind of tool it is. That is how nineteen "undress" apps — which generate
// fake nude images of real people from ordinary photos, without their consent
// — ended up with pages on the site. They were removed by hand; without this
// they would simply be re-imported on the next run.
//
// This is not a general adult-content filter. Tools that detect, block or
// moderate this material are the opposite of the problem and must keep
// listing, which is why the allow list below exists.
//
// Beyond the harm itself, payment processors and ad networks screen for this
// category, so a single such listing can disqualify the whole site.

/** Phrases that describe generating non-consensual intimate imagery. */
const BLOCKED = [
  'undress', 'nudify', 'nudifier', 'deepnude', 'clothes remover', 'clothing remover',
  'remove clothes', 'remove clothing', 'strip photo', 'nude generator', 'nudes generator',
  'ai nudes', 'nude ai', 'xray clothes', 'x-ray clothes', 'see through clothes',
  'deepfake porn', 'deepfake nude', 'face swap porn', 'nsfw deepfake',
]

/**
 * Tools whose subject is this material but whose purpose is to stop it:
 * detectors, blockers, moderation APIs, reporting and support services.
 */
const ALLOWED = [
  'detect', 'detector', 'detection', 'moderation', 'moderate', 'blocker', 'block',
  'filter', 'safeguard', 'protection', 'report', 'takedown', 'remove content',
  'parental', 'classifier', 'scanner',
]

export interface PolicyVerdict {
  allowed: boolean
  /** The phrase that matched, for the log. Never shown to a submitter. */
  matched?: string
}

/**
 * Whether a listing may be created.
 *
 * Checks the fields a tool describes itself with. Matching is substring-based
 * and deliberately blunt: a false positive costs one listing and a line in a
 * log, a false negative puts a nudify app back on the site.
 */
export function checkListingPolicy(fields: {
  name?: unknown
  tagline?: unknown
  description?: unknown
  website?: unknown
  tags?: unknown
}): PolicyVerdict {
  const parts = [fields.name, fields.tagline, fields.description, fields.website]
    .filter(v => typeof v === 'string')
    .concat(Array.isArray(fields.tags) ? fields.tags.filter(t => typeof t === 'string') : [])
  const haystack = parts.join(' ').toLowerCase()
  if (!haystack) return { allowed: true }

  const matched = BLOCKED.find(phrase => haystack.includes(phrase))
  if (!matched) return { allowed: true }

  // A tool about the problem rather than a tool that causes it.
  if (ALLOWED.some(word => haystack.includes(word))) return { allowed: true }

  return { allowed: false, matched }
}
