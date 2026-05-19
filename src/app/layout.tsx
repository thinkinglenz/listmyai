import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'ListmyAI — AI Tools Directory', template: '%s | ListmyAI' },
  description: 'Discover, compare, and save on the best AI tools. Find free trials, promo codes, and deals on 1000+ AI products.',
  keywords: ['AI tools', 'AI directory', 'AI deals', 'ChatGPT alternatives', 'AI software'],
  openGraph: {
    siteName: 'ListmyAI',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
