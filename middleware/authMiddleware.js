const jwt =
  require("jsonwebtoken");

const User =
  require("../models/User");

// ==========================================
// Authentication Middleware
// ==========================================

const protect =
  async (
    req,
    res,
    next
  ) => {
    try {
      let token;

      // --------------------------------------
      // Get Bearer Token
      // --------------------------------------

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith(
          "Bearer "
        )
      ) {
        token =
          req.headers.authorization
            .split(" ")[1];
      }

      // --------------------------------------
      // Token Required
      // --------------------------------------

      if (!token) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Unauthorized. Token not provided.",
          });
      }

      // --------------------------------------
      // Verify JWT
      // --------------------------------------

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      // --------------------------------------
      // Find User
      // --------------------------------------

      const user =
        await User.findById(
          decoded.id
        );

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Unauthorized. User not found.",
          });
      }

      // --------------------------------------
      // Check Account Status
      // --------------------------------------

      if (
        user.isActive === false
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Your account has been disabled.",
          });
      }

      // --------------------------------------
      // Attach User
      // --------------------------------------

      req.user =
        user;

      next();

    } catch (
      error
    ) {

      return res
        .status(401)
        .json({
          success: false,

          message:
            "Unauthorized. Invalid or expired token.",
        });
    }
  };

// ==========================================
// Require Password Changed
//
// IMPORTANT:
//
// This middleware blocks users who have:
// mustChangePassword === true
//
// They can still use:
//
// - /change-password
// - /logout
// - /profile
//
// because those routes do NOT use this
// middleware.
//
// They cannot use:
//
// - Todo APIs
// - Notification APIs
// - Admin APIs
// ==========================================

const requirePasswordChanged =
  (
    req,
    res,
    next
  ) => {

    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,

          message:
            "Unauthorized. Authentication required.",
        });
    }

    if (
      req.user.mustChangePassword === true
    ) {
      return res
        .status(403)
        .json({
          success: false,

          mustChangePassword:
            true,

          message:
            "You must change your temporary password before accessing this resource.",
        });
    }

    next();
  };

// ==========================================
// Role Authorization Middleware
// ==========================================

const authorize =
  (...roles) => {

    return (
      req,
      res,
      next
    ) => {

      if (!req.user) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Unauthorized. Authentication required.",
          });
      }

      if (
        !roles.includes(
          req.user.role
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Forbidden. You do not have permission to access this resource.",
          });
      }

      next();
    };
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  protect,
  requirePasswordChanged,
  authorize,
};