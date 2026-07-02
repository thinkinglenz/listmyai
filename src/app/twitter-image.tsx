import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ListmyAI — Find the Best AI Tools, Deals & Promo Codes'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #0d1b2e 50%, #0f172a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(233,69,96,0.25) 0%, transparent 70%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#e94560',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: 900,
            }}
          >
            AI
          </div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'white' }}>
            List<span style={{ color: '#e94560' }}>my</span>AI
          </div>
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Find the Best AI Tools, Deals & Promo Codes
        </div>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
            padding: '16px 40px',
            borderRadius: '16px',
            border: '1px solid rgba(233,69,96,0.2)',
            background: 'rgba(233,69,96,0.05)',
          }}
        >
          {[
            { num: '19,000+', label: 'AI Tools' },
            { num: '20+', label: 'Categories' },
            { num: 'Free', label: 'To Browse' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#e94560' }}>{stat.num}</div>
              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '32px', fontSize: '18px', color: '#475569' }}>
          listmyai.com
        </div>
      </div>
    ),
    { ...size }
  )
}
