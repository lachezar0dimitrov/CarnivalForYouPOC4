/** @type {import('tailwindcss').Config} */

// Theme colors below (ink/gold/moss) resolve through CSS custom properties
// instead of literal hex, so the Christmas light theme (`.app-shell[data-theme="christmas"]`
// in src/index.css) can re-theme every existing utility class — including
// arbitrary opacity modifiers like `bg-ink-900/75` — without touching each
// component. See src/index.css for the dark (default) and Christmas values.
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${varName}))`
      : `rgb(var(${varName}) / ${opacityValue})`;
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: withOpacity('--ink-900'),
          800: withOpacity('--ink-800'),
          700: withOpacity('--ink-700'),
          600: withOpacity('--ink-600'),
          500: withOpacity('--ink-500'),
          400: withOpacity('--ink-400'),
        },
        gold: {
          50: withOpacity('--gold-50'),
          100: withOpacity('--gold-100'),
          200: withOpacity('--gold-200'),
          300: withOpacity('--gold-300'),
          400: withOpacity('--gold-400'),
          500: withOpacity('--gold-500'),
          600: withOpacity('--gold-600'),
          700: withOpacity('--gold-700'),
        },
        ember: {
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
        },
        moss: {
          400: withOpacity('--moss-400'),
          500: withOpacity('--moss-500'),
          600: withOpacity('--moss-600'),
          700: withOpacity('--moss-700'),
        },
        success: '#3fa66a',
        warning: '#e7c44d',
        error: '#c2410c',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(212,175,55,0.35)',
        'glow-sm': '0 0 12px rgba(212,175,55,0.28)',
        'glow-lg': '0 0 60px rgba(212,175,55,0.25)',
        card: '0 8px 40px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'gold-grad': 'linear-gradient(135deg, #f7e9b8 0%, #d4af37 45%, #9a7c20 100%)',
        'mystical-radial':
          'radial-gradient(ellipse at top, rgba(217,119,6,0.12) 0%, rgba(212,175,55,0.06) 35%, rgba(7,11,9,0) 65%)',
      },
      keyframes: {
        floatY: {
          '0%,100%': { transform: 'translateY(0) translateX(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(-30px) translateX(10px)', opacity: '1' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.15' },
          '50%': { opacity: '0.9' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 12px rgba(212,175,55,0.25)' },
          '50%': { boxShadow: '0 0 28px rgba(212,175,55,0.55)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        driftSlow: {
          '0%': { transform: 'translate(0,0)' },
          '100%': { transform: 'translate(40px,-60px)' },
        },
      },
      animation: {
        floatY: 'floatY 9s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        glowPulse: 'glowPulse 3.5s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
