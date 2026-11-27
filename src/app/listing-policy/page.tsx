import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardCheck, Check, X, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Listing Policy — What We List and What We Do Not',
  description:
    'What qualifies for a ListmyAI directory listing, what does not, and how to submit an AI tool. Clear rules on adult tools, open-source names, paid links and likeness generation.',
  alternates: { canonical: 'https://listmyai.com/listing-policy' },
}

const LAST_UPDATED = '27 November 2026'

/**
 * Written because every borderline request was costing a judgement call and a
 * hand-written reply. Five arrived in a month and four were category
 * questions, which is a sign the rules existed only in someone's head.
 *
 * The exclusions are deliberately specific. "We reserve the right to refuse
 * anything" tells a sender nothing and invites an argument; naming the actual
 * line means most people never write the email, and the ones who do can be
 * answered with a link.
 */

const ALLOWED = [
  'AI tools, apps, APIs and models that anyone can sign up for and use',
  'Free, freemium, paid, and open-source products alike',
  'Early-stage products, as long as there is something working to try',
  'Self-hosted software, developer tools and infrastructure',
  'Adult and companion tools that generate fictional characters, where mature content is off by default',
]

const NOT_ALLOWED: { title: string; body: string }[] = [
  {
    title: 'Sexual imagery of real people',
    body:
      'Anything that generates sexual or intimate imagery of real, identifiable people. That includes face swap, likeness upload, voice or motion cloning of a real person, and tools aimed at public figures. This applies however the tool is marketed and regardless of what its own terms say users have agreed to. It is the one exclusion that is not open to discussion.',
  },
  {
    title: 'Paid links and guest posts',
    body:
      'We do not sell links, articles or placements that pass authority, and we do not accept content written to promote an unrelated site. Sponsorship and advertising are available, are labelled as such on the page, and never change editorial placement.',
  },
  {
    title: 'A name you do not own',
    body:
      'Hosted services built on someone else’s open-source project are welcome, but the listing must say plainly who runs it. A paid service listed under the name of a free project, with no stated relationship, misleads the people reading it. We will ask you to confirm the affiliation before approving.',
  },
  {
    title: 'Products that cannot be tried',
    body:
      'A waiting list, a landing page or a demo video is not a product. Come back when there is something to use.',
  },
  {
    title: 'Deception and harm',
    body:
      'Malware, scams, credential harvesting, engagement fraud, plagiarism or academic-cheating tools, and anything built to impersonate a person or organisation.',
  },
]

export default function ListingPolicyPage() {
  const card = { borderColor: '#1e2a3a', background: '#161b27' }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.2)' }}>
          <ClipboardCheck className="h-6 w-6" style={{ color: '#e94560' }} />
        </div>
        <h1 className="text-4xl font-black text-white">Listing Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          What qualifies for a listing on ListmyAI, what does not, and how to send one in.
          Listings are free for the first six months.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-400">

        <section className="rounded-2xl border p-6" style={card}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Check className="h-4 w-4" style={{ color: '#6ee7b7' }} /> What we list
          </h2>
          <ul className="space-y-2.5">
            {ALLOWED.map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full" style={{ background: '#6ee7b7' }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t pt-4 text-xs" style={{ borderColor: '#1e2a3a' }}>
            We are a directory, not a curator of taste. If a tool works and people can use it,
            it generally belongs here, whether or not we would use it ourselves.
          </p>
        </section>

        <section className="rounded-2xl border p-6" style={card}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <X className="h-4 w-4" style={{ color: '#f87171' }} /> What we do not list
          </h2>
          <div className="space-y-5">
            {NOT_ALLOWED.map(rule => (
              <div key={rule.title}>
                <h3 className="font-semibold text-slate-200">{rule.title}</h3>
                <p className="mt-1.5">{rule.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border p-6" style={card}>
          <h2 className="mb-3 text-lg font-bold text-white">On adult tools specifically</h2>
          <p>
            We list them, and we are not going to pretend otherwise. The line is whether the
            output involves a real person. Tools that generate fictional characters are
            eligible when mature content is off by default and the site gates it properly.
            Tools that put a real person&rsquo;s face, voice or body into sexual content are not,
            and no amount of consent language in your terms changes that answer.
          </p>
        </section>

        <section className="rounded-2xl border p-6" style={card}>
          <h2 className="mb-3 text-lg font-bold text-white">How to submit</h2>
          <p>
            Use the submit form. Emailing us a description means somebody has to retype it,
            which is slower for you than filling in the form yourself.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/submit"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#e94560' }}>
              Submit your tool <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:bg-white/5"
              style={{ border: '1px solid #1e2a3a', color: '#94a3b8' }}>
              Something else
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border p-6" style={card}>
          <h2 className="mb-3 text-lg font-bold text-white">Review, removal and appeals</h2>
          <p>
            Every submission is reviewed by a person before it goes live. We may edit a
            description for accuracy or length, and we may move a tool to a category that
            fits it better than the one suggested.
          </p>
          <p className="mt-3">
            Some listings are auto-enrolled from public information and marked
            &ldquo;Unclaimed&rdquo;. If one of those is yours, you can claim it from the listing
            page, or ask for it to be removed.
          </p>
          <p className="mt-3">
            A listing can be removed at any time if the product stops working, the site goes
            dark, or it turns out to break the rules above. If you think a decision was wrong,
            reply and say why — a product that has changed can be submitted again.
          </p>
        </section>

        <section className="rounded-2xl border p-6" style={card}>
          <h2 className="mb-3 text-lg font-bold text-white">Reporting a listing</h2>
          <p>
            If something here breaks this policy, tell us and we will look at it. For
            copyright, use the <Link href="/dmca" className="hover:underline" style={{ color: '#e94560' }}>DMCA page</Link>.
            For anything else, including a tool using your likeness without your agreement,
            email <a href="mailto:listmyai@gmail.com" className="hover:underline" style={{ color: '#e94560' }}>listmyai@gmail.com</a> and
            we will prioritise it.
          </p>
        </section>

        <p className="pt-2 text-xs text-slate-600">
          This policy will change as new kinds of tools appear. The date at the top is when it
          last did.
        </p>
      </div>
    </div>
  )
}
