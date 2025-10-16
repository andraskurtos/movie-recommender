/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        'marquee-bounce': {
          '0%, 10%, 90%, 100%': { transform: 'translateX(0)' },
          '45%, 55%': { transform: 'translateX(calc(-100% + 14rem))' }
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
        'marquee-bounce': 'marquee-bounce 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slideDown': 'slideDown 0.2s ease-out'
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
}

