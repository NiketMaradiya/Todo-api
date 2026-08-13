const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

beforeAll(async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  /*
   * If MongoDB is already connected,
   * don't create another connection.
   */
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }
}, 15000);

afterAll(async () => {
  /*
   * Close MongoDB connection after all tests.
   */
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}, 15000);