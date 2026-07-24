/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy palette — still used by the existing Dashboard/Forecast/
        // Income pages until their own redesign phase. Left untouched.
        indigo: "#2B3A67",
        turmeric: "#E8A33D",
        madder: "#A63A50",
        cotton: "#FBF7F0",
        charcoal: "#2A2A2A",
        success: "#3E7C4A",
        warning: "#C98A1A",
        slate: "#5B6B7A",

        // New brand palette (Phase 1 rebrand)
        "emerald-deep": "#0B4F3C",
        "emerald-bright": "#1C7A5A",
        gold: "#C9A24B",
        ivory: "#FBF8F1",
        "warm-white": "#FFFFFF",
        "dark-green": "#06251C",
        "charcoal-text": "#22281F",
      },
      fontFamily: {
        display: ["Fraunces", "Cambria", "Georgia", "serif"],
        sans: ["Inter", "Calibri", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
