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

router.use(protect);

router.post("/", createTodo);

router.get("/", getTodos);

router.get("/stats", getTodoStats);

router.get("/:id", getTodoById);

router.put("/:id", updateTodo);

router.patch("/:id", updateTodo);

router.patch("/:id/status",updateTodoStatus);

router.delete("/:id", deleteTodo);

module.exports = router;