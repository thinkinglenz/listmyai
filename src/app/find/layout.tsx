import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Your Perfect AI Tool — AI-Powered Quiz',
  description: 'Answer 5 quick questions and get personalized AI tool recommendations powered by Claude AI. Find the best tool for your exact use case in 60 seconds.',
  openGraph: {
    title: 'AI Tool Finder Quiz | ListmyAI',
    description: 'Get personalized AI tool recommendations in 60 seconds. Answer 5 questions, get matched with the best tools.',
    url: 'https://listmyai.com/find',
  },
  alternates: { canonical: 'https://listmyai.com/find' },
}

export default function FindLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
