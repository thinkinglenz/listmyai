import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Bad website patterns (not real product URLs)
const BAD_WEBSITE = [
  /img\.shields\.io/i,
  /badge\./i,
  /shields\.io/i,
  /opencollective\.com/i,
  /patreon\.com/i,
  /buymeacoffee\.com/i,
  /ko-fi\.com/i,
  /paypal\.com/i,
  /npmjs\.com/i,
  /pypi\.org/i,
  /hub\.docker\.com/i,
  /gist\.github\.com/i,
  /raw\.githubusercontent\.com/i,
  /user-images\.githubusercontent\.com/i,
  /camo\.githubusercontent\.com/i,
  /github\.com\/sponsors\//i,
  /github\.com\/apps\//i,
  /marketplace\.visualstudio\.com/i,
]

// GitHub repo URL (not a product website)
const GITHUB_REPO = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?(\?.*)?$/i

// Bad name patterns
const BAD_NAME = [
  /^!\[/,                     // markdown images
  /^\[!/,                     // markdown badge refs
  /^Pull Request/i,
  /^Issues?$/i,
  /^Stars?$/i,
  /^Forks?$/i,
  /^License$/i,
  /^Contributors?$/i,
  /^Back to Top$/i,
  /^Table of Contents$/i,
  /^Contributing$/i,
  /^Sponsor/i,
  /^Donate/i,
  /^README/i,
  /^CHANGELOG/i,
  /^TODO$/i,
  /^API$/i,
  /^\d+$/,                    // just numbers
  /^[A-Z]{1,3}$/,            // just 1-3 uppercase letters
  /svg\d*$/i,                 // svg badge refs
  /^Open Source/i,
  /^Awesome /i,
  /^List of/i,
  /^Collection/i,
]

function isJunk(tool: { name: string; website: string; tagline?: string }): string | null {
  const { name, website } = tool

  // Bad names
  for (const pat of BAD_NAME) {
    if (pat.test(name)) return `bad name: ${name.slice(0, 50)}`
  }

  // Bad websites
  for (const pat of BAD_WEBSITE) {
    if (pat.test(website)) return `bad website: ${website.slice(0, 80)}`
  }

  // GitHub repo URLs (not real product websites)
  if (GITHUB_REPO.test(website)) return `github repo: ${website.slice(0, 80)}`

  // Name starts with special chars
  if (/^[!\[\]#*_`>]/.test(name)) return `markdown artifact: ${name.slice(0, 50)}`

  // Very short name (1 char)
  if (name.length <= 1) return `too short: ${name}`

  return null
}

export async function GET(req: NextRequest) {
  const doDelete = req.nextUrl.searchParams.get('delete') === '1'
  const secret = req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all tools
  const allTools: { id: string; name: string; website: string; tagline: string; slug: string }[] = []
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('id, name, website, tagline, slug')
      .range(offset, offset + 999)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    allTools.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }

  // Find junk
  const junk: { id: string; name: string; website: string; reason: string }[] = []
  for (const tool of allTools) {
    const reason = isJunk(tool)
    if (reason) {
      junk.push({ id: tool.id, name: tool.name, website: tool.website, reason })
    }
  }

  if (!doDelete) {
    return NextResponse.json({
      total: allTools.length,
      junk_count: junk.length,
      junk: junk.slice(0, 100), // show first 100
      message: 'Dry run. Add &delete=1 to actually remove.',
    })
  }

  // Delete junk
  let deleted = 0
  const errors: string[] = []
  for (const item of junk) {
    const { error } = await supabase.from('ai_tools').delete().eq('id', item.id)
    if (error) {
      errors.push(`${item.name}: ${error.message}`)
    } else {
      deleted++
    }
  }

  return NextResponse.json({
    total: allTools.length,
    junk_found: junk.length,
    deleted,
    errors: errors.slice(0, 10),
    remaining: allTools.length - deleted,
  })
}
