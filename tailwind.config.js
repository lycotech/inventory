/** @type {import('tailwindcss').Config} */
module.exports = {
  // Not strictly required in Tailwind v4 with @tailwindcss/postcss,
  // but kept to help IDEs and ensure full coverage.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};