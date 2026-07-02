import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DMCA Policy & Takedown Requests',
  description: 'ListmyAI DMCA policy — how to submit a takedown request if your copyrighted content has been used without authorization.',
  alternates: { canonical: 'https://listmyai.com/dmca' },
}

export default function DmcaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
