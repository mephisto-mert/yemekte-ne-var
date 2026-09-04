/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        culinary: {
          orange: '#f98006',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          dark: '#0f172a',
          card: '#1e293b',
        }
      },
      animation: {
        'bounce-short': 'bounce 0.6s ease-in-out 2',
        'spin-fast': 'spin 0.4s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
