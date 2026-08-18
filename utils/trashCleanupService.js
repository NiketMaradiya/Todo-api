const Todo = require("../models/Todo");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const TodoActivity = require("../models/TodoActivity");

const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");

// ==========================================
// Trash Retention Configuration
// ==========================================
//
// Default:
// Todo remains in Trash for 30 days.
//
// You can change this from .env:
//
// TRASH_RETENTION_DAYS=7
//
// or:
//
// TRASH_RETENTION_DAYS=30
// ==========================================

const getTrashRetentionDays = () => {
  const value = Number(
    process.env.TRASH_RETENTION_DAYS || 30
  );

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 30;
  }

  return value;
};

// ==========================================
// Delete Cloudinary Attachment
// ==========================================
//
// This is best-effort cleanup.
//
// If Cloudinary deletion fails, the Todo and
// database records are still permanently deleted.
// ==========================================

const deleteCloudinaryAttachment = async (
  publicId
) => {
  if (!publicId) {
    return;
  }

  if (!isCloudinaryConfigured()) {
    console.warn(
      "Cloudinary is not configured. Skipping attachment cleanup."
    );

    return;
  }

  try {
    // Try image first.
    const imageResult =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image",
        }
      );

    if (
      imageResult &&
      (
        imageResult.result ===
          "ok" ||
        imageResult.result ===
          "not found"
      )
    ) {
      return;
    }

    // If it was not an image, try raw.
    try {
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "raw",
        }
      );
    } catch (rawError) {
      console.warn(
        `Could not delete Cloudinary attachment ${publicId}: ${rawError.message}`
      );
    }
  } catch (error) {
    console.warn(
      `Could not delete Cloudinary attachment ${publicId}: ${error.message}`
    );
  }
};

// ==========================================
// Permanently Delete Expired Trash
// ==========================================
//
// Finds Todos that:
// - are in Trash
// - have deletedAt
// - have been in Trash longer than retention
//
// Then permanently removes:
// - Todo
// - Comments
// - Notifications
// - Todo Activity / Audit records
// - Cloudinary attachment
// ==========================================

const cleanupExpiredTrash = async () => {
  try {
    const retentionDays =
      getTrashRetentionDays();

    const cutoffDate =
      new Date();

    cutoffDate.setDate(
      cutoffDate.getDate() -
        retentionDays
    );

    console.log(
      `[Trash Cleanup] Checking Todos deleted before ${cutoffDate.toISOString()}`
    );

    const expiredTodos =
      await Todo.find({
        isDeleted: true,

        deletedAt: {
          $ne: null,
          $lte: cutoffDate,
        },
      })
        .select(
          "_id attachmentPublicId deletedAt"
        )
        .lean();

    if (
      expiredTodos.length === 0
    ) {
      console.log(
        "[Trash Cleanup] No expired Todos found."
      );

      return {
        deletedCount: 0,
      };
    }

    const todoIds =
      expiredTodos.map(
        (todo) => todo._id
      );

    // ========================================
    // Delete Cloudinary attachments
    // ========================================

    for (
      const todo of expiredTodos
    ) {
      if (
        todo.attachmentPublicId
      ) {
        await deleteCloudinaryAttachment(
          todo.attachmentPublicId
        );
      }
    }

    // ========================================
    // Delete related Comments
    // ========================================

    const commentsResult =
      await Comment.deleteMany({
        todoId: {
          $in: todoIds,
        },
      });

    // ========================================
    // Delete related Notifications
    // ========================================

    const notificationsResult =
      await Notification.deleteMany({
        todoId: {
          $in: todoIds,
        },
      });

    // ========================================
    // Delete related Todo Activity
    // ========================================

    const activitiesResult =
      await TodoActivity.deleteMany({
        todoId: {
          $in: todoIds,
        },
      });

    // ========================================
    // Permanently delete Todos
    // ========================================

    const todosResult =
      await Todo.deleteMany({
        _id: {
          $in: todoIds,
        },

        isDeleted: true,

        deletedAt: {
          $ne: null,
          $lte: cutoffDate,
        },
      });

    console.log(
      `[Trash Cleanup] Permanently deleted ${todosResult.deletedCount} Todo(s).`
    );

    console.log(
      `[Trash Cleanup] Deleted ${commentsResult.deletedCount} comment(s).`
    );

    console.log(
      `[Trash Cleanup] Deleted ${notificationsResult.deletedCount} notification(s).`
    );

    console.log(
      `[Trash Cleanup] Deleted ${activitiesResult.deletedCount} activity record(s).`
    );

    return {
      deletedCount:
        todosResult.deletedCount,

      commentsDeleted:
        commentsResult.deletedCount,

      notificationsDeleted:
        notificationsResult.deletedCount,

      activitiesDeleted:
        activitiesResult.deletedCount,
    };
  } catch (error) {
    console.error(
      "[Trash Cleanup] Error:",
      error.message
    );

    return {
      deletedCount: 0,
      error: error.message,
    };
  }
};

// ==========================================
// Start Automatic Trash Cleanup
// ==========================================
//
// Runs:
// 1. Immediately when server starts
// 2. Every 24 hours afterwards
// ==========================================

const startTrashCleanup = () => {
  const retentionDays =
    getTrashRetentionDays();

  const intervalMilliseconds =
    24 * 60 * 60 * 1000;

  console.log(
    `[Trash Cleanup] Automatic cleanup enabled.`
  );

  console.log(
    `[Trash Cleanup] Retention period: ${retentionDays} day(s).`
  );

  console.log(
    "[Trash Cleanup] Cleanup interval: every 24 hours."
  );

  // ========================================
  // Run once immediately
  // ========================================

  cleanupExpiredTrash();

  // ========================================
  // Run every 24 hours
  // ========================================

  const cleanupInterval =
    setInterval(
      () => {
        cleanupExpiredTrash();
      },
      intervalMilliseconds
    );

  // ========================================
  // Do not keep Node process alive only
  // because of this timer.
  // ========================================

  if (
    cleanupInterval &&
    typeof cleanupInterval.unref ===
      "function"
  ) {
    cleanupInterval.unref();
  }

  return cleanupInterval;
};

module.exports = {
  cleanupExpiredTrash,
  startTrashCleanup,
  getTrashRetentionDays,
};