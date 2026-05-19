import Link from 'next/link'

const LAST_UPDATED = '19 May 2026'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white">Terms of Use</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-slate-400">

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using ListmyAI (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Service. These terms apply to all visitors, users, and anyone who submits or manages a listing.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">2. What ListmyAI Is</h2>
          <p>ListmyAI is an independent online directory of AI tools and products. We do not develop, sell, endorse, or provide any of the AI tools listed. All product names, logos, and trademarks belong to their respective owners.</p>
          <p className="mt-3">Some listings are submitted voluntarily by tool owners. Others are automatically enrolled from publicly available sources. Auto-enrolled listings are clearly labelled. Tool owners may claim, edit, or request removal of their listings at any time.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">3. Listing Submissions</h2>
          <p>When you submit a listing, you represent that:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>You are authorised to represent the AI tool or company being listed</li>
            <li>All information provided is accurate and not misleading</li>
            <li>Your listing does not infringe any third-party intellectual property rights</li>
            <li>You will keep listing information current and accurate</li>
          </ul>
          <p className="mt-3">We reserve the right to reject, edit, or remove any listing at our discretion, including listings that are inaccurate, misleading, offensive, or in violation of these terms.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">4. Free Listing Period</h2>
          <p>All new listings receive a complimentary 6-month free period from the date the listing is first created or claimed. After the free period, continued visibility may require an active paid plan. We will notify listing owners before their free period expires.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">5. User Accounts</h2>
          <p>To manage listings, you must create an account. You are responsible for maintaining the security of your account credentials and all activity that occurs under your account. Notify us immediately of any unauthorised access.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">6. Reviews & User Content</h2>
          <p>Users may submit reviews of listed tools. By submitting a review, you grant ListmyAI a non-exclusive, royalty-free licence to display and distribute that content. Reviews must be honest, first-hand, and must not contain spam, harassment, or false information.</p>
          <p className="mt-3">We may remove reviews that violate these guidelines without notice.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">7. Intellectual Property</h2>
          <p>The ListmyAI platform design, code, and original content are owned by ListmyAI. All third-party product names, logos, and trademarks displayed on the platform are the property of their respective owners. Their appearance does not imply any affiliation with or endorsement by ListmyAI.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">8. Disclaimer of Warranties</h2>
          <p>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any listing information. Use of any tool discovered through ListmyAI is entirely at your own risk.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, ListmyAI shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the Service or any tool found through it.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">10. Changes to These Terms</h2>
          <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will update the &ldquo;Last updated&rdquo; date at the top of this page.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">11. Contact</h2>
          <p>Questions about these terms? Email us at <a href="mailto:legal@listmyai.com" className="hover:underline" style={{ color: '#e94560' }}>legal@listmyai.com</a>.</p>
        </section>

      </div>

      <div className="mt-10 flex gap-4 text-sm">
        <Link href="/privacy-policy" className="hover:underline" style={{ color: '#e94560' }}>Privacy Policy</Link>
        <Link href="/disclaimer" className="hover:underline" style={{ color: '#e94560' }}>Disclaimer</Link>
        <Link href="/dmca" className="hover:underline" style={{ color: '#e94560' }}>DMCA / Takedown</Link>
      </div>
    </div>
  )
}
