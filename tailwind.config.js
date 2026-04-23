/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#004D4D', // Deep Teal
          50: '#E6F2F2',
          100: '#CCE6E6',
          200: '#99CCCC',
          300: '#66B3B3',
          400: '#339999',
          500: '#006666',
          600: '#005555',
          700: '#004444',
          800: '#003333',
          900: '#002626',
        },
        secondary: {
          DEFAULT: '#6B21A8', // Purple
          50: '#F5EDFC',
          500: '#6B21A8',
        },
        accent: {
          DEFAULT: '#F59E0B', // Gold/Orange
          50: '#FEF3C7',
          100: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
        },
        background: '#F0FDFA', // Light mint
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
