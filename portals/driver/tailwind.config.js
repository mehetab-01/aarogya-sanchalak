// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    '../../shared/**/*.{js,jsx}',   // shared components
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          dark:    'var(--color-brand-dark)',
          light:   'var(--color-brand-light)',
        },
        critical: {
          DEFAULT: 'var(--color-critical)',
          light:   'var(--color-critical-light)',
        },
        serious: {
          DEFAULT: 'var(--color-serious)',
          light:   'var(--color-serious-light)',
        },
        stable: {
          DEFAULT: 'var(--color-stable)',
          light:   'var(--color-stable-light)',
        },
        bg: {
          primary:   'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          card:      'var(--color-bg-card)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
      },
      borderRadius: {
        card:   '10px',
        button: '8px',
        input:  '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
