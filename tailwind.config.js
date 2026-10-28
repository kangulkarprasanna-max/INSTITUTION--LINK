/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef4fb',
          100: '#d7e5f4',
          200: '#b0cbe8',
          300: '#7ea9d8',
          400: '#4d83c4',
          500: '#2f63a8',
          600: '#244d88',
          700: '#1d3d6b',
          800: '#172f52',
          900: '#0f2140',
          950: '#081428',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 33, 64, 0.06), 0 4px 16px rgba(15, 33, 64, 0.06)',
        pop: '0 8px 30px rgba(15, 33, 64, 0.14)',
      },
    },
  },
  plugins: [],
};
