'use client'

import { useState } from 'react'
import { Shield, X, Mail, CheckCircle, AlertCircle, Copy, Check, LogIn } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

// Common free/consumer email providers — blocked for claims
const FREE_DOMAINS = new Set([
  // 'gmail.com','googlemail.com', // TODO: re-enable after testing
  'yahoo.com','yahoo.co.uk','yahoo.fr','yahoo.de',
  'hotmail.com','hotmail.co.uk','hotmail.fr','outlook.com','outlook.co.uk',
  'live.com','live.co.uk','msn.com','icloud.com','me.com','mac.com',
  'aol.com','protonmail.com','proton.me','mail.com','zoho.com','zohomail.com',
  'yandex.com','yandex.ru','gmx.com','gmx.de','gmx.net','web.de',
  'tutanota.com','tuta.io','fastmail.com','hushmail.com','inbox.com',
  'mailinator.com','guerrillamail.com','temp-mail.org','throwam.com',
])

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? ''
}

type Step = 'idle' | 'loading' | 'verify' | 'manual' | 'done' | 'error' | 'login-required'

interface Props {
  toolId: string
  toolName: string
  toolSlug: string
  toolWebsite: string
  onClose: () => void
}

export default function ClaimModal({ toolId, toolName, toolSlug, toolWebsite, onClose }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const toolDomain = extractDomain(toolWebsite)
  const backlink = `https://listmyai.com/tools/${toolSlug}`
  const badgeHtml = `<a href="${backlink}" target="_blank" rel="noopener noreferrer" title="Listed on ListmyAI">Listed on ListmyAI</a>`

  // Pre-fill email from auth if available
  const claimEmail = email || user?.email || ''

  function validate(): string | null {
    if (!claimEmail.includes('@')) return 'Please enter a valid email address.'
    const emailDomain = getEmailDomain(claimEmail)
    if (!emailDomain) return 'Please enter a valid email address.'
    if (FREE_DOMAINS.has(emailDomain)) {
      return `${emailDomain} is a personal email provider. Please use your company email (e.g. you@${toolDomain || 'yourcompany.com'}).`
    }
    if (!name.trim()) return 'Please enter your name.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setStep('loading')

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: toolId,
          email: claimEmail,
          name: name.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'This listing is already claimed.')
          setStep('error')
          return
        }
        setError(data.error || 'Something went wrong. Please try again.')
        setStep('error')
        return
      }

      // Route to correct success screen
      if (data.claim_type === 'domain-match') {
        setStep('verify')
      } else {
        setStep('manual')
      }
    } catch {
      setError('Network error. Please try again.')
      setStep('error')
    }
  }

  function copyBacklink() {
    navigator.clipboard.writeText(badgeHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Show login prompt if not authenticated
  if (!authLoading && !user && step === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="relative w-full max-w-md rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition">
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.25)' }}>
              <LogIn className="h-7 w-7" style={{ color: '#e94560' }} />
            </div>
            <h2 className="text-lg font-bold text-white">Sign in to claim this listing</h2>
            <p className="mt-2 text-sm text-slate-400">
              You need an account to claim <strong className="text-white">{toolName}</strong>. Sign in or create a free account to continue.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href={`/login?redirect=/tools/${toolSlug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
            <Link href={`/register?redirect=/tools/${toolSlug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium text-slate-300 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              Create Account
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-slate-600">
            <button onClick={onClose} className="hover:underline" style={{ color: '#e94560' }}>Cancel</button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-md rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>

        {/* Close */}
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition">
          <X className="h-5 w-5" />
        </button>

        {/* ── Step: form ── */}
        {(step === 'idle' || step === 'loading' || step === 'error') && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.2)' }}>
                <Shield className="h-5 w-5" style={{ color: '#e94560' }} />
              </div>
              <div>
                <h2 className="font-bold text-white">Claim &ldquo;{toolName}&rdquo;</h2>
                <p className="text-xs text-slate-500">Verify your ownership to manage this listing</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border p-3 text-xs text-slate-400"
              style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p>Enter your <strong className="text-white">business email address</strong> — the domain must be associated with <strong className="text-white">{toolName}</strong> or its parent company.</p>
              <p className="mt-1.5 text-slate-600">Gmail, Yahoo, Hotmail and other personal email providers are not accepted.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Your name *</label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="John Smith" required
                  className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                  style={{ borderColor: '#1e2a3a' }} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Company email address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input type="email" value={claimEmail} onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder={`you@${toolDomain || 'yourcompany.com'}`} required
                    className="w-full rounded-xl border bg-white/4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                    style={{ borderColor: error ? '#ef4444' : '#1e2a3a', paddingLeft: '2.5rem' }} />
                </div>
                {error && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-red-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              <button type="submit" disabled={step === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#e94560' }}>
                {step === 'loading' ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Submitting claim&hellip;</>
                ) : 'Claim This Listing'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-600">
              Wrong tool? <button onClick={onClose} className="hover:underline" style={{ color: '#e94560' }}>Cancel</button>
            </p>
          </>
        )}

        {/* ── Step: domain match — verification email sent ── */}
        {step === 'verify' && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <Mail className="h-7 w-7" style={{ color: '#22c55e' }} />
              </div>
              <h2 className="text-lg font-bold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-slate-400">
                We sent a verification link to <strong className="text-white">{claimEmail}</strong>.
                Click it to confirm ownership and claim <strong className="text-white">{toolName}</strong>.
              </p>
              <p className="mt-2 text-xs text-slate-500">The link expires in 48 hours.</p>
            </div>

            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs font-semibold text-slate-300">While you wait</p>
              <p className="mt-1 text-xs text-slate-500">Add a &ldquo;Listed on ListmyAI&rdquo; backlink to your site — it helps both of us with SEO:</p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
                <code className="flex-1 text-xs text-slate-400 truncate">{badgeHtml}</code>
                <button onClick={copyBacklink} className="flex-shrink-0 text-slate-500 hover:text-white transition">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button onClick={onClose}
              className="mt-4 flex w-full items-center justify-center rounded-xl border py-2.5 text-sm text-slate-400 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              Done
            </button>
          </>
        )}

        {/* ── Step: manual review ── */}
        {step === 'manual' && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <CheckCircle className="h-7 w-7" style={{ color: '#f59e0b' }} />
              </div>
              <h2 className="text-lg font-bold text-white">Request received</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your email domain doesn&apos;t automatically match <strong className="text-white">{toolDomain}</strong>.
                We&apos;ll verify your authority to claim this listing within <strong className="text-white">1-2 business days</strong>.
              </p>
              <p className="mt-2 text-sm text-slate-500">We&apos;ll email you at <span className="text-white">{claimEmail}</span> with the outcome.</p>
            </div>

            <div className="mt-5 rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs font-semibold text-slate-300">Add a backlink in the meantime</p>
              <p className="mt-1 text-xs text-slate-500">This helps us verify your site and boosts SEO for both of us.</p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: '#1e2a3a', background: '#0d1117' }}>
                <code className="flex-1 truncate text-xs text-slate-400">{badgeHtml}</code>
                <button onClick={copyBacklink} className="flex-shrink-0 text-slate-500 hover:text-white transition">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button onClick={onClose} className="mt-4 w-full rounded-xl border py-2.5 text-sm text-slate-400 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
