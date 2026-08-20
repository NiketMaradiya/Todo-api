const mongoose =
  require("mongoose");

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

      attachmentPublicId: {
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

        default:
          "pending",
      },

      priority: {
        type: String,

        enum: [
          "low",
          "medium",
          "high",
        ],

        default:
          "medium",
      },

      tags: {
        type: [String],

        default: [],
      },

      dueDate: {
        type: Date,

        default: null,
      },

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

// ==========================================
// DATABASE INDEXING & QUERY OPTIMIZATION
// ==========================================

todoSchema.index({
  createdBy: 1,
  isDeleted: 1,
  createdAt: -1,
});

todoSchema.index({
  assignedTo: 1,
  isDeleted: 1,
  createdAt: -1,
});

todoSchema.index({
  isDeleted: 1,
  createdAt: -1,
});

todoSchema.index({
  isDeleted: 1,
  status: 1,
  createdAt: -1,
});

todoSchema.index({
  isDeleted: 1,
  priority: 1,
  createdAt: -1,
});

todoSchema.index({
  isDeleted: 1,
  status: 1,
  priority: 1,
  createdAt: -1,
});

todoSchema.index({
  isDeleted: 1,
  dueDate: 1,
});

todoSchema.index({
  isDeleted: 1,
  deletedAt: -1,
});

module.exports =
  mongoose.model(
    "Todo",
    todoSchema
  );