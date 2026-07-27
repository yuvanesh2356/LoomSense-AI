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
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "0 0" },
        },
        fadeSlideUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-slide-up": "fadeSlideUp 0.3s ease-out",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,30,20,0.04), 0 4px 16px rgba(20,30,20,0.06)",
        "card-hover": "0 2px 6px rgba(20,30,20,0.06), 0 10px 28px rgba(20,30,20,0.10)",
      },
    },
  },
  plugins: [],
};
