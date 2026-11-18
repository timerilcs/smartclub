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
        sable: { DEFAULT: "#fbf7f0", 2: "#f3ecdf" },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
      boxShadow: { carte: "0 1px 0 #13213c, 0 0 0 1.5px #13213c", douce: "0 18px 40px -18px rgba(19,33,60,.35)" },
    },
  },
  plugins: [],
};
