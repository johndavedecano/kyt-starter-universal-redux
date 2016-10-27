
// Base kyt config.
// Edit these properties to make changes.

const webpack = require('webpack');
const WebpackMd5Hash = require('webpack-md5-hash');

module.exports = {
  reactHotLoader: true,
  debug: false,
  modifyWebpackConfig: (baseConfig, options) => {
    const appConfig = Object.assign({}, baseConfig);
    const babelLoader = appConfig.module.rules.find(loader => loader.loader === 'babel-loader');
    babelLoader.options.plugins.push(
        'babel-plugin-transform-class-properties',
        'babel-plugin-transform-object-rest-spread');

    // Production-only babel plugins
    if (options.environment === 'production') {
      // warning: https://github.com/babel/babel/issues/3728
      babelLoader.options.plugins.push('babel-plugin-transform-react-inline-elements');
    }

    // add babel-polyfill entry for client only
    if (options.type === 'client') {
      appConfig.entry.main.unshift('babel-polyfill');
    }

    // Create vendor bundle based on package.dependencies
    if (options.type === 'client' && options.environment === 'production') {
      appConfig.plugins.push(
        // Extract all 3rd party modules into a separate chunk
        // Only include vendor modules as needed,
        // https://github.com/webpack/webpack/issues/2372#issuecomment-213149173
        new webpack.optimize.CommonsChunkPlugin({
          name: '0_vendor',
          minChunks: ({ resource }) => /node_modules/.test(resource),
        }),

        // Generate a 'manifest' chunk to be inlined
        new webpack.optimize.CommonsChunkPlugin('manifest'),

        // Need this plugin for deterministic hashing
        // until this issue is resolved: https://github.com/webpack/webpack/issues/1315
        // for more info: https://webpack.js.org/how-to/cache/
        new WebpackMd5Hash(),

        // Merge bundles that would otherwise be negligibly small
        new webpack.optimize.AggressiveMergingPlugin()
      );
    }

    return appConfig;
  },
};
