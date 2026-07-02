import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 38,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow effect */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: 30,
            width: 120,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(233,69,96,0.15)',
          }}
        />
        {/* AI text */}
        <span
          style={{
            fontSize: 90,
            fontWeight: 900,
            color: '#e94560',
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          AI
        </span>
        {/* Small sparkle */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 28,
            width: 14,
            height: 14,
            background: '#e94560',
            borderRadius: 2,
            transform: 'rotate(45deg)',
            opacity: 0.8,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
