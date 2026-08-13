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

const router = express.Router();

// ==========================================
// All Todo APIs require authentication
// ==========================================

router.use(protect);

// ==========================================
// Create Todo
// POST /api/todos
// ==========================================

router.post(
  "/",
  createTodo
);

// ==========================================
// Get My Todos
// GET /api/todos
//
// Shows:
// - Created by me
// - Assigned to me
// ==========================================

router.get(
  "/",
  getTodos
);

// ==========================================
// Get Todo Statistics
// GET /api/todos/stats
// ==========================================

router.get(
  "/stats",
  getTodoStats
);

// ==========================================
// Get Single Todo
// GET /api/todos/:id
// ==========================================

router.get(
  "/:id",
  getTodoById
);

// ==========================================
// Update Todo
// PUT /api/todos/:id
// PATCH /api/todos/:id
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

module.exports = router;