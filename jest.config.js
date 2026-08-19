module.exports = {
  testEnvironment: "node",

  rootDir: ".",

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js",
  ],

  testMatch: [
    "<rootDir>/tests/**/*.test.js",
  ],

  testTimeout: 30000,

  clearMocks: true,

  verbose: true,
};