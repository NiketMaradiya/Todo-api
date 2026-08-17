const mongoose = require("mongoose");

// ==========================================
// Todo Activity Schema
// ==========================================

const todoActivitySchema = new mongoose.Schema(
  {
    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Todo",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "created",
        "updated",
        "assigned",
        "reassigned",
        "status_changed",
        "priority_changed",
        "comment_added",
        "soft_deleted",
        "restored",
        "attachment_added",
      ],
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// ==========================================
// Index
//
// Get activities for a Todo
// newest first
// ==========================================

todoActivitySchema.index({
  todoId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "TodoActivity",
  todoActivitySchema
);