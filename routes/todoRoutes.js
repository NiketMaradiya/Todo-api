const express =
  require("express");

const {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,

  // Comments
  addComment,
  getTodoComments,

  // Activity
  getTodoActivity,
} = require(
  "../controllers/todoController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  uploadAttachment,
} = require(
  "../middleware/uploadMiddleware"
);

const router =
  express.Router();

// ==========================================
// Authentication Required
// ==========================================

router.use(
  protect
);

// ==========================================
// Create Todo
// POST /api/todos
// ==========================================

router.post(
  "/",
  uploadAttachment.single(
    "attachment"
  ),
  createTodo
);

// ==========================================
// Get Todos
// GET /api/todos
// ==========================================

router.get(
  "/",
  getTodos
);

// ==========================================
// Todo Statistics
// GET /api/todos/stats
// ==========================================

router.get(
  "/stats",
  getTodoStats
);

// ==========================================
// Comments
//
// IMPORTANT:
// These routes must come before /:id
// ==========================================

// POST /api/todos/:id/comments
router.post(
  "/:id/comments",
  addComment
);

// GET /api/todos/:id/comments
router.get(
  "/:id/comments",
  getTodoComments
);

// ==========================================
// Activity History
// GET /api/todos/:id/activity
// ==========================================

router.get(
  "/:id/activity",
  getTodoActivity
);

// ==========================================
// Get Todo By ID
// GET /api/todos/:id
// ==========================================

router.get(
  "/:id",
  getTodoById
);

// ==========================================
// Update Todo
// PUT/PATCH /api/todos/:id
// ==========================================

router.put(
  "/:id",
  uploadAttachment.single(
    "attachment"
  ),
  updateTodo
);

router.patch(
  "/:id",
  uploadAttachment.single(
    "attachment"
  ),
  updateTodo
);

// ==========================================
// Update Todo Status
// PATCH /api/todos/:id/status
// ==========================================

router.patch(
  "/:id/status",
  updateTodoStatus
);

// ==========================================
// Delete Todo
// DELETE /api/todos/:id
// ==========================================

router.delete(
  "/:id",
  deleteTodo
);

module.exports =
  router;