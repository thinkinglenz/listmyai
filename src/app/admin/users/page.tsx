'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, Ban, Mail, ChevronDown, User } from 'lucide-react'

interface AppUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  plan: 'free' | 'pro' | 'sponsored'
  listings?: number
  joined: string
  status?: 'active' | 'banned'
  lastSeen?: string
}

const PLAN_META: Record<string, { color: string; bg: string }> = {
  free:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  pro:       { color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  sponsored: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        if (d.users) setUsers(d.users)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan
    return matchSearch && matchRole && matchPlan
  })

  function formatDate(iso: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  async function toggleRole(id: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole as 'user' | 'admin' } : u))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Users</h1>
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${users.length} registered · live from Supabase`}
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: users.length, color: '#e2e8f0' },
          { label: 'Pro', value: users.filter(u=>u.plan==='pro').length, color: '#6366f1' },
          { label: 'Sponsored', value: users.filter(u=>u.plan==='sponsored').length, color: '#f59e0b' },
          { label: 'Admins', value: users.filter(u=>u.role==='admin').length, color: '#e94560' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }} />
        </div>
        <div className="relative">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="appearance-none rounded-xl border py-2.5 pl-3 pr-8 text-sm text-slate-300 outline-none"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        <div className="relative">
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
            className="appearance-none rounded-xl border py-2.5 pl-3 pr-8 text-sm text-slate-300 outline-none"
            style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
            <option value="all">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="sponsored">Sponsored</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">Loading from Supabase…</div>
      )}

      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
          style={{ borderColor: '#1e2a3a', background: '#161b27', borderStyle: 'dashed' }}>
          <User className="h-10 w-10 mb-3 text-slate-700" />
          <p className="font-semibold text-slate-400">No users yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Users will appear here when they sign up via the site.
          </p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  style={{ borderColor: '#1e2a3a' }}>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2a3a' }}>
                {filtered.map(user => {
                  const pm = PLAN_META[user.plan] ?? PLAN_META.free
                  return (
                    <tr key={user.id} className="group transition hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: user.role === 'admin' ? '#e94560' : '#1e2a3a' }}>
                            {user.name[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${user.role === 'admin' ? 'text-red-400' : 'text-slate-500'}`}>
                          {user.role === 'admin' ? '⚡ Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                          style={{ color: pm.color, background: pm.bg }}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{formatDate(user.joined)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {user.email !== '—' && (
                            <a href={`mailto:${user.email}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white">
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button onClick={() => toggleRole(user.id, user.role)}
                            title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-amber-400">
                            <Shield className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">No users found.</div>
          )}
        </div>
      )}
    </div>
  )
}
