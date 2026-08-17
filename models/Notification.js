const mongoose =
  require("mongoose");

// ==========================================
// Notification Schema
// ==========================================

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

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );