const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/**/*.module.scss', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#2D2D2D',
        primeBlack: 'rgba(45, 45, 45, 0.03)',
        primeBlack20: 'rgba(45, 45, 45, 0.2)',
        primeBlack50: 'rgba(45, 45, 45, 0.5)',
        primeBlack80: 'rgba(45, 45, 45, 0.8)',
        grey: {
          100: '#F8F8F8',
          300: '#D5D5D5',
          500: '#959595',
          700: '#575757',
          900: '#2D2D2D'
        },
        primePurple: {
          100: '#F1EFFE',
          300: '#B3A6FE',
          900: '#414082'
        }
      },
      backgroundImage: {
        'home-icons': 'url(resources/img/home/home-icons.png)',
        home1: 'radial-gradient(88.17% 88.17% at 87.73% 7.97%, rgba(110, 108, 202, 0.17) 0%, rgba(151, 71, 255, 0) 63.69%, rgba(151, 71, 255, 0) 100%)',
        swap: 'linear-gradient(0deg, #F7F5FD 0%, #FDFDFF 100%)',
        btn1: 'linear-gradient(268.82deg, #CF9AFA -26.18%, #A192F3 3.15%, #7486F1 83.6%)',
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
      primary: '#F6F8FA',
      secondary: '#FFFFFF',
      prime: '#2D2D2D',
      primeBlack: 'rgba(45, 45, 45, 0.03)',
      primeBlack50: 'rgba(45, 45, 45, 0.5)',
      primeBlack20: 'rgba(45, 45, 45, 0.2)',
      primeBlack80: 'rgba(45, 45, 45, 0.8)',
      input: '#F8F8F8',
      transparent: 'transparent',
      grey: {
        100: '#F8F8F8',
        300: '#D5D5D5',
        500: '#959595',
        700: '#575757',
        900: '#2D2D2D'
      },
      primePurple: {
        100: '#F1EFFE',
        300: '#B3A6FE',
        900: '#414082'
      },
      primaryGrey: 'rgba(248, 248, 248, 0.8)',
    }),
    boxShadow: {
      sm: '4px 4px 0px #2D2D2D',
      md: '0px 4px 8px rgba(0, 0, 0, 0.25)',
      figma: '8px 8px 0px #2D2D2D',
      swap: '0px 4px 35px rgba(0, 0, 0, 0.05)'
    },
    borderRadius: {
      none: '0',
      lg: '8px',
      xl: '10px',
      xxl: '20px',
      full: '9999px'
    },
    fontFamily: {
      Urbanist: 'Urbanist, sans-serif'
    },
    fontSize: {
      sm: [
        '13px',
        {
          lineHeight: '16px'
        }
      ],
      base: [
        '16px',
        {
          lineHeight: '19px'
        }
      ],
      lg: [
        '18px',
        {
          lineHeight: '22px'
        }
      ],
      xl: [
        '20px',
        {
          lineHeight: '24px'
        }
      ],
      '2xl': [
        '24px',
        {
          lineHeight: '29px'
        }
      ]
    }
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
        }
      });
    }),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio')
  ]
};
