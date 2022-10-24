const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/**/*.module.scss', './public/index.html'],
  theme: {
    extend: {
      colors: {
        grey: {
          100: '#F8F8F8',
          300: '#D5D5D5',
          500: '#959595',
          700: '#575757',
          900: '#2D2D2D'
        },
        prime: {
          100: '#EAE6FF',
          300: '#CDC1FF',
          500: '#8D78F7',
          700: '#634CD9',
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
        }
      },
      backgroundImage: {
        home1: 'linear-gradient(0deg, #F4F1FD 0%, #FDFDFF 100%)',
        home2: 'linear-gradient(90deg, #F8F7FF 26.08%, #F7F5FE 98.41%)',
        swap: 'linear-gradient(0deg, #F7F5FD 0%, #FDFDFF 100%)',
        'btn-gradient': 'linear-gradient(268.82deg, #CF9AFA -26.18%, #A192F3 3.15%, #7486F1 83.6%)',
        'select-border': 'linear-gradient(90deg, #D483FF 86.1%, #9747FF 95.98%, #6E6CCA 105.2%)'
      }
    },
    screens: {
      desktop: { max: '99999px'}, // desktop first
      laptop: { max: '1535px'},
      tablet: { max: '1279px' },
      mobile: { max: '767px' }
    },
    backgroundColor: theme => ({
      ...theme('colors'),
      secondary: '#FFFFFF',
      transparent: 'transparent',
    }),
    boxShadow: {
      none: 'none',
      main: '0px 4px 35px rgba(0, 0, 0, 0.05)',
      home: '-4px 8px 32px rgba(211, 207, 230, 0.4)'
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
