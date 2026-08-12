const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [
        200,
        "Title cannot exceed 200 characters",
      ],
    },

    status: {
      type: String,
      enum: {
        values: [
          "todo",
          "inprogress",
          "complate",
        ],
        message:
          "Status must be todo, inprogress or complate",
      },
      default: "todo",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Todo",
  todoSchema
);