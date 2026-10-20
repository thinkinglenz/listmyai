import type { Metadata } from 'next'
import Link from 'next/link'
import { listEditorials } from '@/lib/editorials'
import { plainExcerpt } from '@/lib/blog/markdown'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Editorials — independent write-ups of AI tools',
  description:
    'Long-form editorials on individual AI tools, written from sources outside the vendor’s own marketing. No paid placement.',
  alternates: { canonical: 'https://listmyai.com/editorial' },
}

export default async function EditorialIndex() {
  // The index tolerates a database failure; the article pages do not.
  //
  // This page is prerendered, so a throw here fails the whole build — which
  // means a Supabase outage would have blocked every deploy, as nearly
  // happened on 2026-10-11. An index with nothing in it is a fair rendering
  // of "we cannot list anything right now". An individual editorial is
  // different: there the choice is 404 or 5xx, and it must be 5xx.
  let editorials: Awaited<ReturnType<typeof listEditorials>> = []
  try {
    editorials = await listEditorials(60)
  } catch (e) {
    console.warn('[editorial] index could not load', e)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#e94560' }}>Editorials</p>
      <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
        One tool at a time, read properly
      </h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        Long-form write-ups of individual tools, built from third-party discussion rather than the
        vendor’s own copy. Where we find no independent coverage, the piece says so. Nothing here is
        paid placement, and the companies covered do not edit these pages.
      </p>

      {editorials.length === 0 ? (
        <p className="mt-12 text-slate-500">The first editorials are being written. Check back shortly.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {editorials.map(e => (
            <Link key={e.slug} href={`/editorial/${e.slug}`}
              className="block rounded-2xl border p-6 transition hover:border-slate-600"
              style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
              <h2 className="text-xl font-bold text-white">{e.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {e.standfirst ?? plainExcerpt(e.body_md, 180)}
              </p>
              <p className="mt-3 text-xs text-slate-600">
                {e.published_at && new Date(e.published_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
                {e.sources?.length ? ` · ${e.sources.length} sources cited` : ' · no independent coverage found'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
