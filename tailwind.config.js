/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'base': '#121212',
        'surface': '#1C1C1E',
        'surface-alt': '#2A2A2C',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9A9A9E',
        'accent-green': '#16a34a',
        'accent-purple': '#16a34a',
        'accent-orange': '#F4511E',
        'accent-red': '#E5484D',
      },
      fontSize: {
        'display':       ['36px', { lineHeight: '40px', fontWeight: '700' }],
        'hero-amount':    ['30px', { lineHeight: '36px', fontWeight: '800' }],
        'card-amount':    ['24px', { lineHeight: '30px', fontWeight: '700' }],
        'screen-title':   ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'section-header': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'row-title':      ['15px', { lineHeight: '22px', fontWeight: '500' }],
        'row-amount':     ['15px', { lineHeight: '22px', fontWeight: '600' }],
        'body':           ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label':          ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'caption':        ['11px', { lineHeight: '16px', fontWeight: '400' }],
        'tag':            ['11px', { lineHeight: '14px', fontWeight: '600' }],
        'button':         ['14px', { lineHeight: '20px', fontWeight: '600' }],
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
