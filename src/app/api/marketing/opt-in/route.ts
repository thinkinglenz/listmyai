// Records marketing consent from a link in an email.
//
// Clicking a clearly-labelled link is a positive act, which is what consent
// requires — but the link is signed so it can only ever opt in the address it
// was sent to.

import { NextRequest, NextResponse } from 'next/server'
import { recordConsent } from '@/lib/marketing/contacts'
import { verifyOptIn } from '@/lib/marketing/optin-token'

const CONSENT_TEXT =
  'Consent given by clicking "Yes, keep me posted" in the ListmyAI homepage spotlight announcement email.'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = (searchParams.get('e') ?? '').trim().toLowerCase()
  const token = searchParams.get('t') ?? ''
  const name = searchParams.get('n') ?? undefined

  if (!email || !verifyOptIn(email, token)) {
    return NextResponse.redirect(new URL('/?optin=invalid', req.url))
  }

  await recordConsent({
    email,
    name,
    consentText: CONSENT_TEXT,
    source: 'admin',
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  })

  return NextResponse.redirect(new URL('/?optin=done', req.url))
}
