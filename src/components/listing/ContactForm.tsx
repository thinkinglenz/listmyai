'use client'

import { useState, useEffect } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { question: `${a} + ${b} = ?`, answer: a + b }
}

interface Props {
  toolName?: string
  toolSlug?: string
}

export default function ContactForm({ toolName, toolSlug }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (parseInt(captchaInput) !== captcha.answer) {
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
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          tool_name: toolName,
          tool_slug: toolSlug,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong.')
        setStatus('error')
        return
      }

      setStatus('success')
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
        <h3 className="text-lg font-bold text-white">Message Sent!</h3>
        <p className="mt-2 text-sm text-slate-400">Thank you for reaching out. We&apos;ll get back to you shortly.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
      <h2 className="mb-1 text-lg font-bold text-white">Have a Business Idea or Want to Suggest an AI Tool?</h2>
      <p className="mb-5 text-sm text-slate-400">
        We&apos;d love to hear from you. Drop us a message and our team will get back to you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Your Name *</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="John Smith" required
              className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
              style={{ borderColor: '#1e2a3a' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email Address *</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
              style={{ borderColor: '#1e2a3a' }}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Your Message *</label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Tell us about your idea, suggestion, or question..."
            rows={4} required
            className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition resize-none"
            style={{ borderColor: '#1e2a3a' }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Quick Verification: <span className="font-mono text-white">{captcha.question}</span>
            </label>
            <input
              type="text" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
              placeholder="Your answer" required
              className="w-full rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition sm:max-w-[200px]"
              style={{ borderColor: '#1e2a3a' }}
            />
          </div>

          <button
            type="submit" disabled={status === 'loading'}
            className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#e94560' }}
          >
            {status === 'loading' ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending...</>
            ) : (
              <><Send className="h-4 w-4" /> Send Message</>
            )}
          </button>
        </div>

        {error && (
          <p className="flex items-start gap-1.5 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
