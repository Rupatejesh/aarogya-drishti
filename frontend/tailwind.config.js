/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Core Royal Blue
          700: '#1D4ED8', // Deep Royal Blue
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        accent: {
          yellow: '#FEF08A',
          warm: '#FACC15',
          gold: '#EAB308',
        },
        slate: {
          950: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'blue-glow': '0 0 20px rgba(37, 99, 235, 0.25)',
        'blue-card': '0 4px 20px -2px rgba(29, 78, 216, 0.08)',
        'luxury': '0 10px 30px -10px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.02)',
      }
    },
  },
  plugins: [],
}
