const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

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

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not defined in project-root .env"
    );
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
}, 15000);

// ==========================================
// Close MongoDB After Tests
// ==========================================

afterAll(async () => {
  if (
    mongoose.connection.readyState !==
    0
  ) {
    await mongoose.connection.close();
  }
}, 15000);