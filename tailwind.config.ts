import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red:    '#e94560',
          navy:   '#0f172a',
          dark:   '#0d1117',
          card:   '#161b27',
          border: '#1e2a3a',
          muted:  '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f172a 0%, #0d1b2e 50%, #0f172a 100%)',
        'card-gradient': 'linear-gradient(145deg, #161b27 0%, #0f172a 100%)',
        'red-glow':      'radial-gradient(ellipse at 50% 0%, rgba(233,69,96,0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease-out',
        'fade-in':   'fadeIn 0.3s ease-out',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { '0%': { opacity: '0' },                                '100%': { opacity: '1' } },
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(233,69,96,0.15)',
        'glow-red':   '0 0 24px rgba(233,69,96,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
