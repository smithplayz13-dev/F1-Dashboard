/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        f1: {
          bg: "#0a0a0b",
          panel: "#141417",
          panel2: "#1a1a1e",
          border: "#2a2a2f",
          muted: "#6b7280",
          accent: "#e10600",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "monospace"],
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        flash: "flash 0.6s ease-out",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        flash: {
          "0%": { backgroundColor: "rgba(225,6,0,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
    },
  },
  plugins: [],
}
