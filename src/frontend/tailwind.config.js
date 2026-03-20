/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Emotion mode tonal tokens — muted, low-saturation
        "emotion-happy": {
          bg: "var(--emotion-happy-bg)",
          text: "var(--emotion-happy-text)",
          accent: "var(--emotion-happy-accent)",
        },
        "emotion-confess": {
          bg: "var(--emotion-confess-bg)",
          text: "var(--emotion-confess-text)",
          accent: "var(--emotion-confess-accent)",
        },
        "emotion-broke": {
          bg: "var(--emotion-broke-bg)",
          text: "var(--emotion-broke-text)",
          accent: "var(--emotion-broke-accent)",
        },
        // Status tokens — muted
        "status-grace": "var(--status-grace)",
        "status-active": "var(--status-active)",
        "status-expired": "var(--status-expired)",
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.75rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 2px 16px 0 rgba(60, 50, 40, 0.06), 0 1px 4px 0 rgba(60, 50, 40, 0.04)",
        "soft-md": "0 4px 24px 0 rgba(60, 50, 40, 0.07), 0 2px 8px 0 rgba(60, 50, 40, 0.04)",
        "soft-lg": "0 8px 40px 0 rgba(60, 50, 40, 0.08), 0 2px 12px 0 rgba(60, 50, 40, 0.04)",
        card: "0 2px 16px 0 rgba(60, 50, 40, 0.06), 0 1px 4px 0 rgba(60, 50, 40, 0.04)",
      },
      transitionDuration: {
        DEFAULT: "250ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
