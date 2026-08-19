const Todo = require("../models/Todo");

// ==========================================
// Trash Retention Configuration
// ==========================================

const getRetentionDays = () => {
  const value = Number(
    process.env.TRASH_RETENTION_DAYS
  );

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 30;
  }

  return Math.floor(value);
};

// ==========================================
// Permanently Delete Old Trash
// ==========================================
//
// This removes Todos that:
// - are already soft deleted
// - have deletedAt older than retention period
//
// This operation can change Todo data, so the
// Todo LFU cache is invalidated afterwards.
// ==========================================

const cleanupTrash = async () => {
  try {
    const retentionDays =
      getRetentionDays();

    const cutoffDate =
      new Date(
        Date.now() -
          retentionDays *
            24 *
            60 *
            60 *
            1000
      );

    const result =
      await Todo.deleteMany({
        isDeleted: true,

        deletedAt: {
          $lte: cutoffDate,
        },
      });

    // ==========================================
    // Cache Invalidation
    // ==========================================
    //
    // Permanently deleting old Todo records
    // means future Todo queries must never use
    // an outdated cached result.
    // ==========================================

    if (
      result.deletedCount > 0
    ) {
      try {
        const todoCache =
          require(
            "./lfuCache"
          );

        todoCache.invalidateTodos();
      } catch (cacheError) {
        // Cache failure must never stop
        // background cleanup.
      }
    }

    if (
      result.deletedCount > 0
    ) {
      console.log(
        `Trash cleanup: permanently deleted ${result.deletedCount} Todo(s) older than ${retentionDays} day(s).`
      );
    }

    return result.deletedCount;
  } catch (error) {
    console.error(
      "Trash cleanup failed:",
      error.message
    );

    return 0;
  }
};

// ==========================================
// Start Automatic Cleanup
// ==========================================
//
// Runs once immediately and then once every
// 24 hours.
//
// The interval is unref()'d so it does not keep
// Node.js alive by itself.
// ==========================================

const startTrashCleanup = () => {
  cleanupTrash();

  const interval =
    setInterval(
      () => {
        cleanupTrash();
      },
      24 *
        60 *
        60 *
        1000
    );

  if (
    interval &&
    typeof interval.unref ===
      "function"
  ) {
    interval.unref();
  }

  return interval;
};

// ==========================================
// Export
// ==========================================

module.exports = {
  cleanupTrash,
  startTrashCleanup,
};