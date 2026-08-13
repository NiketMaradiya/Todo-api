const express = require("express");

const {
  getAllUsers,

  // Admin Todo APIs
  getAllTodos,
  getAdminTodoById,
  updateAdminTodo,
  deleteAdminTodo,

  // Admin User APIs
  makeAdmin,
  removeAdmin,
  changeUserRole,
  changeUserPassword,
  changeUserStatus,
  deleteUser,
} = require("../controllers/adminController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ALL ADMIN ROUTES
// ==========================================

// Authentication
router.use(protect);

// Admin role required
router.use(authorize("admin"));

// ==========================================
// ADMIN TODO ROUTES
// ==========================================

// GET /api/admin/todos
// Admin can see ALL users' todos
router.get(
  "/todos",
  getAllTodos
);

// GET /api/admin/todos/:id
// Admin can see ANY todo
router.get(
  "/todos/:id",
  getAdminTodoById
);

// PUT /api/admin/todos/:id
// Admin can update ANY todo
router.put(
  "/todos/:id",
  updateAdminTodo
);

// PATCH /api/admin/todos/:id
// Admin can update ANY todo
router.patch(
  "/todos/:id",
  updateAdminTodo
);

// DELETE /api/admin/todos/:id
// Admin can delete ANY todo
router.delete(
  "/todos/:id",
  deleteAdminTodo
);

// ==========================================
// ADMIN USER ROUTES
// ==========================================

// GET /api/admin/users
router.get(
  "/users",
  getAllUsers
);

// POST /api/admin/users/:id/make-admin
router.post(
  "/users/:id/make-admin",
  makeAdmin
);

// POST /api/admin/users/:id/remove-admin
router.post(
  "/users/:id/remove-admin",
  removeAdmin
);

// PATCH /api/admin/users/:id/role
router.patch(
  "/users/:id/role",
  changeUserRole
);

// PATCH /api/admin/users/:id/password
router.patch(
  "/users/:id/password",
  changeUserPassword
);

// PATCH /api/admin/users/:id/status
router.patch(
  "/users/:id/status",
  changeUserStatus
);

// DELETE /api/admin/users/:id
router.delete(
  "/users/:id",
  deleteUser
);

module.exports = router;