import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, Plus, ArrowRight } from 'lucide-react'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact ListmyAI — Advertising, Support & Inquiries',
  description: 'Get in touch with ListmyAI. Ask about sponsorships, advertising options, or report an issue.',
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const pkgType = params.package

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6" style={{ background: '#0d1117' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#e94560' }}>
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Get in Touch</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Questions about advertising, partnerships or support. To get a tool listed, use the submit link below rather than this form.
          </p>
        </div>

        {/* Routing, above the form on purpose.
            Listing requests kept arriving as email because this page offered
            no alternative — three in ten days, each one prose that had to be
            transcribed into a submission by hand. The form below is the only
            thing here, so people used it, or just emailed. Sending them to
            /submit instead means the details arrive structured and land in
            the review queue already filled in. */}
        <div className="mb-8 rounded-2xl p-5" style={{ border: '1px solid rgba(233,69,96,0.3)', background: 'rgba(233,69,96,0.07)' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <Plus className="h-4 w-4" style={{ color: '#e94560' }} /> Want your AI tool listed?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Submit it directly instead of emailing — it reaches our review queue faster.
                Free for the first six months. Check the{' '}
                <Link href="/listing-policy" className="underline decoration-dotted underline-offset-2 hover:text-white">
                  listing policy
                </Link>{' '}
                first if you are not sure your tool qualifies.
              </p>
            </div>
            <Link href="/submit"
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Submit your tool <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 border-t pt-3 text-xs text-slate-500" style={{ borderColor: 'rgba(233,69,96,0.2)' }}>
            Looking for a custom AI agent built for your business instead?{' '}
            <Link href="/agents" className="font-semibold transition hover:text-white" style={{ color: '#e94560' }}>
              Tell us what you need →
            </Link>
          </p>
        </div>

        {/* Contact Form */}
        <ContactForm package={pkgType} />

        {/* Info cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-sm font-semibold text-white mb-1">Email</p>
            <a href="mailto:listmyai@gmail.com" className="text-sm text-slate-400 hover:text-blue-400 transition">
              listmyai@gmail.com
            </a>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-sm font-semibold text-white mb-1">Response Time</p>
            <p className="text-sm text-slate-400">Usually within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  )
}
