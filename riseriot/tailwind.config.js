/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0d091a',
          ink: '#faf8ff',
          muted: '#bda6d8',
          lilac: '#d6b7ff',
          purple: '#9b61ff',
          orchid: '#a969ff',
          violet: '#b879ff',
          card: '#211a3a',
          panel: '#171129',
          nav: '#100b20',
          border: '#6d4a9c',
        },
      },
    },
  },
  plugins: [],
}
