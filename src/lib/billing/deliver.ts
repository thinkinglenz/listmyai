// Fulfils a paid package: featured placement, the homepage spotlight, the
// social blast, the article, and a report to the buyer. Every step is
// best-effort and recorded — a failed post must never leave an order stuck.

import { createClient } from '@supabase/supabase-js'
import { PACKAGES, type PackageId } from './packages'
import { announceToolToSocial, type Network } from '@/lib/social/post'
import { getSocialHook } from '@/lib/social/hook'
import { sendEmail } from '@/lib/email'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const SITE = 'https://listmyai.com'

export async function deliverOrder(orderId: string): Promise<{ ok: boolean; note: string }> {
  const supabase = db()
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (!order) return { ok: false, note: 'order not found' }
  if (order.delivered_at) return { ok: true, note: 'already delivered' }

  const pkg = PACKAGES[order.package as PackageId]
  if (!pkg || !order.tool_id) return { ok: false, note: 'unknown package or no listing attached' }

  const { data: tool } = await supabase
    .from('ai_tools')
    .select('id, name, slug, tagline, description, status, categories(name)')
    .eq('id', order.tool_id)
    .maybeSingle()
  if (!tool) return { ok: false, note: 'listing not found' }

  const done: string[] = []
  const failed: string[] = []
  const links: { network: string; url: string | null }[] = []

  // 1. Featured placement.
  if (pkg.featuredDays > 0) {
    const until = new Date(Date.now() + pkg.featuredDays * 86_400_000).toISOString()
    const { error } = await supabase.from('ai_tools')
      .update({ is_featured: true, featured_until: until, listing_plan: pkg.id })
      .eq('id', tool.id)
    error ? failed.push(`featured: ${error.message}`) : done.push(`Featured until ${until.slice(0, 10)}`)
  }

  // 2. Homepage spotlight, as a paid claim rather than the free rotation.
  if (pkg.spotlight) {
    const { error } = await supabase.from('spotlight_bids').insert({
      tool_id: tool.id,
      user_id: order.user_id,
      amount_cents: 100,
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      payment_ref: `${order.provider}:${order.provider_ref}`,
      is_mock_payment: false,
    })
    error ? failed.push(`spotlight: ${error.message}`) : done.push('Homepage spotlight booked for 24 hours')
  }

  // 3. The social blast. Networks already carrying this listing are skipped.
  if (pkg.socialBlast && tool.status === 'active') {
    const { data: posted } = await supabase.from('tool_social_posts').select('network').eq('tool_id', tool.id)
    const skip = [...new Set((posted ?? []).map(p => p.network))] as Network[]
    const hook = await getSocialHook(tool.id).catch(() => null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = (tool as any).categories
    const result = await announceToolToSocial({
      name: tool.name, slug: tool.slug, tagline: tool.tagline || tool.description || '', hook,
      category: (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? undefined,
    }, { skip })

    for (const [network, r] of Object.entries(result)) {
      if (network === 'links') continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = r as any
      if (res?.ok) done.push(`Posted to ${network}`)
      else if (res?.error && res.error !== 'already posted') failed.push(`${network}: ${res.error}`)
    }
    for (const l of result.links) {
      links.push({ network: l.network, url: l.postUrl })
      await supabase.from('tool_social_posts').insert({
        tool_id: tool.id, network: l.network, post_id: l.postId, post_url: l.postUrl, source: 'paid',
      }).then(() => {}, () => {})
    }
  }

  // 4. Written content. Queued rather than generated inline: an article is
  // reviewed before it is published, and a sponsored review needs a human to
  // actually use the tool before writing about it.
  if (pkg.blogPost || pkg.review) {
    const kind = pkg.review ? 'review' : 'article'
    const { error } = await supabase.from('content_requests').insert({
      tool_id: tool.id, order_id: order.id, kind, status: 'pending',
    })
    error
      ? failed.push(`${kind}: ${error.message}`)
      : done.push(kind === 'review' ? 'Sponsored review queued — we will be in touch for access' : 'Article queued for publication')
  }

  // 5. Category sponsorship and deal placement are flags the pages read.
  if (pkg.categorySponsor) {
    const until = new Date(Date.now() + 31 * 86_400_000).toISOString()
    const { error } = await supabase.from('ai_tools')
      .update({ is_sponsored: true, featured_until: until }).eq('id', tool.id)
    error ? failed.push(`sponsor: ${error.message}`) : done.push('Top of your category for 31 days')
  }
  if (pkg.dealFeature) {
    const until = new Date(Date.now() + 30 * 86_400_000).toISOString()
    const { error } = await supabase.from('ai_tools')
      .update({ deal_featured_until: until }).eq('id', tool.id)
    error ? failed.push(`deal: ${error.message}`) : done.push('Promo code on the Deals page for 30 days')
  }

  await supabase.from('orders').update({
    status: failed.length && !done.length ? 'failed' : 'delivered',
    delivered_at: new Date().toISOString(),
    delivery_note: [...done, ...failed.map(f => `FAILED ${f}`)].join(' · ').slice(0, 1000),
  }).eq('id', order.id)

  // 6. The report. This is the product's proof, and what earns a second sale.
  if (order.email) {
    const rows = [
      ...done.map(d => `<li style="margin:4px 0">✅ ${d}</li>`),
      ...links.filter(l => l.url).map(l => `<li style="margin:4px 0">🔗 <a href="${l.url}">${l.network}</a></li>`),
    ].join('')
    await sendEmail({
      to: order.email,
      subject: `${pkg.name} delivered — ${tool.name} is live`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="margin:0 0 8px">${tool.name} is live 🚀</h2>
        <p style="color:#475569">Here is everything your ${pkg.name} included:</p>
        <ul style="padding-left:18px;color:#0f172a">${rows}</ul>
        <p style="color:#475569">Track views and clicks any time in your
          <a href="${SITE}/dashboard">dashboard</a>.</p>
        ${failed.length ? `<p style="color:#b45309">A couple of steps need a retry on our side; we are on it and will follow up.</p>` : ''}
      </div>`,
    }).catch(() => {})
  }

  return { ok: failed.length === 0, note: [...done, ...failed].join(' · ') }
}
