const express =
  require("express");

const {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
} = require(
  "../controllers/authController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();

// ==========================================
// Public Routes
// ==========================================

// Register new user
router.post(
  "/register",
  register
);

// Login existing user
router.post(
  "/login",
  login
);

// Forgot password
router.post(
  "/forgot-password",
  forgotPassword
);

// Reset password
router.patch(
  "/reset-password/:token",
  resetPassword
);

// ==========================================
// Protected Routes
// ==========================================

// Change password
router.patch(
  "/change-password",
  protect,
  changePassword
);

// Logout
router.post(
  "/logout",
  protect,
  logout
);

// Profile
router.get(
  "/profile",
  protect,
  getProfile
);

module.exports =
  router;