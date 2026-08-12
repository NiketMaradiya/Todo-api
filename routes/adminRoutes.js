const express = require("express");

const {
  getAllUsers,
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

// First authenticate user
router.use(protect);

// Then check admin role
router.use(authorize("admin"));

router.get(
  "/users",
  getAllUsers
);

router.post(
  "/users/:id/make-admin",
  makeAdmin
);

router.post(
  "/users/:id/remove-admin",
  removeAdmin
);

router.patch(
  "/users/:id/role",
  changeUserRole
);

router.patch(
  "/users/:id/password",
  changeUserPassword
);

router.patch(
  "/users/:id/status",
  changeUserStatus
);

router.delete(
  "/users/:id",
  deleteUser
);

module.exports = router;