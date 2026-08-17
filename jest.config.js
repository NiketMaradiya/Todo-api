module.exports = {
  testEnvironment: "node",

  rootDir: ".",

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js",
  ],

  testMatch: [
    "<rootDir>/tests/**/*.test.js",
  ],

  clearMocks: true,

  verbose: true,
};