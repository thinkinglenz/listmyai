'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

const DIR_LINKS = [
  { href: '/directory',  label: 'Browse All AI Tools' },
  { href: '/find',       label: 'Find My AI Tool' },
  { href: '/compare',    label: 'Compare Tools' },
  { href: '/deals',      label: 'Deals & Promotions' },
  { href: '/categories', label: 'Categories' },
  { href: '/submit',     label: 'Submit Your AI' },
]

const LEGAL_LINKS = [
  { href: '/terms',          label: 'Terms of Use' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/refund-policy',  label: 'Refund Policy' },
  { href: '/disclaimer',     label: 'Disclaimer' },
  { href: '/dmca',           label: 'DMCA / Takedown' },
]

export default function Footer() {
  const { user } = useAuth()

  const accountLinks = user
    ? [
        { href: '/dashboard',  label: 'Dashboard' },
        { href: '/submit',     label: 'Submit a Tool' },
        { href: '/pricing',    label: 'Pricing Plans' },
      ]
    : [
        { href: '/register',   label: 'Sign Up Free' },
        { href: '/login',      label: 'Log In' },
        { href: '/dashboard',  label: 'Dashboard' },
        { href: '/pricing',    label: 'Pricing Plans' },
      ]

  return (
    <footer className="border-t border-brand-border bg-brand-dark mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                List<span className="text-brand-red">my</span>AI
              </span>
            </Link>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-[200px]">
              The AI tools directory — discover, compare, and save on the best AI products.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              First 6 months free for all listings.
            </p>
          </div>

          {/* Directory */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Directory</h3>
            <ul className="space-y-2">
              {DIR_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account — auth-aware */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</h3>
            <ul className="space-y-2">
              {accountLinks.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-brand-border pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ListmyAI. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 max-w-lg">
            All product names, logos, and trademarks are the property of their respective owners.
            ListmyAI is an independent directory and is not affiliated with, endorsed by, or
            sponsored by any listed company.
          </p>
        </div>
      </div>
    </footer>
  )
}
