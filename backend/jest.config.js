module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "utils/**/*.js",
    "!**/*.test.js",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 15,
      statements: 15,
    },
  },
  testMatch: ["**/__tests__/**/*.js", "**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
