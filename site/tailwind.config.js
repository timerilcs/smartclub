/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charte SmartClub : bleu marine du logo + jaune soleil
        encre: { DEFAULT: "#0a2350", 2: "#143a7d" },
        lagon: { DEFAULT: "#1f6bff", clair: "#e3edff", fonce: "#0f4fd6" }, // bleu vif
        corail: { DEFAULT: "#ffb400", clair: "#fff1c7" },                  // jaune logo
        soleil: { DEFAULT: "#ffc21a", clair: "#fff4cc" },
        sable: { DEFAULT: "#fffdf6", 2: "#fff4d6" },
      },
      fontFamily: {
        display: ['"Fredoka"', "system-ui", "sans-serif"],
        sans: ['"Nunito"', "system-ui", "sans-serif"],
        hand: ['"Fredoka"', "system-ui", "sans-serif"],
      },
      boxShadow: { carte: "0 10px 30px -12px rgba(10,35,80,.18)", douce: "0 6px 20px -10px rgba(10,35,80,.2)" },
    },
  },
  plugins: [],
};
