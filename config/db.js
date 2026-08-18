const mongoose = require("mongoose");

const User = require("../models/User");
const Todo = require("../models/Todo");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const TodoActivity = require("../models/TodoActivity");
const Activity = require("../models/Activity");

const models = [
  User,
  Todo,
  Comment,
  Notification,
  TodoActivity,
  Activity,
];

const ensureDatabaseIndexes = async () => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  await Promise.all(
    models.map((model) => model.createIndexes())
  );

  console.log("✅ MongoDB indexes verified");
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not defined in .env"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 5000,

        autoIndex:
          process.env.NODE_ENV !==
          "production",
      }
    );

    await ensureDatabaseIndexes();

    console.log(
      "✅ MongoDB Connected Successfully"
    );
  } catch (error) {
    console.error(
      "❌ MongoDB Connection Failed"
    );

    console.error(
      error.message
    );

    // Important:
    // Do NOT call process.exit() here.
    // Jest needs to receive the connection error.
    throw error;
  }
};

module.exports =
  connectDB;