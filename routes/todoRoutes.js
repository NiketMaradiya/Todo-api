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

// All Todo APIs require login
router.use(protect);

// Create Todo
router.post(
  "/",
  createTodo
);

// Get All Todos
router.get(
  "/",
  getTodos
);

// Get Statistics
router.get(
  "/stats",
  getTodoStats
);

// Get Single Todo
router.get(
  "/:id",
  getTodoById
);

// Update Todo
router.put(
  "/:id",
  updateTodo
);

// Also allow PATCH for update
router.patch(
  "/:id",
  updateTodo
);

// Update Todo Status
router.patch(
  "/:id/status",
  updateTodoStatus
);

// Delete Todo
router.delete(
  "/:id",
  deleteTodo
);

module.exports = router;