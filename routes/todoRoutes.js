const express = require("express");

const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  toggleTodo,
  getTodoStats,
  deleteTodo,
} = require("../controllers/todoController");

const router = express.Router();

// Create Todo
router.post("/", createTodo);

// Get Todos
router.get("/", getTodos);

// Get Todo Statistics
router.get("/stats", getTodoStats);

// Get Todo By ID
router.get("/:id", getTodoById);

// Update Todo
router.put("/:id", updateTodo);

// Toggle Todo
router.patch("/:id/toggle", toggleTodo);

// Delete Todo
router.delete("/:id", deleteTodo);

module.exports = router;