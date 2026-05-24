'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, MessageSquare, Check, X, Trash2, RefreshCw,
  ExternalLink, Sparkles, Clock, Eye, ChevronDown, ChevronUp, Zap
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
  id: string
  slug: string
  title: string
  status: string
  is_auto_generated: boolean
  published_at: string
  view_count: number
  tags: string[] | null
  excerpt: string | null
}

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  body: string
  status: string
  created_at: string
  blog_posts: { title: string; slug: string } | null
}

const ADMIN_SECRET = 'lmai@admin2026'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  // Tab
  const [tab, setTab] = useState<'posts' | 'comments'>('posts')

  // Posts
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postStatusFilter, setPostStatusFilter] = useState('all')

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentStatusFilter, setCommentStatusFilter] = useState('pending')
  const [expandedComment, setExpandedComment] = useState<string | null>(null)

  // Generate
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')
  const [customTopic, setCustomTopic] = useState('')

  // Load posts
  const loadPosts = useCallback(async () => {
    setPostsLoading(true)
    const res = await fetch(
      `/api/admin/blog/posts?status=${postStatusFilter}&secret=${ADMIN_SECRET}`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const d = await res.json()
      setPosts(d.posts ?? [])
    }
    setPostsLoading(false)
  }, [postStatusFilter])

  // Load comments
  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    const res = await fetch(
      `/api/admin/blog/comments?status=${commentStatusFilter}&secret=${ADMIN_SECRET}`,
      { cache: 'no-store' }
    )
    if (res.ok) {
      const d = await res.json()
      setComments(d.comments ?? [])
    }
    setCommentsLoading(false)
  }, [commentStatusFilter])

  useEffect(() => { loadPosts() }, [loadPosts])
  useEffect(() => { if (tab === 'comments') loadComments() }, [tab, loadComments])

  // Change post status
  async function changePostStatus(id: string, status: string) {
    await fetch(`/api/admin/blog/posts?secret=${ADMIN_SECRET}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadPosts()
  }

  // Archive post
  async function archivePost(id: string) {
    if (!confirm('Archive this post? It will be hidden from the blog.')) return
    await fetch(`/api/admin/blog/posts?id=${id}&secret=${ADMIN_SECRET}`, { method: 'DELETE' })
    loadPosts()
  }

  // Moderate comment
  async function moderateComment(id: string, action: 'approve' | 'reject') {
    await fetch(`/api/admin/blog/comments?secret=${ADMIN_SECRET}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    loadComments()
  }

  // Delete comment
  async function deleteComment(id: string) {
    if (!confirm('Permanently delete this comment?')) return
    await fetch(`/api/admin/blog/comments?id=${id}&secret=${ADMIN_SECRET}`, { method: 'DELETE' })
    loadComments()
  }

  // Generate blog post
  async function generatePost() {
    setGenerating(true)
    setGenerateMsg('')
    const topicParam = customTopic.trim()
      ? `&topic=${encodeURIComponent(customTopic.trim())}`
      : ''
    const res = await fetch(`/api/cron/generate-blog?secret=${ADMIN_SECRET}${topicParam}`)
    const d = await res.json()
    if (res.ok) {
      setGenerateMsg(`✅ Generated: "${d.post?.title}"`)
      setCustomTopic('')
      loadPosts()
    } else {
      setGenerateMsg(`❌ Error: ${d.error}`)
    }
    setGenerating(false)
  }

  // ── Pending comment count badge
  const pendingCount = tab === 'comments'
    ? comments.filter(c => c.status === 'pending').length
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Blog Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage posts, moderate comments, and generate AI content</p>
        </div>
        <div className="flex gap-2">
          <Link href="/blog" target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            style={{ borderColor: '#1e2a3a' }}>
            <ExternalLink className="h-4 w-4" /> View Blog
          </Link>
        </div>
      </div>

      {/* Generate post panel */}
      <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              <Sparkles className="mr-1 inline h-3 w-3" style={{ color: '#e94560' }} />
              AI Blog Generator
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Custom topic (optional — leave blank for auto-selection)"
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-red-500/50"
              style={{ borderColor: '#1e2a3a', background: '#0d1117' }}
            />
          </div>
          <button
            onClick={generatePost}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#e94560' }}
          >
            {generating ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Zap className="h-4 w-4" /> Generate Post Now</>
            )}
          </button>
        </div>
        {generateMsg && (
          <p className="mt-3 text-sm font-medium" style={{ color: generateMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>
            {generateMsg}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600">
          Uses Claude AI to write a full blog post, FAQs, and SEO metadata. Auto-runs daily at 07:00 UTC.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border p-1" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
        {[
          { key: 'posts', label: 'Posts', icon: FileText },
          { key: 'comments', label: 'Comments', icon: MessageSquare },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'posts' | 'comments')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition"
              style={{
                background: tab === t.key ? '#e94560' : 'transparent',
                color: tab === t.key ? '#fff' : '#94a3b8',
              }}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.key === 'comments' && pendingCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Posts tab ────────────────────────────────────────────────── */}
      {tab === 'posts' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'published', 'draft', 'archived'].map(s => (
              <button
                key={s}
                onClick={() => setPostStatusFilter(s)}
                className="rounded-full border px-3 py-1 text-xs font-semibold capitalize transition"
                style={{
                  borderColor: postStatusFilter === s ? '#e94560' : '#1e2a3a',
                  background: postStatusFilter === s ? 'rgba(233,69,96,0.1)' : 'transparent',
                  color: postStatusFilter === s ? '#e94560' : '#94a3b8',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
                  <div className="h-4 w-2/3 rounded bg-slate-800" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border py-12 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              <FileText className="mx-auto mb-2 h-8 w-8 text-slate-700" />
              <p className="text-sm text-slate-500">No posts found</p>
            </div>
          ) : (
            <div className="divide-y overflow-hidden rounded-2xl border"
              style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              {posts.map(p => (
                <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === 'published' ? 'bg-green-500/15 text-green-400'
                        : p.status === 'draft' ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-slate-500/15 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                      {p.is_auto_generated && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-white line-clamp-1">{p.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(p.published_at)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.view_count} views</span>
                      {p.tags && p.tags.length > 0 && (
                        <span>{p.tags.slice(0, 3).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Link href={`/blog/${p.slug}`} target="_blank"
                      className="rounded-lg border p-1.5 text-slate-500 transition hover:text-white"
                      style={{ borderColor: '#1e2a3a' }}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    {p.status === 'published' && (
                      <button onClick={() => changePostStatus(p.id, 'draft')}
                        className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10"
                        style={{ borderColor: '#1e2a3a' }}>
                        Unpublish
                      </button>
                    )}
                    {p.status === 'draft' && (
                      <button onClick={() => changePostStatus(p.id, 'published')}
                        className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/10"
                        style={{ borderColor: '#1e2a3a' }}>
                        Publish
                      </button>
                    )}
                    {p.status !== 'archived' && (
                      <button onClick={() => archivePost(p.id)}
                        className="rounded-lg border p-1.5 text-red-500 transition hover:bg-red-500/10"
                        style={{ borderColor: '#1e2a3a' }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Comments tab ─────────────────────────────────────────────── */}
      {tab === 'comments' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setCommentStatusFilter(s)}
                className="rounded-full border px-3 py-1 text-xs font-semibold capitalize transition"
                style={{
                  borderColor: commentStatusFilter === s ? '#e94560' : '#1e2a3a',
                  background: commentStatusFilter === s ? 'rgba(233,69,96,0.1)' : 'transparent',
                  color: commentStatusFilter === s ? '#e94560' : '#94a3b8',
                }}
              >
                {s}
              </button>
            ))}
            <button onClick={loadComments}
              className="ml-auto rounded-full border p-1.5 text-slate-500 transition hover:text-white"
              style={{ borderColor: '#1e2a3a' }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-2xl border p-4" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
                  <div className="h-4 w-1/2 rounded bg-slate-800 mb-2" />
                  <div className="h-3 w-full rounded bg-slate-800" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border py-12 text-center" style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-700" />
              <p className="text-sm text-slate-500">No {commentStatusFilter} comments</p>
            </div>
          ) : (
            <div className="divide-y overflow-hidden rounded-2xl border"
              style={{ borderColor: '#1e2a3a', background: '#0f1623' }}>
              {comments.map(c => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{c.author_name}</span>
                        <span className="text-xs text-slate-600">{c.author_email}</span>
                        <span className="text-xs text-slate-700">· {fmtDate(c.created_at)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === 'approved' ? 'bg-green-500/15 text-green-400'
                          : c.status === 'pending' ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-red-500/15 text-red-400'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      {c.blog_posts && (
                        <p className="text-[11px] text-slate-600 mb-1">
                          On:{' '}
                          <Link href={`/blog/${c.blog_posts.slug}`} target="_blank"
                            className="underline hover:text-slate-400 transition">
                            {c.blog_posts.title}
                          </Link>
                        </p>
                      )}
                      {/* Body preview */}
                      <p className={`text-sm text-slate-300 leading-relaxed ${expandedComment === c.id ? '' : 'line-clamp-2'}`}>
                        {c.body}
                      </p>
                      {c.body.length > 120 && (
                        <button
                          onClick={() => setExpandedComment(expandedComment === c.id ? null : c.id)}
                          className="mt-1 flex items-center gap-1 text-[11px] text-slate-600 transition hover:text-slate-400">
                          {expandedComment === c.id
                            ? <><ChevronUp className="h-3 w-3" /> Show less</>
                            : <><ChevronDown className="h-3 w-3" /> Show more</>
                          }
                        </button>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {c.status !== 'approved' && (
                        <button onClick={() => moderateComment(c.id, 'approve')}
                          className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-green-400 transition hover:bg-green-500/10"
                          style={{ borderColor: '#1e2a3a' }}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {c.status !== 'rejected' && (
                        <button onClick={() => moderateComment(c.id, 'reject')}
                          className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/10"
                          style={{ borderColor: '#1e2a3a' }}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      <button onClick={() => deleteComment(c.id)}
                        className="rounded-lg border p-1.5 text-red-500 transition hover:bg-red-500/10"
                        style={{ borderColor: '#1e2a3a' }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
