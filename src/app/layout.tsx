import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const GA_ID = 'G-DHPH8TWB2E'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://listmyai.com'),
  title: { default: 'ListmyAI — Find the Best AI Tools, Deals & Promo Codes', template: '%s | ListmyAI' },
  description: 'Discover 800+ AI tools across 20+ categories. Compare pricing, read reviews, find promo codes and free trials. The most comprehensive AI tools directory updated daily.',
  keywords: [
    'AI tools', 'AI tools directory', 'best AI tools', 'AI software', 'AI deals',
    'AI promo codes', 'AI free trial', 'ChatGPT alternatives', 'AI writing tools',
    'AI image generator', 'AI video generator', 'AI code assistant', 'AI chatbot',
    'compare AI tools', 'AI tool reviews', 'artificial intelligence tools',
    'free AI tools', 'AI tools list', 'AI apps', 'machine learning tools',
  ],
  openGraph: {
    siteName: 'ListmyAI',
    type: 'website',
    title: 'ListmyAI — Find the Best AI Tools, Deals & Promo Codes',
    description: 'Discover 800+ AI tools. Compare pricing, find promo codes, free trials, and deals on the best AI software.',
    url: 'https://listmyai.com',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ListmyAI — Find the Best AI Tools, Deals & Promo Codes',
    description: 'Discover 800+ AI tools. Compare pricing, find promo codes, free trials, and deals.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: 'https://listmyai.com' },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? undefined,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
