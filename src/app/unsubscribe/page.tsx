'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'

function UnsubscribeInner() {
  const token = useSearchParams().get('token') ?? ''
  const [state, setState] = useState<'working' | 'done' | 'error'>('working')

  useEffect(() => {
    // Acted on immediately rather than behind a confirm button: an opt-out
    // should take one click, not two.
    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setState(d.ok ? 'done' : 'error'))
      .catch(() => setState('error'))
  }, [token])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      {state === 'working' && (
        <>
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-slate-500" />
          <p className="text-slate-400">Updating your preferences…</p>
        </>
      )}

      {state === 'done' && (
        <>
          <CheckCircle2 className="mb-4 h-12 w-12" style={{ color: '#10b981' }} />
          <h1 className="text-2xl font-black text-white">You&apos;re unsubscribed</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            You won&apos;t receive any more marketing emails from ListmyAI. Account
            emails — password resets and listing updates — will still reach you,
            since those aren&apos;t marketing.
          </p>
          <Link href="/" className="mt-6 text-sm font-semibold" style={{ color: '#e94560' }}>
            Back to ListmyAI
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <h1 className="text-2xl font-black text-white">That link didn&apos;t work</h1>
          <p className="mt-3 text-sm text-slate-400">
            The link may be incomplete. Email{' '}
            <a href="mailto:listmyai@gmail.com" style={{ color: '#e94560' }}>listmyai@gmail.com</a>{' '}
            and we&apos;ll remove you straight away.
          </p>
        </>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <UnsubscribeInner />
    </Suspense>
  )
}
