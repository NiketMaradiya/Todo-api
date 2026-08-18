const User =
  require("../models/User");

const jwt =
  require("jsonwebtoken");

const crypto =
  require("crypto");

const {
  generateTemporaryPassword,
} = require(
  "../utils/passwordService"
);

const {
  sendWelcomePasswordEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require(
  "../utils/emailService"
);

// ==========================================
// Generate JWT Token
// ==========================================

const generateToken =
  (user) => {

    return jwt.sign(
      {
        id:
          user._id.toString(),

        role:
          user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn:
          process.env.JWT_EXPIRE ||
          process.env.JWT_EXPIRES_IN ||
          "7d",
      }
    );
  };

// ==========================================
// Get Client IP
// ==========================================

const getClientIp =
  (req) => {

    const forwarded =
      req.headers[
        "x-forwarded-for"
      ];

    if (forwarded) {
      return forwarded
        .split(",")[0]
        .trim();
    }

    return (
      req.ip ||
      req.socket?.remoteAddress ||
      "Unknown"
    );
  };

// ==========================================
// REGISTER
// POST /api/auth/register
//
// Flow:
//
// 1. Validate input
// 2. Check existing user
// 3. Generate temporary password
// 4. Create user
// 5. Set mustChangePassword = true
// 6. Send temporary password email
// 7. If email fails, remove user
// ==========================================

const register =
  async (
    req,
    res
  ) => {

    try {

      const {
        name,
        email,
      } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (
        !name ||
        !email
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Name and email are required",
          });
      }

      const normalizedName =
        name.trim();

      const normalizedEmail =
        email
          .toLowerCase()
          .trim();

      if (
        !normalizedName
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Name is required",
          });
      }

      // --------------------------------------
      // Check Existing User
      // --------------------------------------

      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (
        existingUser
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "User already exists. Please login with your existing account.",
          });
      }

      // --------------------------------------
      // Generate Temporary Password
      // --------------------------------------

      const temporaryPassword =
        generateTemporaryPassword();

      // --------------------------------------
      // Create User
      // --------------------------------------

      const user =
        await User.create({
          name:
            normalizedName,

          email:
            normalizedEmail,

          password:
            temporaryPassword,

          role:
            "user",

          isActive:
            true,

          mustChangePassword:
            true,

          passwordChangedAt:
            null,
        });

      // --------------------------------------
      // Send Temporary Password Email
      // --------------------------------------

      try {

        await sendWelcomePasswordEmail({
          name:
            user.name,

          email:
            user.email,

          temporaryPassword,
        });

      } catch (
        emailError
      ) {

        console.error(
          "WELCOME EMAIL ERROR:"
        );

        console.error(
          emailError.message
        );

        // ------------------------------------
        // IMPORTANT:
        // Delete user if email failed.
        // ------------------------------------

        try {

          await User.findByIdAndDelete(
            user._id
          );

        } catch (
          deleteError
        ) {

          console.error(
            "FAILED TO ROLLBACK USER:"
          );

          console.error(
            deleteError.message
          );
        }

        return res
          .status(500)
          .json({
            success: false,

            message:
              "Registration failed because the temporary password email could not be sent. Please check your email configuration and try again.",
          });
      }

      // --------------------------------------
      // Registration Successful
      // --------------------------------------

      return res
        .status(201)
        .json({
          success: true,

          message:
            "New user created successfully. A temporary password has been sent to the registered email. Password change is required after first login.",

          data: {

            _id:
              user._id.toString(),

            name:
              user.name,

            email:
              user.email,

            role:
              user.role,

            isActive:
              user.isActive,

            mustChangePassword:
              user.mustChangePassword,
          },
        });

    } catch (
      error
    ) {

      console.error(
        "REGISTER ERROR:"
      );

      console.error(
        error.message
      );

      if (
        error.code === 11000
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "User already exists",
          });
      }

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Registration failed",
        });
    }
  };

// ==========================================
// LOGIN
// POST /api/auth/login
//
// If temporary password:
//
// mustChangePassword = true
//
// JWT is still returned because the user
// needs the JWT to call change-password.
// ==========================================

