const express =
  require("express");

const {
  getAllUsers,

  // ==========================================
  // Admin Todo APIs
  // ==========================================
  getAllTodos,
  getAdminTodoById,
  updateAdminTodo,
  deleteAdminTodo,
  getTrashTodos,
  restoreTodo,

  // ==========================================
  // Admin User APIs
  // ==========================================
  makeAdmin,
  removeAdmin,
  changeUserRole,
  changeUserPassword,
  changeUserStatus,
  deleteUser,
} = require(
  "../controllers/adminController"
);

// ==========================================
// Cloudinary Admin APIs
// ==========================================

const {
  createAdminCloudinaryConfig,
  getAdminCloudinaryConfig,
  updateAdminCloudinaryConfig,
  deleteAdminCloudinaryConfig,
} = require(
  "../controllers/cloudinaryAdminController"
);

const {
  protect,
  requirePasswordChanged,
  authorize,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();

// ==========================================
// ALL ADMIN ROUTES
// ==========================================

// JWT authentication
router.use(
  protect
);

// ==========================================
// Temporary password protection
//
// Admin cannot access admin APIs until
// the temporary password has been changed.
// ==========================================

router.use(
  requirePasswordChanged
);

// ==========================================
// Admin role required
// ==========================================

router.use(
  authorize("admin")
);

// ==========================================
// ADMIN TODO ROUTES
// ==========================================

// ------------------------------------------
// GET /api/admin/todos
//
// Admin can see ALL active Todos
// ------------------------------------------

router.get(
  "/todos",
  getAllTodos
);

// ------------------------------------------
// GET /api/admin/todos/trash
//
// Admin can see all soft-deleted Todos
//
// IMPORTANT:
// Keep this BEFORE /todos/:id
// ------------------------------------------

router.get(
  "/todos/trash",
  getTrashTodos
);

// ------------------------------------------
// GET /api/admin/todos/:id
//
// Admin can see ANY active Todo
// ------------------------------------------

router.get(
  "/todos/:id",
  getAdminTodoById
);

// ------------------------------------------
// PUT /api/admin/todos/:id
//
// Admin can update ANY active Todo
// ------------------------------------------

router.put(
  "/todos/:id",
  updateAdminTodo
);

// ------------------------------------------
// PATCH /api/admin/todos/:id
//
// Admin can update ANY active Todo
// ------------------------------------------

router.patch(
  "/todos/:id",
  updateAdminTodo
);

// ------------------------------------------
// DELETE /api/admin/todos/:id
//
// Admin can soft-delete ANY active Todo
// ------------------------------------------

router.delete(
  "/todos/:id",
  deleteAdminTodo
);

// ------------------------------------------
// PATCH /api/admin/todos/:id/restore
//
// Admin can restore a soft-deleted Todo
// ------------------------------------------

router.patch(
  "/todos/:id/restore",
  restoreTodo
);

// ==========================================
// ADMIN USER ROUTES
// ==========================================

// ------------------------------------------
// GET /api/admin/users
// ------------------------------------------

router.get(
  "/users",
  getAllUsers
);

// ------------------------------------------
// POST /api/admin/users/:id/make-admin
// ------------------------------------------

router.post(
  "/users/:id/make-admin",
  makeAdmin
);

// ------------------------------------------
// POST /api/admin/users/:id/remove-admin
// ------------------------------------------

router.post(
  "/users/:id/remove-admin",
  removeAdmin
);

// ------------------------------------------
// PATCH /api/admin/users/:id/role
// ------------------------------------------

router.patch(
  "/users/:id/role",
  changeUserRole
);

// ------------------------------------------
// PATCH /api/admin/users/:id/password
// ------------------------------------------

router.patch(
  "/users/:id/password",
  changeUserPassword
);

// ------------------------------------------
// PATCH /api/admin/users/:id/status
// ------------------------------------------

router.patch(
  "/users/:id/status",
  changeUserStatus
);

// ------------------------------------------
// DELETE /api/admin/users/:id
// ------------------------------------------

router.delete(
  "/users/:id",
  deleteUser
);

// ==========================================
// ADMIN CLOUDINARY CONFIGURATION ROUTES
// ==========================================

// ------------------------------------------
// POST /api/admin/cloudinary
//
// Create Cloudinary configuration
// ------------------------------------------

router.post(
  "/cloudinary",
  createAdminCloudinaryConfig
);

// ------------------------------------------
// GET /api/admin/cloudinary
//
// Get Cloudinary configuration
//
// IMPORTANT:
// apiSecret is NEVER returned.
// ------------------------------------------

router.get(
  "/cloudinary",
  getAdminCloudinaryConfig
);

// ------------------------------------------
// PUT /api/admin/cloudinary
//
// Update Cloudinary configuration
// ------------------------------------------

router.put(
  "/cloudinary",
  updateAdminCloudinaryConfig
);

// ------------------------------------------
// DELETE /api/admin/cloudinary
//
// Delete Cloudinary configuration
// ------------------------------------------

router.delete(
  "/cloudinary",
  deleteAdminCloudinaryConfig
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports =
  router;