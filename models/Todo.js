const mongoose = require("mongoose");

const todoSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
      },

      assignedTo: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      attachmentUrl: {
        type: String,
        default: null,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "in-progress",
          "completed",
        ],
        default: "pending",
      },

      // Soft Delete Fields
      isDeleted: {
        type: Boolean,
        default: false,
      },

      deletedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Todo",
    todoSchema
  );