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
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          glow: 'rgba(37, 99, 235, 0.25)',
        },
        surface: {
          darker: '#0a0e17',
          dark: '#111726',
          card: '#182033',
          hover: '#202b44',
          border: '#243048',
          borderLight: '#324160',
          elevated: '#1e2942',
        }
      },
      fontFamily: {
        sans: ['Google Sans', 'Prompt', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
