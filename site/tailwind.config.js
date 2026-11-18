/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        encre: { DEFAULT: "#13213c", 2: "#1d3157" },
        lagon: { DEFAULT: "#0fa3a3", clair: "#d9f3f1", fonce: "#0b7a7a" },
        corail: { DEFAULT: "#ff6b4a", clair: "#ffe6df" },
        soleil: { DEFAULT: "#ffc23d", clair: "#fff3d1" },
        sable: { DEFAULT: "#faf8f4", 2: "#f1ede6" },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        hand: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: { carte: "none", douce: "none" },
    },
  },
  plugins: [],
};
