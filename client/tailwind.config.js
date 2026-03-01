/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f766e',
        secondary: '#0ea5e9',
        danger: '#dc2626'
      }
    }
  },
  plugins: []
};
