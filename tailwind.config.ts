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
        // Earthed master palette (locked)
        plum: {
          DEFAULT: "#513963",
          dark: "#3A2847",
          light: "#6E5883",
        },
        violet: {
          DEFAULT: "#9303C5",
          dark: "#6B0291",
          light: "#B33AE0",
        },
        void: {
          DEFAULT: "#0A0511",
          soft: "#15091F",
          elevated: "#1E122A",
        },
        cream: "#F5F1E8",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(147, 3, 197, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(147, 3, 197, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
