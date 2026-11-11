/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FCFBF7',
          100: '#F7F3E8',
          200: '#EEE4C7',
          300: '#E2D19E',
          400: '#D4AF37', // Master Royal Gold
          500: '#C59B27',
          600: '#AA821C',
          700: '#8A6816',
          800: '#684E14',
          900: '#4D3A11',
        },
        royal: {
          dark: '#0A1128',
          slate: '#1C2541',
          teal: '#006466',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Playfair Display', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
        'gold-inner': 'inset 0 0 15px rgba(212, 175, 55, 0.15)',
        'luxury': '0 10px 30px -10px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.02)',
      }
    },
  },
  plugins: [],
}

