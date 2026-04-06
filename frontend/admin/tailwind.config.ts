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
        sidebar: {
          DEFAULT: "#1e293b",
          hover: "#334155",
          active: "#0f172a",
        },
        accent: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          light: "#dbeafe",
        },
      },
    },
  },
  plugins: [],
};

export default config;
