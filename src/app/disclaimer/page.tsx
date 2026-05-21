import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

const LAST_UPDATED = '19 May 2026'

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(233,69,96,0.12)', border: '1px solid rgba(233,69,96,0.2)' }}>
          <AlertCircle className="h-6 w-6" style={{ color: '#e94560' }} />
        </div>
        <h1 className="text-4xl font-black text-white">Disclaimer</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-slate-400">

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Independent Directory</h2>
          <p>ListmyAI is an independent, third-party directory of AI tools and products. We are not affiliated with, endorsed by, or sponsored by any of the companies, products, or services listed on this platform.</p>
          <p className="mt-3">All product names, logos, brand names, and trademarks displayed on ListmyAI are the property of their respective owners. Their appearance on this site does not imply any relationship with or endorsement by those owners.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Auto-Enrolled Listings</h2>
          <p>Some listings on ListmyAI are automatically populated from publicly available information on the internet. These listings are clearly marked with an &ldquo;Auto-enrolled&rdquo; or &ldquo;Unclaimed&rdquo; label.</p>
          <p className="mt-3">Auto-enrolled listings may contain information that is incomplete, outdated, or inaccurate. If you own or represent a listed tool and wish to claim, update, or remove your listing, please visit the listing page and click &ldquo;Claim this listing&rdquo;, or contact us at <a href="mailto:listmyai@gmail.com" style={{ color: '#e94560' }} className="hover:underline">listmyai@gmail.com</a>.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Accuracy of Information</h2>
          <p>While we make reasonable efforts to ensure the information on this platform is accurate and up to date, we cannot guarantee the completeness, accuracy, or reliability of any listing. Pricing, features, and availability of listed tools are subject to change without notice.</p>
          <p className="mt-3">Always verify information directly with the tool&apos;s official website before making any purchasing decision.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">No Professional Advice</h2>
          <p>Nothing on ListmyAI constitutes legal, financial, medical, or professional advice. Tool recommendations, reviews, and comparisons are for informational purposes only. Always consult qualified professionals before making decisions based on AI tools, especially in regulated industries.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Promo Codes & Deals</h2>
          <p>Promotional codes, discounts, and free trial offers listed on ListmyAI are provided by the respective tool vendors. We cannot guarantee their availability or validity at the time of use. Expired or invalid codes should be reported to us at <a href="mailto:listmyai@gmail.com" style={{ color: '#e94560' }} className="hover:underline">listmyai@gmail.com</a>.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">External Links</h2>
          <p>This platform contains links to external websites. These links are provided for convenience only. ListmyAI has no control over the content, privacy practices, or accuracy of external sites and accepts no responsibility for them.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Limitation of Liability</h2>
          <p>To the fullest extent permitted by applicable law, ListmyAI shall not be liable for any loss or damage, including without limitation, indirect or consequential loss or damage, arising from use of this platform or any tool discovered through it.</p>
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: '#1e2a3a', background: '#161b27' }}>
          <h2 className="mb-3 text-lg font-bold text-white">Copyright Concerns</h2>
          <p>If you believe any content on ListmyAI infringes your copyright or other intellectual property rights, please refer to our <Link href="/dmca" className="hover:underline" style={{ color: '#e94560' }}>DMCA & Takedown Policy</Link> for instructions on how to submit a formal request.</p>
        </section>

      </div>

      <div className="mt-10 flex gap-4 text-sm">
        <Link href="/terms" className="hover:underline" style={{ color: '#e94560' }}>Terms of Use</Link>
        <Link href="/privacy-policy" className="hover:underline" style={{ color: '#e94560' }}>Privacy Policy</Link>
        <Link href="/dmca" className="hover:underline" style={{ color: '#e94560' }}>DMCA / Takedown</Link>
      </div>
    </div>
  )
}
