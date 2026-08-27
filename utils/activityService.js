const TodoActivity =
  require(
    "../models/TodoActivity"
  );

// ==========================================
// Create Todo Activity
//
// Transaction support:
// - session is optional
// - when session is provided, the activity
//   is created inside the same transaction
//
// Important:
// If a transaction session is provided and
// activity creation fails, the error is thrown
// so the parent transaction can rollback.
//
// For old non-transaction APIs, activity
// creation failure is swallowed to preserve
// existing behavior.
// ==========================================

const createActivity =
  async ({
    todoId,
    userId,
    action,
    oldValue = null,
    newValue = null,
    session = null,
  }) => {
    try {
      if (!todoId) {
        throw new Error(
          "todoId is required"
        );
      }

      if (!userId) {
        throw new Error(
          "userId is required"
        );
      }

      if (!action) {
        throw new Error(
          "action is required"
        );
      }

      const activityData = {
        todoId,
        userId,
        action,
        oldValue,
        newValue,
      };

      // ==========================================
      // Transactional insert
      // ==========================================

      if (session) {
        const created =
          await TodoActivity.create(
            [activityData],
            {
              session,
            }
          );

        return created[0];
      }

      // ==========================================
      // Normal insert
      // ==========================================

      return await TodoActivity.create(
        activityData
      );
    } catch (error) {
      console.error(
        "Activity creation error:",
        error.message
      );

      // ==========================================
      // IMPORTANT
      //
      // Transaction caller MUST receive the error.
      // This causes withTransaction() to rollback.
      // ==========================================

      if (session) {
        throw error;
      }

      // ==========================================
      // Preserve old non-transaction behavior
      // ==========================================

      return null;
    }
  };

// ==========================================
// Get Todo Activities
// Newest activity first
// ==========================================

const getTodoActivities =
  async (
    todoId
  ) => {
    try {
      const activities =
        await TodoActivity.find({
          todoId,
        })
          .populate(
            "userId",
            "name email role"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return activities;
    } catch (error) {
      throw error;
    }
  };

module.exports = {
  createActivity,
  getTodoActivities,
};