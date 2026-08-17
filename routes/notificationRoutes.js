const express =
  require("express");

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  getNotifications,

  markNotificationAsRead,

  markAllNotificationsAsRead,
} = require(
  "../controllers/notificationController"
);

const router =
  express.Router();

// ==========================================
// Authentication Required
// ==========================================

router.use(
  protect
);

// ==========================================
// Get Logged-In User Notifications
//
// GET /api/notifications
// ==========================================

router.get(
  "/",
  getNotifications
);

// ==========================================
// Mark All Notifications As Read
//
// IMPORTANT:
// This must come before /:id/read
//
// PATCH /api/notifications/read-all
// ==========================================

router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

// ==========================================
// Mark One Notification As Read
//
// PATCH /api/notifications/:id/read
// ==========================================

router.patch(
  "/:id/read",
  markNotificationAsRead
);

module.exports =
  router;