import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare AI Tools Side-by-Side',
  description: 'Compare any two AI tools side-by-side. See pricing, free trials, API access, and real differences — fact-based, no fake scores.',
  openGraph: {
    title: 'Compare AI Tools Side-by-Side — ListmyAI',
    description: 'Pick two AI tools and get a clear, fact-based comparison of pricing, features, and what each is best for.',
    url: 'https://listmyai.com/compare',
  },
  alternates: { canonical: 'https://listmyai.com/compare' },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
