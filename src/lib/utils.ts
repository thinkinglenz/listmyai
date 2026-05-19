import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PricingModel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const PRICING_LABELS: Record<PricingModel, string> = {
  free: 'Free',
  freemium: 'Freemium',
  free_trial: 'Free Trial',
  subscription: 'Subscription',
  pay_per_use: 'Pay Per Use',
  one_time: 'One-Time',
  enterprise: 'Enterprise',
}

export const PRICING_COLORS: Record<PricingModel, string> = {
  free: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  freemium: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  free_trial: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  subscription: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  pay_per_use: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  one_time: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  enterprise: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

export const PLATFORM_LABELS: Record<string, string> = {
  web: 'Web', ios: 'iOS', android: 'Android', mac: 'macOS',
  windows: 'Windows', linux: 'Linux', api: 'API', chrome: 'Chrome', vscode: 'VS Code',
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))
}