const login =
  async (
    req,
    res
  ) => {

    try {

      const {
        email,
        password,
      } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Email and password are required",
          });
      }

      const normalizedEmail =
        email
          .toLowerCase()
          .trim();

      // --------------------------------------
      // Find User
      // --------------------------------------

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        }).select(
          "+password"
        );

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid email or password",
          });
      }

      // --------------------------------------
      // Account Status
      // --------------------------------------

      if (
        user.isActive === false
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Your account has been disabled",
          });
      }

      // --------------------------------------
      // Verify Password
      // --------------------------------------

      const isPasswordCorrect =
        await user.comparePassword(
          password
        );

      if (
        !isPasswordCorrect
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid email or password",
          });
      }

      // --------------------------------------
      // Login Information
      // --------------------------------------

      const loginIp =
        getClientIp(req);

      const loginTime =
        new Date();

      user.lastLoginAt =
        loginTime;

      user.lastLoginIp =
        loginIp;

      await user.save({
        validateBeforeSave:
          false,
      });

      // --------------------------------------
      // Generate JWT
      // --------------------------------------

      const token =
        generateToken(user);

      // --------------------------------------
      // Login Notification Email
      //
      // Email failure must NOT prevent login.
      // --------------------------------------

      try {

        await sendLoginNotificationEmail({
          name:
            user.name,

          email:
            user.email,

          loginTime:
            loginTime.toLocaleString(),

          ipAddress:
            loginIp,
        });

      } catch (
        emailError
      ) {

        console.error(
          "LOGIN EMAIL ERROR:"
        );

        console.error(
          emailError.message
        );
      }

      // --------------------------------------
      // Response
      // --------------------------------------

      return res
        .status(200)
        .json({
          success: true,

          message:
            user.mustChangePassword
              ? "Login successful. You must change your temporary password before continuing."
              : "Login successful",

          token,

          data: {

            _id:
              user._id.toString(),

            name:
              user.name,

            email:
              user.email,

            role:
              user.role,

            isActive:
              user.isActive,

            mustChangePassword:
              user.mustChangePassword,

            lastLoginAt:
              user.lastLoginAt,

            lastLoginIp:
              user.lastLoginIp,
          },
        });

    } catch (
      error
    ) {

      console.error(
        "LOGIN ERROR:"
      );

      console.error(
        error.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Login failed",
        });
    }
  };

// ==========================================
// CHANGE PASSWORD
// PATCH /api/auth/change-password
//
// IMPORTANT:
//
// Do NOT add requirePasswordChanged here.
//
// First-login users MUST be able to call this.
// ==========================================

const changePassword =
  async (
    req,
    res
  ) => {

    try {

      const {
        currentPassword,
        newPassword,
      } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Current password and new password are required",
          });
      }

      if (
        newPassword.length < 6
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "New password must be at least 6 characters long",
          });
      }

      if (
        currentPassword ===
        newPassword
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "New password must be different from current password",
          });
      }

      // --------------------------------------
      // Get User With Password
      // --------------------------------------

      const user =
        await User.findById(
          req.user._id
        ).select(
          "+password"
        );

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "User not found",
          });
      }

      // --------------------------------------
      // Verify Current Password
      // --------------------------------------

      const isPasswordCorrect =
        await user.comparePassword(
          currentPassword
        );

      if (
        !isPasswordCorrect
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Current password is incorrect",
          });
      }

      // --------------------------------------
      // Update Password
      // --------------------------------------

      user.password =
        newPassword;

      user.mustChangePassword =
        false;

      user.passwordChangedAt =
        new Date();

      await user.save();

      // --------------------------------------
      // Confirmation Email
      // --------------------------------------

      try {

        await sendPasswordChangedEmail({
          name:
            user.name,

          email:
            user.email,
        });

      } catch (
        emailError
      ) {

        console.error(
          "PASSWORD CHANGED EMAIL ERROR:"
        );

        console.error(
          emailError.message
        );
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Password changed successfully. You can now access the application.",
        });

    } catch (
      error
    ) {

      console.error(
        "CHANGE PASSWORD ERROR:"
      );

      console.error(
        error.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Password change failed",
        });
    }
  };

// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ==========================================

