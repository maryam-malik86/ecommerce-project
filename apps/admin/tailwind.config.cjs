const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Medusa-inspired palette
        ui: {
          bg: {
            base:       'var(--ui-bg-base)',
            subtle:     'var(--ui-bg-subtle)',
            component:  'var(--ui-bg-component)',
            overlay:    'var(--ui-bg-overlay)',
            hover:      'var(--ui-bg-hover)',
          },
          border: {
            base:   'var(--ui-border-base)',
            strong: 'var(--ui-border-strong)',
            error:  'var(--ui-border-error)',
          },
          fg: {
            base:     'var(--ui-fg-base)',
            subtle:   'var(--ui-fg-subtle)',
            muted:    'var(--ui-fg-muted)',
            disabled: 'var(--ui-fg-disabled)',
            error:    'var(--ui-fg-error)',
            onColor:  'var(--ui-fg-on-color)',
          },
          tag: {
            neutral:  'var(--ui-tag-neutral-bg)',
            green:    'var(--ui-tag-green-bg)',
            orange:   'var(--ui-tag-orange-bg)',
            red:      'var(--ui-tag-red-bg)',
            blue:     'var(--ui-tag-blue-bg)',
            purple:   'var(--ui-tag-purple-bg)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        'ui': '0.5rem',
        'ui-sm': '0.375rem',
      },
      boxShadow: {
        'ui-card': '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'ui-modal': '0 25px 50px -12px rgba(0,0,0,0.25)',
        'ui-focus': '0 0 0 3px rgba(124,58,237,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
