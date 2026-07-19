import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  // Limit memory usage & concurrency for CI/CD stability
  maxWorkers: process.env.CI ? 2 : "50%",
  workerIdleMemoryLimit: "512MB",
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 50,
      statements: 60,
    },
  },
};

export default config;
