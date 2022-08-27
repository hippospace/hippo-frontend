const webpack = require('webpack');

module.exports = {
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
      // config.cache.buildDependencies.mydeps = ['./webpackBuildCache.lock'];

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
