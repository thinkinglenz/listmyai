import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, trialReminderEmail, trialExpiredEmail } from '@/lib/email'

// POST /api/email/trial-reminder
// Called by a Vercel cron job daily. Finds trials expiring in 7d or 1d, and expired trials.

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (!process.env.IMPORT_SECRET || auth !== `Bearer ${process.env.IMPORT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://listmyai.com'
  const now = new Date()
  const sent: string[] = []

  // Fetch all active trials with owner emails
  const { data: trials } = await supabase
    .from('listing_trials')
    .select(`
      id, tool_id, trial_ends_at, reminder_7d_sent, reminder_1d_sent, expired_email_sent,
      ai_tools ( name, slug, claimed_by ),
      profiles ( email )
    `)
    .eq('status', 'active')

  for (const trial of trials ?? []) {
    const toolRaw = trial.ai_tools
    const profileRaw = trial.profiles
    const tool = (Array.isArray(toolRaw) ? toolRaw[0] : toolRaw) as { name: string; slug: string; claimed_by: string | null } | null
    const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { email: string } | null
    if (!tool || !profile?.email) continue

    const endsAt = new Date(trial.trial_ends_at)
    const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / 86400_000)
    const upgradeUrl = `${appUrl}/dashboard?upgrade=1`

    if (daysLeft <= 0 && !trial.expired_email_sent) {
      await sendEmail({
        to: profile.email,
        subject: `Your ListmyAI listing for "${tool.name}" has expired`,
        html: trialExpiredEmail(tool.name, upgradeUrl),
      })
      await supabase.from('listing_trials').update({ expired_email_sent: true, status: 'expired' }).eq('id', trial.id)
      sent.push(`expired:${tool.name}`)
    } else if (daysLeft <= 1 && !trial.reminder_1d_sent) {
      await sendEmail({
        to: profile.email,
        subject: `Final reminder: "${tool.name}" listing expires tomorrow`,
        html: trialReminderEmail(tool.name, 1, upgradeUrl),
      })
      await supabase.from('listing_trials').update({ reminder_1d_sent: true }).eq('id', trial.id)
      sent.push(`1d:${tool.name}`)
    } else if (daysLeft <= 7 && !trial.reminder_7d_sent) {
      await sendEmail({
        to: profile.email,
        subject: `Your free listing for "${tool.name}" expires in 7 days`,
        html: trialReminderEmail(tool.name, 7, upgradeUrl),
      })
      await supabase.from('listing_trials').update({ reminder_7d_sent: true }).eq('id', trial.id)
      sent.push(`7d:${tool.name}`)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
