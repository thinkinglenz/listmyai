import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Tool Categories — Browse by Category',
  description: 'Explore AI tools organized by category — chatbots, image generators, code assistants, writing tools, video editors, marketing AI, and 20+ more categories.',
  openGraph: {
    title: 'AI Tool Categories | ListmyAI',
    description: 'Browse 20+ categories of AI tools. Find the right tool for writing, coding, design, marketing, and more.',
    url: 'https://listmyai.com/categories',
  },
  alternates: { canonical: 'https://listmyai.com/categories' },
}

const categoriesLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'AI Tool Categories',
  url: 'https://listmyai.com/categories',
  description: 'Browse AI tools organized by 20+ categories.',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      'Chatbot / Assistant', 'Image Generation', 'Video Generation', 'Audio & Music',
      'Code Assistant', 'Writing & Copy', 'SEO & Marketing', 'Analytics & Data',
      'Automation', 'Design & Creative', 'Education & Learning', 'Productivity',
    ].map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      url: `https://listmyai.com/directory?category=${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`,
    })),
  },
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesLd) }} />
      {children}
    </>
  )
}
