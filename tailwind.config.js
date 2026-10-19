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
        carbon: {
          950: "#08080b",
          900: "#0e0e13",
          850: "#14141b",
          800: "#1b1b24",
          700: "#26262f",
        },
        rosso: {
          DEFAULT: "#e10600",
          deep: "#a60400",
          glow: "#ff2e2e",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "monospace"],
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        flash: "flash 0.6s ease-out",
        marquee: "marquee 28s linear infinite",
        speedline: "speedline 1.1s linear infinite",
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
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        speedline: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
    },
  },
  plugins: [],
}
