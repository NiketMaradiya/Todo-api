module.exports = {
  testEnvironment: "node",

  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  testTimeout: 15000,

  clearMocks: true,

  forceExit: true,
};