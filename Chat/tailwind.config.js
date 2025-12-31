/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./gamer/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        lira: {
          bg: "var(--lira-bg)",
          card: "var(--lira-card)",
          border: "var(--lira-border)",
          pink: "var(--lira-primary)",
          blue: "var(--lira-secondary)",
          purple: "var(--lira-accent)",
          dim: "var(--lira-dim)",
          surface: "var(--lira-surface)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-blue": "0 0 30px -10px rgba(var(--lira-secondary-rgb), 0.15)",
        "glow-pink": "0 0 30px -10px rgba(var(--lira-primary-rgb), 0.15)",
        premium: "0 20px 40px -10px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "lira-gradient":
          "linear-gradient(135deg, rgba(var(--lira-primary-rgb),0.05) 0%, rgba(var(--lira-secondary-rgb),0.05) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
}
