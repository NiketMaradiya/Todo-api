const mongoose =
  require("mongoose");

const Notification =
  require(
    "../models/Notification"
  );

const {
  createDueDateNotifications,
} = require(
  "../utils/notificationService"
);

// ==========================================
// Validate MongoDB ID
// ==========================================

const isValidId = (
  id
) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

// ==========================================
// Get Logged-In User Notifications
//
// GET /api/notifications
// ==========================================

const getNotifications =
  async (
    req,
    res
  ) => {
    try {
      // ==========================================
      // Check Due Dates
      //
      // This creates due-soon and overdue
      // notifications when needed.
      // ==========================================

      await createDueDateNotifications();

      // ==========================================
      // Only Get Current User Notifications
      //
      // Admin does NOT automatically get
      // other users' notifications
      // ==========================================

      const notifications =
        await Notification.find({
          userId:
            req.user._id,
        })
          .populate(
            "todoId",
            "title status dueDate"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      const unreadCount =
        await Notification.countDocuments(
          {
            userId:
              req.user._id,

            isRead: false,
          }
        );

      res.status(200).json({
        success: true,

        unreadCount,

        data:
          notifications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// Mark One Notification As Read
//
// PATCH /api/notifications/:id/read
// ==========================================

const markNotificationAsRead =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      // ==========================================
      // Validate Notification ID
      // ==========================================

      if (
        !isValidId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid notification ID",
          });
      }

      // ==========================================
      // Important:
      //
      // Find notification using BOTH:
      // _id
      // userId
      //
      // User cannot access another user's
      // notification
      // ==========================================

      const notification =
        await Notification.findOne(
          {
            _id: id,

            userId:
              req.user._id,
          }
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Notification not found",
          });
      }

      notification.isRead =
        true;

      await notification.save();

      res.status(200).json({
        success: true,

        message:
          "Notification marked as read",

        data:
          notification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

// ==========================================
// Mark All Notifications As Read
//
// PATCH /api/notifications/read-all
// ==========================================

const markAllNotificationsAsRead =
  async (
    req,
    res
  ) => {
    try {
      // ==========================================
      // Only Current User Notifications
      // ==========================================

      const result =
        await Notification.updateMany(
          {
            userId:
              req.user._id,

            isRead: false,
          },
          {
            $set: {
              isRead: true,
            },
          }
        );

      res.status(200).json({
        success: true,

        message:
          "All notifications marked as read",

        modifiedCount:
          result.modifiedCount,
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

module.exports = {
  getNotifications,

  markNotificationAsRead,

  markAllNotificationsAsRead,
};