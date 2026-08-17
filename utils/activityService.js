const Activity =
  require("../models/Activity");

// ==========================================
// Create Activity Record
// ==========================================

const createActivity = async ({
  action,
  performedBy,
  todoId,
  metadata = {},
}) => {
  return await Activity.create({
    action,
    performedBy,
    todoId,
    metadata,
  });
};

module.exports = {
  createActivity,
};