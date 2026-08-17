const express = require("express");

const router = express.Router();

const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
  uploadTodoAttachment,
  addComment,
  getTodoComments,
  updateComment,
  deleteComment,
  getTodoActivity,
} = require("../controllers/todoController");

const {
  protect,
} = require("../middleware/authMiddleware");

const upload = require(
  "../middleware/uploadMiddleware"
);

// ==========================================
// TODO CRUD
// ==========================================

// Create Todo
router.post(
  "/",
  protect,
  createTodo
);

// Get All Todos
router.get(
  "/",
  protect,
  getTodos
);

// ==========================================
// STATUS
// ==========================================

// Update Todo Status
router.patch(
  "/:id/status",
  protect,
  updateTodoStatus
);

// ==========================================
// ATTACHMENT
// ==========================================

// Upload Attachment
router.post(
  "/:id/attachment",
  protect,
  upload.single("attachment"),
  uploadTodoAttachment
);

// ==========================================
// COMMENTS
// ==========================================

// Add Comment
router.post(
  "/:id/comments",
  protect,
  addComment
);

// Get Comments
router.get(
  "/:id/comments",
  protect,
  getTodoComments
);

// Update Comment
router.patch(
  "/:todoId/comments/:commentId",
  protect,
  updateComment
);

// Delete Comment
router.delete(
  "/:todoId/comments/:commentId",
  protect,
  deleteComment
);

// ==========================================
// ACTIVITY
// IMPORTANT: Before /:id
// ==========================================

router.get(
  "/:id/activity",
  protect,
  getTodoActivity
);

// ==========================================
// SINGLE TODO
// IMPORTANT: Keep after specific routes
// ==========================================

// Get Single Todo
router.get(
  "/:id",
  protect,
  getTodoById
);

// Update Todo
router.put(
  "/:id",
  protect,
  updateTodo
);

router.patch(
  "/:id",
  protect,
  updateTodo
);

// Delete Todo
router.delete(
  "/:id",
  protect,
  deleteTodo
);

module.exports = router;