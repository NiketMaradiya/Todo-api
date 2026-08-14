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

const router = express.Router();

router.use(protect);

// Create Todo with optional attachment.
// File field name: attachment
router.post(
  "/",
  uploadAttachment.single("attachment"),
  createTodo
);

router.get("/", getTodos);

router.get("/stats", getTodoStats);

router.get("/:id", getTodoById);

// Update Todo with optional attachment.
// PUT and PATCH both support multipart/form-data.
router.put(
  "/:id",
  uploadAttachment.single("attachment"),
  updateTodo
);

router.patch(
  "/:id",
  uploadAttachment.single("attachment"),
  updateTodo
);

router.patch(
  "/:id/status",
  updateTodoStatus
);

router.delete("/:id", deleteTodo);

module.exports = router;