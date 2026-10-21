/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FFFDF8',
        cream: '#FFF9ED',
        blush: '#F9E7F0',
        petal: '#FCEFF6',
        rose: '#E9A6C5',
        'rose-deep': '#D77FA9',
        burgundy: '#8D1528',
        'burgundy-dark': '#6B0F1E',
        ink: '#352A28',
        muted: '#8A7A73',
        gold: '#C9A24B',
        'gold-light': '#EFD79A',
        line: '#F0E2DA',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -18px rgba(93, 42, 38, 0.25)',
        card: '0 2px 14px -6px rgba(93, 42, 38, 0.12)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        floatIn: 'floatIn .35s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
