const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs"];

// Exclude test files from being bundled by Metro/Expo Router
config.resolver.blockList = [/.*\.test\.[tj]sx?$/, /.*\.spec\.[tj]sx?$/, /.*\/__tests__\/.*/];

// Prevent Metro from watching the entire monorepo, which causes EMFILE errors on Windows
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, { input: "./global.css" });
