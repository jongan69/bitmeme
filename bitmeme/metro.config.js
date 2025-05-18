// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("svg");
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);

// Polyfill resolvers (merge with any existing)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  crypto: require.resolve('expo-crypto'),
  Buffer: require.resolve('buffer/'),
  url: require.resolve('react-native-url-polyfill'),
  // http: require.resolve('stream-http'),
  // https: require.resolve('https-browserify'),
  // crypto: require.resolve('react-native-crypto'),
  // stream: require.resolve('stream-browserify'),
  // zlib: require.resolve('browserify-zlib'),
  // util: require.resolve('util/'),
  // assert: require.resolve('assert'),
};

config.transformer.babelTransformerPath = require.resolve(
  "./metro.transformer.js"
);

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
  },
});

module.exports = config;
