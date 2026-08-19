const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const todoCache = require("../utils/lfuCache");

// ==========================================
// Load project-root .env
// ==========================================

dotenv.config({
  path: path.join(
    __dirname,
    "..",
    ".env"
  ),
});

// ==========================================
// Connect MongoDB Before Tests
// ==========================================

beforeAll(
  async () => {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined in project-root .env"
      );
    }

    // ----------------------------------------
    // Clear the in-memory LFU cache before
    // starting the test suite.
    // ----------------------------------------

    try {
      todoCache.clear();
    } catch (error) {
      // Cache cleanup must not prevent tests
      // from starting.
    }

    if (
      mongoose.connection.readyState ===
      0
    ) {
      await mongoose.connect(
        process.env.MONGO_URI,
        {
          serverSelectionTimeoutMS: 5000,
        }
      );
    }
  },
  15000
);

// ==========================================
// Clear LFU Cache Before Each Test
//
// This prevents one test's cached Todo data
// from affecting another test.
//
// The cache is intentionally in application
// memory, so it must be reset between tests.
// ==========================================

beforeEach(() => {
  try {
    todoCache.clear();
  } catch (error) {
    // Cache failure must never break tests.
  }
});

// ==========================================
// Close MongoDB After Tests
// ==========================================

afterAll(
  async () => {
    // ----------------------------------------
    // Clear cache before shutting down.
    // ----------------------------------------

    try {
      todoCache.clear();
    } catch (error) {
      // Ignore cache cleanup errors.
    }

    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }
  },
  15000
);