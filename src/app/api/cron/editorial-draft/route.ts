// One editorial draft a day.
//
// Writes a draft and stops. Publishing is a human action in /admin/editorials
// — this route has no path to it, by design.
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { pickCandidate, writeDraft, saveDraft } from '@/lib/editorial/generate'

export const maxDuration = 120

async function alertAdmin(subject: string, html: string) {
  try {
    const { sendEmail } = await import('@/lib/email')
    await sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL ?? 'listmyai@gmail.com', subject, html })
  } catch { /* the draft is already saved; the mail is a convenience */ }
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req, 'CRON_SECRET')
  if (denied) return denied

  try {
    const tool = await pickCandidate()
    if (!tool) {
      return NextResponse.json({ ok: true, skipped: 'Every claimed listing already has an editorial' })
    }

    const draft = await writeDraft(tool)
    const slug = await saveDraft(tool, draft)

    await alertAdmin(
      `Editorial draft ready: ${tool.name}`,
      `<p>A draft about <strong>${tool.name}</strong> is waiting for review.</p>
       <p>Independent sources found: ${draft.sources.length}${draft.sources.length === 0 ? ' — the piece should say so plainly' : ''}</p>
       <p><a href="https://listmyai.com/admin/editorials">Review it</a>. Nothing is public until you publish it.</p>`
    )

    return NextResponse.json({ ok: true, slug, tool: tool.name, sources: draft.sources.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await alertAdmin(
      '⚠️ Editorial draft generation failed',
      `<p>${msg.slice(0, 500)}</p><p>${
        msg.includes('credit balance')
          ? 'The Anthropic balance has run out — top up at console.anthropic.com.'
          : 'Check the Vercel function logs.'
      }</p>`
    )
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
