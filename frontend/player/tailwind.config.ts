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
          primary: "var(--brand-primary, #0066FF)",
          "primary-hover": "var(--brand-primary-hover, #0052CC)",
          secondary: "var(--brand-secondary, #1A1A2E)",
          accent: "var(--brand-accent, #00C853)",
          "accent-hover": "var(--brand-accent-hover, #00A844)",
          surface: "var(--brand-surface, #FFFFFF)",
          "surface-alt": "var(--brand-surface-alt, #F5F5F7)",
          background: "var(--brand-background, #FFFFFF)",
          text: "var(--brand-text, #1A1A2E)",
          "text-muted": "var(--brand-text-muted, #4A4A68)",
          border: "var(--brand-border, #E8E8ED)",
          success: "var(--brand-success, #34C759)",
          danger: "var(--brand-danger, #FF3B30)",
          warning: "var(--brand-warning, #FF9500)",
          "blue-bar": "var(--brand-blue-bar, #5b8fd4)",
          "blue-bar-light": "var(--brand-blue-bar-light, #7ba8e0)",
          "rg-badge": "var(--brand-rg-badge, #3bb78f)",
        },
      },
      fontFamily: {
        heading: "var(--font-heading, 'Inter', system-ui, sans-serif)",
        body: "var(--font-body, 'Inter', system-ui, sans-serif)",
      },
      borderRadius: {
        pill: "9999px",
      },
      keyframes: {
        "odds-up": {
          "0%": { backgroundColor: "rgba(52, 199, 89, 0.2)" },
          "100%": { backgroundColor: "transparent" },
        },
        "odds-down": {
          "0%": { backgroundColor: "rgba(255, 59, 48, 0.2)" },
          "100%": { backgroundColor: "transparent" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "odds-up": "odds-up 1.5s ease-out",
        "odds-down": "odds-down 1.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        nav: "0 1px 3px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
