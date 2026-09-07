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
          orange: '#f97316',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          dark: '#0f172a',
          card: '#1e293b',
          surface: '#111827',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', '"Space Grotesk"', 'sans-serif'],
        outfit: ['"Outfit"', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
        urbanist: ['"Urbanist"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'culinary-glow': '0 0 30px -5px rgba(249, 115, 22, 0.18)',
        'card-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px rgba(249, 115, 22, 0.12)',
        'timer-glow': '0 0 40px -5px rgba(249, 115, 22, 0.35)',
      },
      animation: {
        'bounce-short': 'bounce 0.6s ease-in-out 2',
        'spin-fast': 'spin 0.4s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-urgent': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
