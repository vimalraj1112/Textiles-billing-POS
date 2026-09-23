export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e3',
          300: '#b0b8ca',
          400: '#8593ad',
          500: '#667694',
          600: '#525f7b',
          700: '#434d64',
          800: '#3a4255',
          900: '#343a49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};