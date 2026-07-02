import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit Your AI Tool — Get Listed Free',
  description: 'Submit your AI tool to ListmyAI directory for free. Get discovered by thousands of users searching for AI solutions. Approval within 24 hours.',
  openGraph: {
    title: 'Submit Your AI Tool | ListmyAI',
    description: 'List your AI tool for free. Reach thousands of users looking for AI solutions.',
    url: 'https://listmyai.com/submit',
  },
  alternates: { canonical: 'https://listmyai.com/submit' },
}

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
