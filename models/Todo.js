const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    // ==========================================
    // Todo Title
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // Todo Description
    // ==========================================

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // Todo Creator
    // ==========================================

    createdBy: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      immutable: true,
    },

    // ==========================================
    // Assigned User
    // ==========================================

    assignedTo: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    // ==========================================
    // Attachment URL
    // ==========================================

    attachmentUrl: {
      type: String,

      default: null,

      trim: true,
    },

    // ==========================================
    // Cloudinary Public ID
    // ==========================================

    attachmentPublicId: {
      type: String,

      default: null,

      trim: true,
    },

    // ==========================================
    // Todo Status
    // ==========================================

    status: {
      type: String,

      enum: [
        "pending",
        "in-progress",
        "completed",
      ],

      default: "pending",
    },

    // ==========================================
    // Todo Priority
    // ==========================================

    priority: {
      type: String,

      enum: [
        "low",
        "medium",
        "high",
      ],

      default: "medium",
    },

    // ==========================================
    // Todo Due Date
    // ==========================================

    dueDate: {
      type: Date,

      default: null,
    },

    // ==========================================
    // Soft Delete
    // ==========================================

    isDeleted: {
      type: Boolean,

      default: false,
    },

    // ==========================================
    // Deleted At
    // ==========================================

    deletedAt: {
      type: Date,

      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ==========================================
// Indexes
// ==========================================

todoSchema.index({
  createdBy: 1,
});

todoSchema.index({
  assignedTo: 1,
});

todoSchema.index({
  isDeleted: 1,
});

todoSchema.index({
  status: 1,
});

todoSchema.index({
  priority: 1,
});

todoSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model(
  "Todo",
  todoSchema
);