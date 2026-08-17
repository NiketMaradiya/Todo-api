const mongoose = require("mongoose");

// ==========================================
// Comment Schema
// ==========================================

const commentSchema = new mongoose.Schema(
  {
    // ========================================
    // Todo ID
    // ========================================

    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Todo",
      required: true,
      index: true,
    },

    // ========================================
    // User who created the comment
    // ========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // Comment text
    // ========================================

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// Compound Index
// ==========================================

commentSchema.index({
  todoId: 1,
  createdAt: -1,
});

// ==========================================
// Model
// ==========================================

module.exports = mongoose.model(
  "Comment",
  commentSchema
);