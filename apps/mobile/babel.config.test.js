/** @file Babel config for Jest — excludes nativewind/babel to prevent
 *  _ReactNativeCSSInterop from breaking jest.mock() hoisting. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],
  };
};
