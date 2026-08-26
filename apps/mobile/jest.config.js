const path = require("path");

module.exports = {
  preset: "jest-expo",
  testTimeout: 20000,
  setupFilesAfterEnv: ["./jest.setup.js"],
  transform: {
    "\\.(js|jsx|ts|tsx|mjs|cjs)$": [
      "babel-jest",
      { configFile: path.resolve(__dirname, "babel.config.test.js") },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|better-auth|@better-auth|better-call|jose|@noble|rou3|defu)",
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
  // Floor set ~5-6pts under measured actuals (65.5 stmts / 62.4 branches /
  // 66.2 lines as of 2026-08) so the gate catches real regressions without
  // blocking normal churn. This file is the single source of truth — CI no
  // longer overrides it inline.
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 55,
      functions: 55,
      lines: 60,
    },
  },
};
