const express = require("express");

const {
  createTodo,
  getTodos,
  getTodoStats,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
} = require("../controllers/todoController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  uploadAttachment,
} = require("../middleware/uploadMiddleware");

const router =
  express.Router();

router.use(protect);

// ==========================================
// Create Todo
// Optional attachment
// Field name: attachment
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
// ==========================================

router.get(
  "/",
  getTodos
);

// ==========================================
// Todo Statistics
// ==========================================

router.get(
  "/stats",
  getTodoStats
);

// ==========================================
// Get Todo By ID
// ==========================================

router.get(
  "/:id",
  getTodoById
);

// ==========================================
// Update Todo
// Optional attachment
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
// ==========================================

router.patch(
  "/:id/status",
  updateTodoStatus
);

// ==========================================
// Delete Todo
// ==========================================

router.delete(
  "/:id",
  deleteTodo
);

module.exports = router;