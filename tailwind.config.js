/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041',
          900: '#04342C',
        },
        stone: {
          50:  '#F7F6F2',
          100: '#F0EEE8',
          200: '#E8E6E0',
          300: '#D3D1C7',
          400: '#B4B2A9',
          500: '#888780',
          600: '#5F5E5A',
          700: '#444441',
          900: '#2C2C2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '36px',
      },
    },
  },
  plugins: [],
}
