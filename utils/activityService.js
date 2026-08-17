const TodoActivity = require("../models/TodoActivity");

// ==========================================
// Create Todo Activity
// ==========================================

const createActivity = async ({
  todoId,
  userId,
  action,
  oldValue = null,
  newValue = null,
}) => {
  try {
    if (!todoId) {
      throw new Error("todoId is required");
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    if (!action) {
      throw new Error("action is required");
    }

    const activity = await TodoActivity.create({
      todoId,
      userId,
      action,
      oldValue,
      newValue,
    });

    return activity;
  } catch (error) {
    console.error("Activity creation error:", error.message);

    // Do not break the main Todo operation
    return null;
  }
};

// ==========================================
// Get Todo Activities
// Newest activity first
// ==========================================

const getTodoActivities = async (todoId) => {
  try {
    const activities = await TodoActivity.find({
      todoId,
    })
      .populate("userId", "name email role")
      .sort({
        createdAt: -1,
      });

    return activities;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createActivity,
  getTodoActivities,
};