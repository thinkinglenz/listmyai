import type { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact ListmyAI — Advertising, Support & Inquiries',
  description: 'Get in touch with ListmyAI. Ask about sponsorships, advertising options, or report an issue.',
}

export default function ContactPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const pkgType = searchParams.package

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
            Have a question about advertising, partnerships, or need support? We'd love to hear from you.
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
