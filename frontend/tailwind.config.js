/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07080A",
        bone: "#F4EDE4",
        taupe: "#8A8178",
        copper: "#C4783A",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
