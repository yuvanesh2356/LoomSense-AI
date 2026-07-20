/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: "#2B3A67",
        turmeric: "#E8A33D",
        madder: "#A63A50",
        cotton: "#FBF7F0",
        charcoal: "#2A2A2A",
        success: "#3E7C4A",
        warning: "#C98A1A",
        slate: "#5B6B7A",
      },
    },
  },
  plugins: [],
};
