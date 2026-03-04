/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "hsl(var(--color-primary-50, 199 89% 97%) / <alpha-value>)",
          100: "hsl(var(--color-primary-100, 199 89% 94%) / <alpha-value>)",
          200: "hsl(var(--color-primary-200, 199 89% 86%) / <alpha-value>)",
          300: "hsl(var(--color-primary-300, 199 89% 74%) / <alpha-value>)",
          400: "hsl(var(--color-primary-400, 199 89% 60%) / <alpha-value>)",
          500: "hsl(var(--color-primary-500, 199 89% 48%) / <alpha-value>)",
          600: "hsl(var(--color-primary-600, 199 89% 40%) / <alpha-value>)",
          700: "hsl(var(--color-primary-700, 199 84% 33%) / <alpha-value>)",
          800: "hsl(var(--color-primary-800, 199 77% 27%) / <alpha-value>)",
          900: "hsl(var(--color-primary-900, 199 69% 24%) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
