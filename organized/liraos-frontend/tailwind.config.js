/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        nagisa: {
          bg: "#fef9fb",        // fundo geral
          bgSoft: "#faeff9",    // barras, sidebar
          panel: "#ffffff",     // cartões e chat
          border: "#ead9ff",
          accent: "#f39ab4",    // botões primários
          accentSoft: "#ffe0ec",
          text: "#2b2238",      // texto principal
          textSoft: "#7c678f",  // texto secundário
        },
        nagisaDark: {
          bg: "#120f1a",
          bgSoft: "#191322",
          panel: "#21172d",
          border: "#3a264f",
          accent: "#f39ab4",
          accentSoft: "#8b4e73",
          text: "#f6edf9",
          textSoft: "#d3bfdc",
        },
      },
    },
  },
  plugins: [],
};
