
// Base kyt config.
// Edit these properties to make changes.

module.exports = {
  reactHotLoader: true,
  debug: false,
  modifyWebpackConfig: (baseConfig, options) => {
    const appConfig = Object.assign({}, baseConfig);
    const babelLoader = appConfig.module.loaders.find(loader => loader.loader === 'babel-loader');
    babelLoader.query.plugins.push(
        'babel-plugin-transform-class-properties',
        'babel-plugin-transform-object-rest-spread');

    // add babel-polyfill entry for client only
    if (options.type === 'client') {
      appConfig.entry.main.unshift('babel-polyfill');
    }

    return appConfig;
  },
};
