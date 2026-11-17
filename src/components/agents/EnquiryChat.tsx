'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, CheckCircle2, Loader2 } from 'lucide-react'

interface Turn { role: 'user' | 'model'; content: string }

/**
 * The enquiry, as a conversation rather than a form.
 *
 * The point is to finish the scoping here, so nobody has to go back and forth
 * by email afterwards. That only works if the visitor keeps typing, which is
 * why the composer is never disabled mid-send: a text box that goes dead while
 * it "thinks" reads as broken and people stop.
 */
export default function EnquiryChat({
  agentSlug, agentName, accent, opener,
}: { agentSlug: string; agentName: string; accent: string; opener: string }) {
  const [messages, setMessages] = useState<Turn[]>([{ role: 'model', content: opener }])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A script fills every field it can see. This one is hidden from people, so
  // anything in it did not come from a person.
  const [honeypot, setHoneypot] = useState('')
  // Set on mount, not during render: a render can happen on the server or run
  // twice, and either would make the timing meaningless. Null until the
  // browser has it, and the server treats a null as "no opinion" rather than
  // as an instant submission.
  const mountedAt = useRef<number | null>(null)
  useEffect(() => { mountedAt.current = Date.now() }, [])
  const scrollAnchor = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  async function send() {
    const text = draft.trim()
    if (!text || sending || done) return

    const next: Turn[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setDraft('')
    setError(null)
    setSending(true)

    try {
      const res = await fetch('/api/agents/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSlug,
          messages: next,
          honeypot,
          elapsedMs: mountedAt.current === null ? null : Date.now() - mountedAt.current,
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        // The visitor's own message stays on screen — losing what someone
        // just typed is the worst possible response to a failure.
        setError(data?.error ?? 'Something went wrong sending that. Please try again.')
        return
      }

      setMessages(m => [...m, { role: 'model', content: data.reply }])
      if (data.complete) setDone(true)
    } catch {
      setError('That did not send. Check your connection and try again.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="rounded-2xl" style={{ border: '1px solid #1e2a3a', background: '#0f131c' }}>
      <div className="border-b px-5 py-3.5" style={{ borderColor: '#1e2a3a' }}>
        <p className="text-sm font-bold text-white">Tell us about your {agentName} setup</p>
        <p className="mt-0.5 text-xs" style={{ color: '#64748b' }}>
          A few questions, then we will come back to you by email.
        </p>
      </div>

      <div className="max-h-[26rem] space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={
                m.role === 'user'
                  ? { background: accent, color: '#fff' }
                  : { background: '#161b27', color: '#cbd5e1', border: '1px solid #1e2a3a' }
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
              style={{ background: '#161b27', color: '#64748b', border: '1px solid #1e2a3a' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking
            </div>
          </div>
        )}

        {done && (
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>That is everything we need. We will be in touch by email.</span>
          </div>
        )}

        {error && (
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
        )}

        <div ref={scrollAnchor} />
      </div>

      {!done && (
        <div className="border-t p-3" style={{ borderColor: '#1e2a3a' }}>
          {/* Hidden from people, visible to scripts. Not type="hidden": some
              bots skip those, and aria-hidden keeps it away from screen
              readers, who are people. */}
          <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor={`company-url-${agentSlug}`}>Company website</label>
            <input
              id={`company-url-${agentSlug}`}
              name="company-url"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
              }}
              placeholder="Type your answer…"
              maxLength={2000}
              className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              style={{ background: '#0b0f16', border: '1px solid #1e2a3a' }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || sending}
              aria-label="Send"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: accent }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px]" style={{ color: '#475569' }}>
            Enter to send, Shift+Enter for a new line.
          </p>
        </div>
      )}
    </div>
  )
}
