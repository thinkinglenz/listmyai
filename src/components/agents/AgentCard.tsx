import Link from 'next/link'
import { ArrowRight, Headphones, Filter, CalendarCheck, Inbox, FileText, Repeat, Send, Star, Scale, Package, UserSearch, BarChart3, Bot } from 'lucide-react'
import type { Agent } from '@/lib/agents'

// Icons are named in the catalogue as strings so the data stays serialisable
// and free of imports. Anything unmapped falls back to a generic bot rather
// than crashing the grid.
const ICONS: Record<string, React.ElementType> = {
  Headphones, Filter, CalendarCheck, Inbox, FileText, Repeat,
  Send, Star, Scale, Package, UserSearch, BarChart3,
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const Icon = ICONS[agent.icon] ?? Bot
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: '1px solid #1e2a3a', background: '#161b27' }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
        style={{ background: `${agent.accent}18` }}
      >
        <Icon className="h-5 w-5" style={{ color: agent.accent }} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">{agent.name}</h3>
      {/* The job line carries the search phrase; the brand name alone would
          tell a first-time visitor nothing about what it does. */}
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider" style={{ color: agent.accent }}>
        {agent.job}
      </p>

      <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
        {agent.tagline}
      </p>

      <span
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5"
        style={{ color: agent.accent }}
      >
        See what it does <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}
