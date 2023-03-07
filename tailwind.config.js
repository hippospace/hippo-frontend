const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/**/*.module.scss', './public/index.html'],
  theme: {
    extend: {
      colors: {
        grey: {
          100: 'rgb(var(--hip-text-grey-100) / <alpha-value>)',
          300: 'rgb(var(--hip-text-grey-300) / <alpha-value>)',
          500: 'rgb(var(--hip-text-grey-500) / <alpha-value>)',
          700: 'rgb(var(--hip-text-grey-700) / <alpha-value>)',
          900: 'rgb(var(--hip-text-grey-900) / <alpha-value>)'
        },
        prime: {
          100: '#EAE6FF',
          300: '#CDC1FF',
          400: '#B7A6FF',
          500: '#8D78F7',
          700: '#634CD9',
          800: '#4532A6',
          900: '#2F2273'
        },
        success: {
          500: '#82CB7C'
        },
        error: {
          500: '#EB6A5D'
        },
        info: {
          500: '#5B6CFE'
        },
        warn: {
          500: '#FFA24E'
        },
        up: '#29C995',
        down: '#E96A5C'
      },
      backgroundImage: {
        primeLight: 'linear-gradient(0deg, #F7F5FD 0%, #FDFDFF 100%)',
        homeCard: 'var(--hip-bg-home-card)',
        'btn-gradient': 'var(--hip-bg-btn-gradient)',
        'select-border': 'var(--hip-bg-select-border)'
      },
    },
    screens: {
      desktop: { max: '99999px'}, // desktop first
      laptop: { max: '1535px'},
      tablet: { max: '1279px' },
      mobile: { max: '767px' }
    },
    backgroundColor: theme => ({
      ...theme('colors'),
      primeDark: '#111111',
      surface: 'rgb(var(--hip-bg-color-surface) / <alpha-value>)',
      field: 'rgb(var(--hip-bg-color-field) / <alpha-value>)',
      label: 'var(--hip-bg-label)',
      transparent: 'transparent',
    }),
    boxShadow: {
      none: 'none',
      main: '0px 4px 35px rgba(0, 0, 0, 0.05)',
      subTitle: '0px 4px 35px rgba(0, 0, 0, 0.1)',
      home: 'var(--hip-shadow-home)'
    },
    borderRadius: {
      none: '0',
      DEFAULT: '4px',
      lg: '8px',
      xl: '10px',
      xxl: '20px',
      full: '9999px'
    },
    fontFamily: {
      Urbanist: ['Urbanist', 'sans-serif']
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none'
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none'
        },
        '.text-gradient-primary': {
          background: 'linear-gradient(90.74deg, #5687F8 -17.79%, #7743E6 120.43%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        },
        '.text-gradient-secondary': {
          background: 'linear-gradient(273.38deg, #8032FF 19.81%, #472394 87.9%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent'
        }
      });
    }),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio')
  ],
  future: {
    hoverOnlyWhenSupported: true,
  }
};
