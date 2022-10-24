import preval from 'babel-plugin-preval/macro';

export const config = preval`
const resolveConfig = require('tailwindcss/resolveConfig');
const tailwindConfig = require('../../tailwind.config');
const fullConfig = resolveConfig(tailwindConfig);
const selectedConfigs = {
  theme: {
    screens: fullConfig.theme.screens
  }
};
module.exports = selectedConfigs;
`;
