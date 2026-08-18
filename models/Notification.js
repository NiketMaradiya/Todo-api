const mongoose =
  require("mongoose");

const notificationSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,
      },

      todoId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Todo",

        default: null,
      },

      type: {
        type: String,

        enum: [
          "todo_assigned",
          "todo_due_soon",
          "todo_overdue",
          "todo_status_changed",
          "comment_added",
        ],

        required: true,
      },

      message: {
        type: String,

        required: true,

        trim: true,
      },

      isRead: {
        type: Boolean,

        default: false,
      },
    },

    {
      timestamps: {
        createdAt: true,

        updatedAt: false,
      },
    }
  );

// ==========================================
// DATABASE INDEXING
// ==========================================

// Notification list for a user, newest first.
notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

// Unread notification count and read-all query.
notificationSchema.index({
  userId: 1,
  isRead: 1,
});

// Prevent duplicate due-date notifications
// from requiring a collection scan.
notificationSchema.index({
  userId: 1,
  todoId: 1,
  type: 1,
});

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );