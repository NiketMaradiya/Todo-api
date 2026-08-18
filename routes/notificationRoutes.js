const express =
  require("express");

const {
  protect,
  requirePasswordChanged,
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
// Authentication + Password Change Required
//
// A user with:
//
// mustChangePassword === true
//
// cannot access notifications.
// ==========================================

router.use(
  protect,
  requirePasswordChanged
);

// ==========================================
// GET NOTIFICATIONS
//
// GET /api/notifications
// ==========================================

router.get(
  "/",
  getNotifications
);

// ==========================================
// MARK ALL AS READ
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
// MARK ONE AS READ
//
// PATCH /api/notifications/:id/read
// ==========================================

router.patch(
  "/:id/read",
  markNotificationAsRead
);

// ==========================================
// EXPORT
// ==========================================

module.exports =
  router;