/** @type {import('tailwindcss').Config} */
import primeui from 'tailwindcss-primeui'
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},

    screens: {
      mb: { max: '639px' },
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [primeui],
}
