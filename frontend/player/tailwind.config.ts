import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary, #d4a017)",
          "primary-hover": "var(--brand-primary-hover, #b8860b)",
          secondary: "var(--brand-secondary, #1a1a2e)",
          accent: "var(--brand-accent, #e6c200)",
          surface: "var(--brand-surface, #16213e)",
          "surface-alt": "var(--brand-surface-alt, #0f3460)",
          background: "var(--brand-background, #0a0a1a)",
          text: "var(--brand-text, #e0e0e0)",
          "text-muted": "var(--brand-text-muted, #8a8aa0)",
          success: "var(--brand-success, #00c853)",
          danger: "var(--brand-danger, #ff1744)",
          warning: "var(--brand-warning, #ff9100)",
        },
      },
      fontFamily: {
        heading: "var(--font-heading, 'Inter', sans-serif)",
        body: "var(--font-body, 'Inter', sans-serif)",
      },
      keyframes: {
        "odds-up": {
          "0%": { backgroundColor: "rgba(0, 200, 83, 0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        "odds-down": {
          "0%": { backgroundColor: "rgba(255, 23, 68, 0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "odds-up": "odds-up 1.5s ease-out",
        "odds-down": "odds-down 1.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
