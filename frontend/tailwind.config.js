/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        'dynamic-marquee': {
          '0%, 10%, 90%, 100%': { transform: 'translateX(0)' },
          '45%, 55%': { transform: 'var(--marquee-transform)' }
        },
        'slideDown': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-10px)' 
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)' 
          }
        }
      },
      animation: {
        'dynamic-marquee': 'dynamic-marquee',
        'slideDown': 'slideDown 0.2s ease-out'
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    require('@tailwindcss/line-clamp'),
  ],
}

