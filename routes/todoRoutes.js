const express = require("express");

const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  updateTodoStatus,
  getTodoStats,
  deleteTodo,
} = require("../controllers/todoController");

const protect = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

// ==========================================
// All Todo Routes Require JWT
// ==========================================

router.use(protect);

// Create Todo
router.post("/", createTodo);

// Get All User Todos
router.get("/", getTodos);

// Get Todo Statistics
router.get("/stats", getTodoStats);

// Get Todo By ID
router.get("/:id", getTodoById);

// Update Todo
router.put("/:id", updateTodo);

// Update Todo Status
router.patch(
  "/:id/status",
  updateTodoStatus
);

// Delete Todo
router.delete("/:id", deleteTodo);

module.exports = router;