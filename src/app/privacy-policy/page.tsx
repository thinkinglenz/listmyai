import Link from 'next/link'

const LAST_UPDATED = '19 May 2026'

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-400">

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">1. Who We Are</h2>
          <p>ListmyAI operates an online directory of AI tools at listmyai.com. When we say &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;, we mean the ListmyAI platform. For GDPR purposes, ListmyAI is the data controller for personal data collected through this site.</p>
          <p className="mt-3">Contact: <a href="mailto:listmyai@gmail.com" className="hover:underline" style={{ color: '#e94560' }}>listmyai@gmail.com</a></p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">2. What Data We Collect</h2>
          <p className="font-medium text-slate-300">Account data (when you register):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Name and email address</li>
            <li>Company name and website (optional)</li>
            <li>Password (stored as a secure hash — never in plain text)</li>
          </ul>
          <p className="mt-4 font-medium text-slate-300">Listing data (when you submit a tool):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Tool name, website, description, pricing</li>
            <li>Contact name and email for listing owner</li>
          </ul>
          <p className="mt-4 font-medium text-slate-300">Usage data (automatically collected):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Pages visited, search queries, time on site</li>
            <li>IP address (anonymised after 24h)</li>
            <li>Browser type and referrer URL</li>
          </ul>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">3. How We Use Your Data</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>To create and manage your account and listings</li>
            <li>To send transactional emails (listing confirmation, trial reminders, password reset)</li>
            <li>To improve the directory and personalise content</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="mt-3">We do <strong className="text-white">not</strong> sell your personal data to third parties. We do not use your data for advertising targeting.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">4. Legal Basis (GDPR)</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-white">Contract performance</strong> — processing necessary to provide you the Service</li>
            <li><strong className="text-white">Legitimate interests</strong> — analytics, security, improving the platform</li>
            <li><strong className="text-white">Consent</strong> — marketing emails (you can withdraw at any time)</li>
            <li><strong className="text-white">Legal obligation</strong> — complying with applicable law</li>
          </ul>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">5. Third-Party Services</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-white">Supabase</strong> — database and authentication (EU region)</li>
            <li><strong className="text-white">Resend</strong> — transactional email delivery</li>
            <li><strong className="text-white">Vercel</strong> — hosting and CDN</li>
          </ul>
          <p className="mt-3">Each provider has their own privacy policy and data processing agreements in place. We only share data with these services as necessary to operate the platform.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">6. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where required by law.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">7. Your Rights</h2>
          <p>Under GDPR and equivalent laws, you have the right to:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;)</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-3">To exercise any right, email <a href="mailto:listmyai@gmail.com" className="hover:underline" style={{ color: '#e94560' }}>listmyai@gmail.com</a>. We will respond within 30 days.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">8. Cookies</h2>
          <p>We use only essential cookies required to operate the Service (session authentication). We do not use advertising or tracking cookies. No cookie consent banner is required for essential cookies only.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">9. Changes to This Policy</h2>
          <p>We may update this policy occasionally. When we do, we&apos;ll update the &ldquo;Last updated&rdquo; date at the top. Significant changes will be communicated by email.</p>
        </section>

      </div>

      <div className="mt-10 flex gap-4 text-sm">
        <Link href="/terms" className="hover:underline" style={{ color: '#e94560' }}>Terms of Use</Link>
        <Link href="/disclaimer" className="hover:underline" style={{ color: '#e94560' }}>Disclaimer</Link>
        <Link href="/dmca" className="hover:underline" style={{ color: '#e94560' }}>DMCA / Takedown</Link>
      </div>
    </div>
  )
}
