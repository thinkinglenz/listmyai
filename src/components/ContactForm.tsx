'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface Props {
  package?: string
  onSuccess?: () => void
}

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { question: `${a} + ${b} = ?`, answer: a + b }
}

export default function ContactForm({ package: pkgType, onSuccess }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [autoRegistered, setAutoRegistered] = useState(false)

  useEffect(() => {
    setCaptcha(generateCaptcha())
    if (user) {
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
      setEmail(user.email || '')
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Captcha check (skip for logged-in users)
    if (!user && parseInt(captchaInput) !== captcha.answer) {
      setError('Incorrect answer. Please try again.')
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
      return
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('All fields are required.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: name.trim(),
          sender_email: email.trim(),
          message: message.trim(),
          package_type: pkgType,
          auto_register: !user, // If not logged in, request auto-registration
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setStatus('error')
        return
      }

      setStatus('success')
      setAutoRegistered(data.auto_registered ?? false)
      setMessage('')
      setCaptchaInput('')
      onSuccess?.()
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle className="h-7 w-7" style={{ color: '#10b981' }} />
        </div>
        <h3 className="text-lg font-bold text-white">Message sent!</h3>
        <p className="mt-2 text-sm text-slate-400">We'll get back to you shortly.</p>
        {autoRegistered && (
          <p className="mt-3 text-xs text-slate-500">
            Account created with <strong>{email}</strong>. Check your inbox for a verification link.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <h2 className="mb-1 text-lg font-bold text-white">Contact Us</h2>
      <p className="mb-5 text-sm text-slate-400">
        {user ? "Send us a message and we'll respond soon." : 'Tell us about your inquiry. No account needed!'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Email (hidden for logged-in users) */}
        {!user && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Your Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                required
                className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                style={{ borderColor: '#1e2a3a' }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                style={{ borderColor: '#1e2a3a' }}
              />
            </div>
          </div>
        )}

        {/* Package type (if provided) */}
        {pkgType && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Regarding</label>
            <div className="rounded-xl border bg-white/4 px-4 py-3 text-sm text-slate-400"
              style={{ borderColor: '#1e2a3a' }}>
              {pkgType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Message *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us what you're interested in..."
            rows={4}
            required
            className="w-full resize-none rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
            style={{ borderColor: '#1e2a3a' }}
          />
        </div>

        {/* Captcha (only for non-logged-in users) */}
        {!user && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Quick check: <span className="font-mono text-white">{captcha.question}</span>
              </label>
              <input
                type="text"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                placeholder="Answer"
                required={!user}
                className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition sm:max-w-[200px]"
                style={{ borderColor: '#1e2a3a' }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="flex items-start gap-1.5 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
          style={{ background: '#e94560' }}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Message
            </>
          )}
        </button>
      </form>

      {!user && (
        <p className="mt-4 text-xs text-slate-600">
          No account yet? One will be created for you after you send this message.{' '}
          <Link href="/login" className="hover:underline" style={{ color: '#e94560' }}>
            Already have one? Log in
          </Link>
        </p>
      )}
    </div>
  )
}
