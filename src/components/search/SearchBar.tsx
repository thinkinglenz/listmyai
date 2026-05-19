'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  defaultValue?: string
  placeholder?: string
  className?: string
  large?: boolean
}

export default function SearchBar({ defaultValue = '', placeholder = 'Search AI tools…', className, large }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      router.push(`/directory?${params}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <Search className={cn(
        'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
        large ? 'h-5 w-5' : 'h-4 w-4'
      )} />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-brand-border bg-white/5 text-white placeholder:text-slate-500',
          'transition focus:border-brand-red/50 focus:outline-none focus:ring-2 focus:ring-brand-red/20',
          large
            ? 'pl-12 pr-36 py-4 text-base'
            : 'pl-10 pr-24 py-2.5 text-sm'
        )}
      />
      <button type="submit"
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-red font-semibold text-white transition hover:bg-red-500',
          'flex items-center gap-2',
          large ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'
        )}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
      </button>
    </form>
  )
}
