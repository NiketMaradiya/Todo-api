const mongoose = require("mongoose");

// Activity.js is kept as a compatibility model.
//
// The actual TodoActivity model is defined in:
// models/TodoActivity.js
//
// Both files must NOT register the same model name independently.

const activitySchema = new mongoose.Schema(
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
// Database Indexes
// ==========================================

activitySchema.index({
  todoId: 1,
  createdAt: -1,
});

activitySchema.index({
  userId: 1,
  createdAt: -1,
});

// ==========================================
// IMPORTANT
//
// Reuse the existing TodoActivity model if
// it has already been registered.
//
// Otherwise create it.
//
// This prevents:
//
// OverwriteModelError:
// Cannot overwrite `TodoActivity` model once compiled
// ==========================================

module.exports =
  mongoose.models.TodoActivity ||
  mongoose.model(
    "TodoActivity",
    activitySchema
  );