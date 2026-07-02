import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: 4,
            width: 24,
            height: 20,
            borderRadius: '50%',
            background: 'rgba(233,69,96,0.2)',
          }}
        />
        {/* AI text */}
        <span
          style={{
            fontSize: 17,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #e94560, #f87171)',
            backgroundClip: 'text',
            color: '#e94560',
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          AI
        </span>
      </div>
    ),
    { ...size }
  )
}