const forgotPassword =
  async (
    req,
    res
  ) => {

    try {

      const {
        email,
      } = req.body;

      if (!email) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Email is required",
          });
      }

      const normalizedEmail =
        email
          .toLowerCase()
          .trim();

      // --------------------------------------
      // Find User
      // --------------------------------------

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        }).select(
          "+passwordResetToken +passwordResetExpires"
        );

      // --------------------------------------
      // Do Not Reveal Account Existence
      // --------------------------------------

      if (!user) {
        return res
          .status(200)
          .json({
            success: true,

            message:
              "If an account exists with this email, a password reset link has been sent.",
          });
      }

      // --------------------------------------
      // Generate Reset Token
      // --------------------------------------

      const resetToken =
        user.createPasswordResetToken();

      await user.save({
        validateBeforeSave:
          false,
      });

      // --------------------------------------
      // Create Reset URL
      // --------------------------------------

      const clientUrl =
        process.env.CLIENT_URL ||
        "http://localhost:3000";

      const resetUrl =
        `${clientUrl}/reset-password/${resetToken}`;

      // --------------------------------------
      // Send Reset Email
      // --------------------------------------

      try {

        await sendPasswordResetEmail({
          name:
            user.name,

          email:
            user.email,

          resetUrl,
        });

      } catch (
        emailError
      ) {

        // ------------------------------------
        // Remove reset token if email failed
        // ------------------------------------

        user.passwordResetToken =
          null;

        user.passwordResetExpires =
          null;

        await user.save({
          validateBeforeSave:
            false,
        });

        console.error(
          "FORGOT PASSWORD EMAIL ERROR:"
        );

        console.error(
          emailError.message
        );

        return res
          .status(500)
          .json({
            success: false,

            message:
              "Password reset email could not be sent. Please try again later.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "If an account exists with this email, a password reset link has been sent.",
        });

    } catch (
      error
    ) {

      console.error(
        "FORGOT PASSWORD ERROR:"
      );

      console.error(
        error.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Password reset request failed",
        });
    }
  };

// ==========================================
// RESET PASSWORD
// PATCH /api/auth/reset-password/:token
// ==========================================

const resetPassword =
  async (
    req,
    res
  ) => {

    try {

      const {
        token,
      } = req.params;

      const {
        newPassword,
      } = req.body;

      // --------------------------------------
      // Validation
      // --------------------------------------

      if (!token) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Reset token is required",
          });
      }

      if (!newPassword) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "New password is required",
          });
      }

      if (
        newPassword.length < 6
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "New password must be at least 6 characters long",
          });
      }

      // --------------------------------------
      // Hash Reset Token
      // --------------------------------------

      const hashedToken =
        crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

      // --------------------------------------
      // Find Valid Token
      // --------------------------------------

      const user =
        await User.findOne({
          passwordResetToken:
            hashedToken,

          passwordResetExpires: {
            $gt:
              Date.now(),
          },
        }).select(
          "+passwordResetToken +passwordResetExpires"
        );

      if (!user) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Password reset token is invalid or has expired",
          });
      }

      // --------------------------------------
      // Reset Password
      // --------------------------------------

      user.password =
        newPassword;

      user.passwordResetToken =
        null;

      user.passwordResetExpires =
        null;

      user.mustChangePassword =
        false;

      user.passwordChangedAt =
        new Date();

      await user.save();

      // --------------------------------------
      // Confirmation Email
      // --------------------------------------

      try {

        await sendPasswordChangedEmail({
          name:
            user.name,

          email:
            user.email,
        });

      } catch (
        emailError
      ) {

        console.error(
          "RESET CONFIRMATION EMAIL ERROR:"
        );

        console.error(
          emailError.message
        );
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Password reset successfully. You can now login with your new password.",
        });

    } catch (
      error
    ) {

      console.error(
        "RESET PASSWORD ERROR:"
      );

      console.error(
        error.message
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Password reset failed",
        });
    }
  };

// ==========================================
// LOGOUT
// POST /api/auth/logout
// ==========================================

const logout =
  async (
    req,
    res
  ) => {

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Logout successful",
      });
  };

// ==========================================
// GET PROFILE
// GET /api/auth/profile
//
// Profile is intentionally NOT protected by
// requirePasswordChanged.
//
// Frontend needs mustChangePassword to know
// whether it should show the change-password
// screen.
// ==========================================

const getProfile =
  async (
    req,
    res
  ) => {

    try {

      const user =
        req.user;

      return res
        .status(200)
        .json({
          success: true,

          data: {

            _id:
              user._id.toString(),

            name:
              user.name,

            email:
              user.email,

            role:
              user.role,

            isActive:
              user.isActive,

            mustChangePassword:
              user.mustChangePassword,

            passwordChangedAt:
              user.passwordChangedAt,

            lastLoginAt:
              user.lastLoginAt,

            lastLoginIp:
              user.lastLoginIp,
          },
        });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Could not load profile",
        });
    }
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
};