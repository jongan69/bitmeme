// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add polyfill resolvers
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    crypto: require.resolve('expo-crypto'),
  };

  // Add SVG support
  const { transformer, resolver } = config;
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    extraNodeModules: config.resolver.extraNodeModules,
  };

  return config;
})();