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
      primary: '#F6F8FA',
      secondary: '#FFFFFF',
      prime: '#2D2D2D',
      primeBlack: 'rgba(45, 45, 45, 0.03)',
      primeBlack50: 'rgba(45, 45, 45, 0.5)',
      primeBlack20: 'rgba(45, 45, 45, 0.2)',
      primeBlack80: 'rgba(45, 45, 45, 0.8)',
      input: '#F8F8F8',
      transparent: 'transparent',
      primaryGrey: 'rgba(248, 248, 248, 0.8)',
      selected: '#F2F1FE'
    }),
    boxShadow: {
      none: 'none',
      sm: '4px 4px 0px #2D2D2D',
      md: '0px 4px 8px rgba(0, 0, 0, 0.25)',
      figma: '8px 8px 0px #2D2D2D',
      main1: '0px 4px 35px rgba(0, 0, 0, 0.05)',
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
