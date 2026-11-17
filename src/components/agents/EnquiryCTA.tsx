'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, MessageSquareText } from 'lucide-react'

/**
 * The "talk to us" prompt.
 *
 * It exists because the enquiry chat was reachable only on the agent and
 * pair pages, and on those it sat in a right-hand column that falls below
 * several screens of copy on a phone. A visitor on the catalogue index, on an
 * industry hub, or on any page on a narrow screen had no visible way to start
 * a conversation at all.
 *
 * `variant="sticky"` pins a bar to the bottom of small screens only. It stays
 * out of the way until the visitor has scrolled past the top of the page, so
 * it does not cover the first thing they see — and it hides itself once the
 * chat is actually on screen, because a button that scrolls you to something
 * you are already looking at is just noise.
 */
export default function EnquiryCTA({
  targetId = 'enquiry',
  accent = '#e94560',
  label = 'Connect to get your custom agent built',
  sub,
  variant = 'block',
}: {
  targetId?: string
  accent?: string
  label?: string
  sub?: string
  variant?: 'block' | 'sticky'
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (variant !== 'sticky') return

    const target = document.getElementById(targetId)
    let chatVisible = false

    // Hide the bar while the chat itself is on screen.
    const io = target
      ? new IntersectionObserver(([e]) => { chatVisible = e.isIntersecting; sync() }, { threshold: 0.15 })
      : null
    io?.observe(target!)

    function sync() {
      setShow(window.scrollY > 320 && !chatVisible)
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => {
      window.removeEventListener('scroll', sync)
      io?.disconnect()
    }
  }, [targetId, variant])

  function go() {
    const el = document.getElementById(targetId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Put the cursor in the box as well. Scrolling someone to a form and
    // making them click it is a step that loses people.
    el.querySelector('textarea')?.focus({ preventScroll: true })
  }

  if (variant === 'sticky') {
    return (
      <div
        className={`fixed inset-x-0 bottom-0 z-40 p-3 transition-transform duration-200 lg:hidden ${show ? 'translate-y-0' : 'translate-y-[130%]'}`}
        style={{ background: 'linear-gradient(to top, #0d1117 60%, transparent)' }}
      >
        <button
          type="button"
          onClick={go}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-lg"
          style={{ background: accent, boxShadow: `0 10px 30px -8px ${accent}` }}
        >
          <MessageSquareText className="h-4 w-4" />
          {label}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={go}
      className="group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left transition hover:bg-white/[0.06] sm:w-auto"
      style={{ border: `1px solid ${accent}55`, background: `${accent}12` }}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}28` }}>
        <MessageSquareText className="h-4 w-4" style={{ color: accent }} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-white">{label}</span>
        {sub && <span className="mt-0.5 block text-xs" style={{ color: '#94a3b8' }}>{sub}</span>}
      </span>
      <ArrowRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: accent }} />
    </button>
  )
}
