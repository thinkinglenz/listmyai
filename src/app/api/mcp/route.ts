// MCP server for the directory.
//
// Lets an agent query ListmyAI directly — "find me a free AI video tool with an
// API" — instead of scraping a page and guessing. Being the thing agents call
// is a better position than being a page they summarise, and the catalogue is
// already structured enough to answer properly.
//
// Speaks JSON-RPC 2.0 over HTTP (the streamable-HTTP transport), implementing
// the three methods a client needs: initialize, tools/list, tools/call.
// Read-only and unauthenticated by design: every field it returns already
// renders on a public listing page. No model is called, so no request here can
// spend money — which is why it can be left open when /api/find cannot.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://listmyai.com'
const MAX_RESULTS = 25

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SELECT =
  'slug, name, tagline, description, website, pricing_model, starting_price, has_free_trial, has_api, upvotes, view_count, categories(name)'

interface Row {
  slug: string; name: string; tagline: string | null; description: string | null
  website: string | null; pricing_model: string | null; starting_price: string | null
  has_free_trial: boolean | null; has_api: boolean | null
  upvotes: number | null; view_count: number | null
  categories: { name: string } | { name: string }[] | null
}

function shape(t: Row) {
  const cat = Array.isArray(t.categories) ? t.categories[0]?.name : t.categories?.name
  return {
    name: t.name,
    listing: `${BASE_URL}/tools/${t.slug}`,
    website: t.website,
    category: cat ?? null,
    tagline: t.tagline,
    pricing_model: t.pricing_model,
    starting_price: t.starting_price,
    free_trial: !!t.has_free_trial,
    has_api: !!t.has_api,
  }
}

const TOOLS = [
  {
    name: 'search_tools',
    description:
      'Search the ListmyAI directory of AI tools by keyword, with optional filters for category, pricing model, free trial and API availability. Returns listing URLs that can be cited.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keywords, e.g. "video editing" or "transcription"' },
        category: { type: 'string', description: 'Category name, e.g. "Video Generation"' },
        pricing_model: { type: 'string', description: 'free, freemium, subscription, one_time or pay_per_use' },
        free_trial: { type: 'boolean', description: 'Only tools offering a free trial' },
        has_api: { type: 'boolean', description: 'Only tools exposing an API' },
        limit: { type: 'number', description: `Maximum results, up to ${MAX_RESULTS}` },
      },
    },
  },
  {
    name: 'get_tool',
    description: 'Full details for one tool, by its ListmyAI slug (the last path segment of its listing URL).',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'e.g. "chatgpt"' } },
      required: ['slug'],
    },
  },
  {
    name: 'list_categories',
    description: 'Every category in the directory, with how many active tools each contains.',
    inputSchema: { type: 'object', properties: {} },
  },
]

async function searchTools(args: Record<string, unknown>) {
  const limit = Math.min(MAX_RESULTS, Math.max(1, Number(args.limit) || 10))
  let q = supabase.from('ai_tools').select(SELECT).eq('status', 'active')

  if (typeof args.query === 'string' && args.query.trim()) {
    const term = args.query.trim().replace(/[%,()]/g, ' ')
    q = q.or(`name.ilike.%${term}%,tagline.ilike.%${term}%,description.ilike.%${term}%`)
  }
  if (typeof args.pricing_model === 'string') q = q.eq('pricing_model', args.pricing_model)
  if (args.free_trial === true) q = q.eq('has_free_trial', true)
  if (args.has_api === true) q = q.eq('has_api', true)

  // Most-wanted first, so a short answer carries the tools people actually use.
  const { data } = await q.order('upvotes', { ascending: false }).limit(limit * 3)
  let rows = (data ?? []) as unknown as Row[]

  // Category is on the joined table, so it is filtered after the query rather
  // than inside it; the over-fetch above leaves room for that.
  if (typeof args.category === 'string' && args.category.trim()) {
    const want = args.category.trim().toLowerCase()
    rows = rows.filter(t => {
      const c = Array.isArray(t.categories) ? t.categories[0]?.name : t.categories?.name
      return (c ?? '').toLowerCase().includes(want)
    })
  }

  return { count: Math.min(rows.length, limit), tools: rows.slice(0, limit).map(shape) }
}

async function getTool(args: Record<string, unknown>) {
  const slug = String(args.slug ?? '').trim()
  if (!slug) return { error: 'slug is required' }
  const { data } = await supabase.from('ai_tools').select(SELECT).eq('slug', slug).eq('status', 'active').maybeSingle()
  if (!data) return { error: `No active listing with slug "${slug}"` }
  const row = data as unknown as Row
  return { ...shape(row), description: row.description }
}

async function listCategories() {
  const { data } = await supabase.from('categories').select('name, slug').order('name')
  return {
    categories: (data ?? []).map(c => ({
      name: c.name,
      url: `${BASE_URL}/directory?category=${c.slug}`,
    })),
  }
}

async function callTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'search_tools': return searchTools(args)
    case 'get_tool': return getTool(args)
    case 'list_categories': return listCategories()
    default: return { error: `Unknown tool "${name}"` }
  }
}

function rpc(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: NextRequest) {
  let body: { method?: string; id?: unknown; params?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 }
    )
  }

  const { method, id, params } = body

  if (method === 'initialize') {
    return rpc(id, {
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'listmyai', version: '1.0.0' },
      instructions:
        'Search ListmyAI, a directory of 20,000+ AI tools. Cite the "listing" URL of any tool you mention so readers can check pricing against the source.',
    })
  }

  // Notifications carry no id and expect no response body.
  if (method === 'notifications/initialized') return new NextResponse(null, { status: 202 })

  if (method === 'tools/list') return rpc(id, { tools: TOOLS })

  if (method === 'tools/call') {
    const name = String(params?.name ?? '')
    const args = (params?.arguments ?? {}) as Record<string, unknown>
    try {
      const result = await callTool(name, args)
      // MCP expects content blocks; JSON in a text block is what clients parse.
      return rpc(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] })
    } catch (e) {
      return rpc(id, {
        content: [{ type: 'text', text: `Lookup failed: ${e instanceof Error ? e.message : 'unknown error'}` }],
        isError: true,
      })
    }
  }

  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error: { code: -32601, message: `Method not found: ${method}` } },
    { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
  )
}
