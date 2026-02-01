/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
          light: '#a78bfa',
        },
        secondary: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#0f0f0f',
        },
        surface: {
          DEFAULT: '#f8fafc',
          dark: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}
