/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,mdx,css}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f1f8ff",
          100: "#dbefff",
          200: "#b3dcff",
          300: "#80c2ff",
          400: "#4da6ff",
          500: "#1b8aff",
          600: "#006ddf",
          700: "#0051a8",
          800: "#003a78",
          900: "#00254d",
        },
      },
      boxShadow: {
        soft: "0 12px 32px -12px rgba(15, 23, 42, 0.25)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
