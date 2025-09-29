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
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        waemma: {
          primary: '#8B4513', // SaddleBrown - main brand color from images
          secondary: '#A0522D', // Sienna - secondary color
          accent: '#CD853F', // Peru - accent color
          dark: '#654321', // Dark brown - dark variant
          light: '#DEB887', // BurlyWood - light variant
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}