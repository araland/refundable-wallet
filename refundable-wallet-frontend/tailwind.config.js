/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "cover-pattern": "url('/assets/img/hero-bg.webp')",
      },
    },
  },
  plugins: [],
};
