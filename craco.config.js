const webpack = require('webpack');
const CracoLessPlugin = require('craco-less');

module.exports = {
  babel: {
    plugins: ['preval', 'macros']
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#8D78F7',
              '@link-color': '#8D78F7',
              '@success-color': '#82CB7C',
              '@warning-color': '#FFA24E',
              '@error-color': '#EB6A5D',
              '@font-size-base': '16px',
              '@border-radius-base': '10px'
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
  webpack: {
    configure: (config) => {
      const rules = config.module.rules
        .find((rule) => typeof rule.oneOf === 'object')
        .oneOf.filter((rule) => Array.isArray(rule.use));

      rules.forEach((rule) => {
        rule.use.forEach((moduleLoader) => {
          if (moduleLoader?.loader?.includes('resolve-url-loader'))
            moduleLoader.options.sourceMap = false;
        });
      });
      config.resolve = {
        ...config.resolve,
        fallback: {
          buffer: require.resolve('buffer'),
          stream: require.resolve("stream-browserify")
        }
      };

      // To disable webpack cache of node_modules when debug
      config.cache.buildDependencies.mydeps = ['./webpackBuildCache.lock'];

      return config;
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  }
};
