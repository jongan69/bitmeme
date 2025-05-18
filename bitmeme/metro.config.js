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
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer/'),
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
