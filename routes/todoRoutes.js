const express =
  require("express");

const router =
  express.Router();

// ==========================================
// Todo Controller
// ==========================================

const {
  createTodo,
  getTodos,
  getTodoStats,
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
} = require(
  "../controllers/todoController"
);

// ==========================================
// Authentication Middleware
// ==========================================

const {
  protect,
  requirePasswordChanged,
} = require(
  "../middleware/authMiddleware"
);

// ==========================================
// Multer Upload Middleware
// ==========================================

const upload =
  require(
    "../middleware/uploadMiddleware"
  );

// ==========================================
// IMPORTANT
//
// Every Todo API requires:
//
// 1. Valid JWT
// 2. Active account
// 3. Temporary password already changed
//
// A first-login user receives 403.
// ==========================================

router.use(
  protect,
  requirePasswordChanged
);

// ==========================================
// CREATE TODO
// POST /api/todos
// ==========================================

router.post(
  "/",
  createTodo
);

// ==========================================
// GET TODOS
// GET /api/todos
// ==========================================

router.get(
  "/",
  getTodos
);

// ==========================================
// TODO STATISTICS
// GET /api/todos/stats
//
// IMPORTANT:
// This route must be before /:id.
// ==========================================

router.get(
  "/stats",
  getTodoStats
);

// ==========================================
// TODO STATUS
// PATCH /api/todos/:id/status
// ==========================================

router.patch(
  "/:id/status",
  updateTodoStatus
);

// ==========================================
// TODO ATTACHMENT
// POST /api/todos/:id/attachment
// ==========================================

router.post(
  "/:id/attachment",
  upload.single(
    "attachment"
  ),
  uploadTodoAttachment
);

// ==========================================
// TODO COMMENTS
// ==========================================

// Add Comment
// POST /api/todos/:id/comments

router.post(
  "/:id/comments",
  addComment
);

// Get Comments
// GET /api/todos/:id/comments

router.get(
  "/:id/comments",
  getTodoComments
);

// Update Comment
// PATCH /api/todos/:todoId/comments/:commentId

router.patch(
  "/:todoId/comments/:commentId",
  updateComment
);

// Delete Comment
// DELETE /api/todos/:todoId/comments/:commentId

router.delete(
  "/:todoId/comments/:commentId",
  deleteComment
);

// ==========================================
// TODO ACTIVITY / AUDIT LOG
// GET /api/todos/:id/activity
// ==========================================

router.get(
  "/:id/activity",
  getTodoActivity
);

// ==========================================
// GET SINGLE TODO
// GET /api/todos/:id
// ==========================================

router.get(
  "/:id",
  getTodoById
);

// ==========================================
// UPDATE TODO
// PUT /api/todos/:id
// ==========================================

router.put(
  "/:id",
  updateTodo
);

// ==========================================
// UPDATE TODO
// PATCH /api/todos/:id
// ==========================================

router.patch(
  "/:id",
  updateTodo
);

// ==========================================
// SOFT DELETE TODO
// DELETE /api/todos/:id
// ==========================================

router.delete(
  "/:id",
  deleteTodo
);

// ==========================================
// EXPORT
// ==========================================

module.exports =
  router;