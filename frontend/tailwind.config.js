/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A0F1E',
          800: '#0F2744',
          700: '#1E3A5F',
          600: '#1A56DB',
        },
        teal: {
          500: '#0E9F6E',
        },
        surface: {
          light: '#F8FAFC',
          dark:  '#0A0F1E',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card:   '12px',
        modal:  '16px',
        button: '8px',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        modal:      '0 20px 60px rgba(0,0,0,0.3)',
        toast:      '0 4px 16px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        shimmer:      'shimmer 1.5s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
      },
    },
  },
  plugins: [],
}