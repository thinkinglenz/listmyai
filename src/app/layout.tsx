import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdvertiseTopBar from '@/components/layout/AdvertiseTopBar'

const GA_ID = 'G-DHPH8TWB2E'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://listmyai.com'),
  title: { default: 'ListmyAI — Find the Best AI Tools, Deals & Promo Codes', template: '%s | ListmyAI' },
  description: 'Discover 19,000+ AI tools across 20+ categories. Compare pricing, read reviews, find promo codes and free trials. The most comprehensive AI tools directory updated daily.',
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
    description: 'Discover 19,000+ AI tools. Compare pricing, find promo codes, free trials, and deals on the best AI software.',
    url: 'https://listmyai.com',
    locale: 'en_US',
    images: [
      {
        url: 'https://listmyai.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ListmyAI — The #1 AI Tools Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ListmyAI — Find the Best AI Tools, Deals & Promo Codes',
    description: 'Discover 19,000+ AI tools. Compare pricing, find promo codes, free trials, and deals.',
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
  alternates: {
    canonical: 'https://listmyai.com',
    // Emits <link rel="alternate" type="application/rss+xml">, which is how
    // browsers and automation tools discover the feed without being told.
    types: { 'application/rss+xml': 'https://listmyai.com/rss.xml' },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? undefined,
  },
  other: {
    'google-adsense-account': 'ca-pub-5210860252235896',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': 'https://listmyai.com/#organization',
              name: 'ListmyAI',
              url: 'https://listmyai.com',
              logo: { '@type': 'ImageObject', url: 'https://listmyai.com/opengraph-image' },
              sameAs: [],
              description: 'The most comprehensive AI tools directory. Discover, compare, and find deals on 19,000+ AI tools across 20+ categories.',
            },
            {
              '@type': 'WebSite',
              '@id': 'https://listmyai.com/#website',
              url: 'https://listmyai.com',
              name: 'ListmyAI',
              publisher: { '@id': 'https://listmyai.com/#organization' },
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: 'https://listmyai.com/directory?q={search_term_string}' },
                'query-input': 'required name=search_term_string',
              },
            },
          ],
        }) }} />
        {/* Google AdSense — loaded lazily to avoid blocking initial render */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5210860252235896"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
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
          <AdvertiseTopBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
