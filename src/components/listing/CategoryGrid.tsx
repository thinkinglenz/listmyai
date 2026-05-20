'use client'

import Link from 'next/link'
import { MessageSquare, Image, Video, Music, Code2, PenLine, TrendingUp, BarChart3, Mic, Search, Zap, Palette, BookOpen, GraduationCap, Heart, Scale, Sparkles, Layers, Bot, Brain, Globe, Wrench, FileText, Shield } from 'lucide-react'
import { useState } from 'react'
import { Category } from '@/types'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, Image, Video, Music, Code2, PenLine, TrendingUp, BarChart3,
  Mic, Search, Zap, Palette, BookOpen, GraduationCap, Heart, Scale, Sparkles,
  Layers, Bot, Brain, Globe, Wrench, FileText, Shield,
}

function CategoryCard({ cat }: { cat: Category }) {
  const [hovered, setHovered] = useState(false)
  const Icon = ICON_MAP[cat.icon] ?? Sparkles
  return (
    <Link href={`/directory?category=${cat.slug}`}
      className="group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all duration-200"
      style={{
        border: `1px solid ${hovered ? `${cat.color}40` : '#1e2a3a'}`,
        background: hovered ? `${cat.color}08` : '#161b27',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200"
        style={{ background: `${cat.color}20`, transform: hovered ? 'scale(1.12)' : 'scale(1)' }}>
        <Icon className="h-5 w-5" style={{ color: cat.color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-white leading-tight">{cat.name}</p>
        {cat.count > 0 && <p className="mt-0.5 text-xs" style={{ color: '#64748b' }}>{cat.count} tools</p>}
      </div>
    </Link>
  )
}

interface Props { categories: Category[]; className?: string }

export default function CategoryGrid({ categories, className }: Props) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', className)}>
      {categories.slice(0, 12).map(cat => <CategoryCard key={cat.slug} cat={cat} />)}
    </div>
  )
}
