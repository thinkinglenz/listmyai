// Unsubscribe endpoint.
//
// GET serves the click-through from an email footer; POST answers the one-click
// unsubscribe that Gmail and Yahoo send to the List-Unsubscribe-Post header.
// Neither requires the person to be signed in — demanding a login to opt out
// would not be the "easy withdrawal" the law asks for.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { suppress } from '@/lib/marketing/contacts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function unsubscribeByToken(token: string) {
  if (!token) return { ok: false, error: 'Missing token' }

  const { data: contact } = await supabase
    .from('marketing_contacts')
    .select('email')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  // An unknown token still reports success: telling a caller whether a token
  // exists would let someone probe which addresses are on the list.
  if (!contact) return { ok: true }

  await suppress(contact.email, 'unsubscribed')
  return { ok: true, email: contact.email }
}

export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const result = await unsubscribeByToken(token)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const result = await unsubscribeByToken(token)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
