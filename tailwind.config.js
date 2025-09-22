/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#F55393',
          DEFAULT: '#D83A7A',
          dark: '#B72B63',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
