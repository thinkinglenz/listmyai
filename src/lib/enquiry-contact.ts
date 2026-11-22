/**
 * Pull a name and an email out of an intake conversation.
 *
 * The transcript is the only record of who got in touch, and nobody types
 * their details into a labelled field — they answer "what is your name and
 * email" in a sentence. Without this, a stored enquiry is a wall of chat an
 * admin has to read before they can reply to anyone, which is exactly the
 * friction the whole flow exists to remove.
 *
 * Deliberately conservative: a wrong email is worse than a blank one, because
 * a blank one makes someone open the transcript while a wrong one makes them
 * write to a stranger.
 */

export interface ExtractedContact {
  email: string | null
  name: string | null
}

// Only the visitor's own words are searched. The assistant echoes addresses
// back ("so that is sam@acme.com, correct?") and a prompt can contain example
// text; neither is the visitor stating their own address.
export function extractContact(
  messages: { role: 'user' | 'model'; content: string }[],
): ExtractedContact {
  const said = messages.filter(m => m.role === 'user').map(m => String(m.content ?? ''))
  return { email: findEmail(said), name: findName(said) }
}

// Trailing dots and commas are part of the sentence, not the address.
const EMAIL = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi

function findEmail(said: string[]): string | null {
  // Last one wins. A visitor who corrects themselves — "actually use my work
  // address" — means the later one, and replying to the first would be the
  // more annoying failure.
  let found: string | null = null
  for (const text of said) {
    const matches = text.match(EMAIL)
    if (matches?.length) found = matches[matches.length - 1]
  }
  return found ? found.toLowerCase() : null
}

// The apostrophe may be straight or curly, and "I'm" is written with a
// capital I — matching it with a lowercase `i` and no `i` flag silently never
// fires, which is how the first version of this missed every "I'm Daniel".
const APOS = "['’]?"

const NAME_PATTERNS = [
  new RegExp(`\\bmy name${APOS}s?\\s+is\\s+([^,.\\n@]{2,60})`, 'i'),
  new RegExp(`\\bmy name${APOS}s\\s+([^,.\\n@]{2,60})`, 'i'),
  new RegExp(`\\bI${APOS}m\\s+([A-Z][^,.\\n@]{1,59})`),
  // [Tt] rather than an `i` flag: the flag would also lowercase the [A-Z]
  // requirement on the capture, and "this is a problem" would become a name.
  /\b[Tt]his is\s+([A-Z][^,.\n@]{1,59})/,
  new RegExp(`\\byou can (?:call|reach) me\\s+([^,.\\n@]{2,60})`, 'i'),
]

// Words that follow "I'm" far more often than a name does.
const NOT_A_NAME = /^(?:looking|trying|not|just|a |an |the |in |at |from|happy|sure|fine|ok|okay|interested|hoping|working|running|using|based)/i

// A name runs until the sentence carries on. "My name is Sam Okafor and the
// email is sam" is one capture; everything from "and" onward is the next
// clause, and keeping it made the whole thing fail the word-count check and
// return nothing at all.
const CONTINUES = /\s+(?:and|&|from|at|with|the|my|our|we|email|e-mail|here|working|calling)\b.*$/i

function findName(said: string[]): string | null {
  for (const text of said) {
    for (const re of NAME_PATTERNS) {
      const m = text.match(re)
      const raw = m?.[1]?.trim()
      if (!raw) continue
      // "I'm looking for an agent" must not become the name "looking".
      if (NOT_A_NAME.test(raw)) continue
      const cleaned = raw.replace(CONTINUES, '').replace(/\s+/g, ' ').trim()
      // A whole sentence is not a name.
      if (cleaned.length < 2 || cleaned.split(' ').length > 4) continue
      return cleaned
    }
  }
  return null
}
