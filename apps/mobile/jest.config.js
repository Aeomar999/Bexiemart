const path = require("path");

module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.js"],
  transform: {
    "\\.[jt]sx?$": ["babel-jest", { configFile: path.resolve(__dirname, "babel.config.test.js") }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/react-native|native-base|react-native-svg|react-native-reanimated)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/android/",
    "/ios/",
    "test-utils\\.ts$",
    "babel\\.config\\.test\\.js$",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@expo/vector-icons$": "<rootDir>/__mocks__/@expo/vector-icons.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.{ts,tsx}",
    "!src/types/**",
  ],
  coverageThreshold: {
    global: {
      lines: 30,
      branches: 25,
      statements: 30,
    },
  },
};
