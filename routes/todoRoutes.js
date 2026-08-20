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

const {
  createAiTodo,
} = require(
  "../controllers/aiTodoController"
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
// ==========================================

router.use(
  protect,
  requirePasswordChanged
);

// ==========================================
// CREATE TODO FROM AI
// POST /api/todos/ai
// ==========================================

router.post(
  "/ai",
  createAiTodo
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

router.post(
  "/:id/comments",
  addComment
);

router.get(
  "/:id/comments",
  getTodoComments
);

router.patch(
  "/:todoId/comments/:commentId",
  updateComment
);

router.delete(
  "/:todoId/comments/:commentId",
  deleteComment
);

// ==========================================
// TODO ACTIVITY / AUDIT LOG
// ==========================================

router.get(
  "/:id/activity",
  getTodoActivity
);

// ==========================================
// GET SINGLE TODO
// ==========================================

router.get(
  "/:id",
  getTodoById
);

// ==========================================
// UPDATE TODO
// ==========================================

router.put(
  "/:id",
  updateTodo
);

router.patch(
  "/:id",
  updateTodo
);

// ==========================================
// SOFT DELETE TODO
// ==========================================

router.delete(
  "/:id",
  deleteTodo
);

module.exports =
  router;