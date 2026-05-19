'use client'

import Link from 'next/link'
import { Shield, Mail, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

const LAST_UPDATED = '19 May 2026'

export default function DmcaPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', url: '', description: '', owner: '', confirm: false })
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <CheckCircle className="h-8 w-8" style={{ color: '#22c55e' }} />
        </div>
        <h1 className="text-2xl font-black text-white">Request received</h1>
        <p className="mt-3 text-slate-400">We&apos;ve received your DMCA / takedown request and will review it within <strong className="text-white">3 business days</strong>. You&apos;ll receive a confirmation at the email provided.</p>
        <Link href="/" className="mt-8 inline-block text-sm font-semibold hover:underline" style={{ color: '#e94560' }}>
          Back to ListmyAI
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.2)' }}>
          <Shield className="h-6 w-6" style={{ color: '#e94560' }} />
        </div>
        <h1 className="text-4xl font-black text-white">DMCA & Takedown Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-400">

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Our Commitment</h2>
          <p>ListmyAI respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA) and equivalent international laws. We respond promptly to valid takedown requests and remove infringing content as required.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Who Can Submit a Request?</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-white">Copyright holders</strong> — if your copyrighted content (logo, description, screenshots) is used without permission</li>
            <li><strong className="text-white">Tool owners / brand representatives</strong> — if your product is incorrectly listed, misrepresented, or you wish to have it removed</li>
            <li><strong className="text-white">Authorised agents</strong> — acting on behalf of a copyright holder with written authorisation</li>
          </ul>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">What Happens After You Submit?</h2>
          <div className="mt-2 space-y-3">
            {[
              { step: '1', text: 'We acknowledge your request within 24 hours' },
              { step: '2', text: 'We review the request within 3 business days' },
              { step: '3', text: 'If valid, we remove or update the content immediately' },
              { step: '4', text: 'We notify both parties of the outcome' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: '#e94560' }}>{step}</div>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border p-5" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: '#e94560' }} />
            <div>
              <p className="font-semibold text-white">Prefer email?</p>
              <p className="mt-1">Send your request directly to <a href="mailto:dmca@listmyai.com" className="hover:underline" style={{ color: '#e94560' }}>dmca@listmyai.com</a> with the subject line &ldquo;DMCA Takedown Request&rdquo;. Include all details listed in the form below.</p>
            </div>
          </div>
        </section>

        {/* Form */}
        <div className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: '#e94560' }} />
            <h2 className="text-lg font-bold text-white">Submit a Takedown Request</h2>
          </div>

          <form className="space-y-4" onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Your full name *</label>
                <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                  style={{ borderColor: '#1e2a3a' }} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Email address *</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                  style={{ borderColor: '#1e2a3a' }} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Company / Brand (if applicable)</label>
              <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="Acme AI, Inc."
                className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                style={{ borderColor: '#1e2a3a' }} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">URL of the listing on ListmyAI *</label>
              <input type="url" required value={form.url} onChange={e => set('url', e.target.value)}
                placeholder="https://listmyai.com/tools/your-tool"
                className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                style={{ borderColor: '#1e2a3a' }} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">URL of original copyrighted work *</label>
              <input type="url" required value={form.owner} onChange={e => set('owner', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                style={{ borderColor: '#1e2a3a' }} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Description of infringement / reason for removal *</label>
              <textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe what content is infringing and why you have the right to request its removal..."
                className="w-full resize-none rounded-xl border bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
                style={{ borderColor: '#1e2a3a' }} />
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" required checked={form.confirm} onChange={e => set('confirm', e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-red-500" />
              <span className="text-xs text-slate-400">
                I declare under penalty of perjury that I am the copyright owner or authorised to act on behalf of the copyright owner, and that the information in this request is accurate and complete.
              </span>
            </label>
            <button type="submit"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              <Mail className="h-4 w-4" /> Submit Request
            </button>
          </form>
        </div>

      </div>

      <div className="mt-10 flex gap-4 text-sm">
        <Link href="/terms" className="hover:underline" style={{ color: '#e94560' }}>Terms of Use</Link>
        <Link href="/privacy-policy" className="hover:underline" style={{ color: '#e94560' }}>Privacy Policy</Link>
        <Link href="/disclaimer" className="hover:underline" style={{ color: '#e94560' }}>Disclaimer</Link>
      </div>
    </div>
  )
}
