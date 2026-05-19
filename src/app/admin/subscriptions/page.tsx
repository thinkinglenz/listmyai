'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Users, CreditCard, ArrowUpRight, Crown } from 'lucide-react'

interface SubUser {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'sponsored'
  joined: string
  listings: number
}

const PLAN_PRICES: Record<string, number> = { free: 0, pro: 19, sponsored: 99 }
const PLAN_META: Record<string, { color: string; bg: string; label: string }> = {
  free:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Free' },
  pro:       { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: 'Pro — $19/mo' },
  sponsored: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Sponsored — $99/mo' },
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<SubUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        if (d.users) setUsers(d.users)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const proUsers = users.filter(u => u.plan === 'pro')
  const sponsoredUsers = users.filter(u => u.plan === 'sponsored')
  const freeUsers = users.filter(u => u.plan === 'free')
  const mrr = (proUsers.length * 19) + (sponsoredUsers.length * 99)
  const arr = mrr * 12

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Subscriptions & Revenue</h1>
        <p className="text-sm text-slate-500">Live data from Supabase · Plans managed in Dashboard</p>
      </div>

      {/* Revenue cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Monthly Revenue (MRR)', value: `$${mrr.toLocaleString()}`, sub: 'From paid plans', icon: DollarSign, color: '#10b981' },
          { label: 'Annual Run Rate (ARR)', value: `$${arr.toLocaleString()}`, sub: 'If all plans renew', icon: TrendingUp, color: '#6366f1' },
          { label: 'Paying Customers', value: (proUsers.length + sponsoredUsers.length).toString(), sub: `${proUsers.length} Pro · ${sponsoredUsers.length} Sponsored`, icon: CreditCard, color: '#e94560' },
          { label: 'Total Users', value: users.length.toString(), sub: `${freeUsers.length} free · ${users.length - freeUsers.length} paid`, icon: Users, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-slate-500">{s.label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${s.color}18` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{loading ? '—' : s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {(['sponsored', 'pro', 'free'] as const).map(plan => {
          const pm = PLAN_META[plan]
          const planUsers = users.filter(u => u.plan === plan)
          const revenue = planUsers.length * PLAN_PRICES[plan]
          return (
            <div key={plan} className="rounded-2xl border p-5" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4" style={{ color: pm.color }} />
                <p className="font-bold text-white">{pm.label}</p>
              </div>
              <p className="text-3xl font-black mb-1" style={{ color: pm.color }}>{loading ? '—' : planUsers.length}</p>
              <p className="text-xs text-slate-500">users on this plan</p>
              {revenue > 0 && (
                <p className="mt-2 text-sm font-semibold text-white">
                  ${revenue}/mo revenue
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Users table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
        <div className="border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: '#1e2a3a' }}>
          <h2 className="font-bold text-white">All Users by Plan</h2>
          <span className="text-xs text-slate-500">{users.length} total</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading from Supabase…</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm">No users yet.</p>
            <p className="text-slate-600 text-xs mt-1">Users who register on listmyai.com will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500" style={{ borderColor: '#1e2a3a' }}>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Monthly Value</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {[...users].sort((a, b) => PLAN_PRICES[b.plan] - PLAN_PRICES[a.plan]).map(user => {
                  const pm = PLAN_META[user.plan]
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: pm.color }}>
                            {(user.name || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{user.name || 'Unnamed'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                          style={{ color: pm.color, background: pm.bg }}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold" style={{ color: PLAN_PRICES[user.plan] > 0 ? '#10b981' : '#475569' }}>
                          {PLAN_PRICES[user.plan] > 0 ? `$${PLAN_PRICES[user.plan]}/mo` : 'Free'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(user.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-amber-400">💡 Note:</span> Plan upgrades are currently manual.
          To upgrade a user, go to <a href="/admin/users" className="underline" style={{ color: '#e94560' }}>Users</a> and update their plan in Supabase.
          Stripe integration can be added to automate billing — ask your developer.
        </p>
      </div>
    </div>
  )
}
