/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        // Emotion colors
        'emotion-confess': 'oklch(var(--emotion-confess) / <alpha-value>)',
        'emotion-broke': 'oklch(var(--emotion-broke) / <alpha-value>)',
        'emotion-happy': 'oklch(var(--emotion-happy) / <alpha-value>)',
        // Emotion mode tonal tokens
        'emotion-happy-bg': 'oklch(var(--emotion-happy-bg) / <alpha-value>)',
        'emotion-happy-text': 'oklch(var(--emotion-happy-text) / <alpha-value>)',
        'emotion-happy-accent': 'oklch(var(--emotion-happy-accent) / <alpha-value>)',
        'emotion-confess-bg': 'oklch(var(--emotion-confess-bg) / <alpha-value>)',
        'emotion-confess-text': 'oklch(var(--emotion-confess-text) / <alpha-value>)',
        'emotion-confess-accent': 'oklch(var(--emotion-confess-accent) / <alpha-value>)',
        'emotion-broke-bg': 'oklch(var(--emotion-broke-bg) / <alpha-value>)',
        'emotion-broke-text': 'oklch(var(--emotion-broke-text) / <alpha-value>)',
        'emotion-broke-accent': 'oklch(var(--emotion-broke-accent) / <alpha-value>)',
        // Status colors
        'status-grace': 'oklch(var(--status-grace) / <alpha-value>)',
        'status-active': 'oklch(var(--status-active) / <alpha-value>)',
        'status-expired': 'oklch(var(--status-expired) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'veil-sm': '0 1px 3px oklch(0.22 0.015 60 / 0.06)',
        'veil-md': '0 4px 12px oklch(0.22 0.015 60 / 0.08)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};
