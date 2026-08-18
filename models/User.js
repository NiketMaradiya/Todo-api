const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // User Name
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // Email
    // ==========================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================
    // Password
    // ==========================================

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // ==========================================
    // Role
    // ==========================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ==========================================
    // Account Status
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // Force Password Change
    //
    // New users receive a temporary password.
    // They must change it after first login.
    // ==========================================

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // Password Changed Date
    // ==========================================

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // Password Reset Token
    //
    // Only hashed token is stored in database.
    // ==========================================

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    // ==========================================
    // Password Reset Token Expiry
    // ==========================================

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // ==========================================
    // Last Login Information
    // ==========================================

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastLoginIp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// DATABASE INDEXING
// ==========================================

// `unique: true` on the schema field already
// creates the unique email index.
userSchema.index({
  createdAt: -1,
});

// ==========================================
// Hash Password Before Saving
// ==========================================

userSchema.pre(
  "save",
  async function () {
    if (!this.isModified("password")) {
      return;
    }

    this.password =
      await bcrypt.hash(
        this.password,
        10
      );
  }
);

// ==========================================
// Compare Password
// ==========================================

userSchema.methods.comparePassword =
  async function (password) {
    return bcrypt.compare(
      password,
      this.password
    );
  };

// ==========================================
// Create Password Reset Token
// ==========================================

userSchema.methods.createPasswordResetToken =
  function () {
    const resetToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    this.passwordResetToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.passwordResetExpires =
      Date.now() +
      15 * 60 * 1000;

    return resetToken;
  };

module.exports =
  mongoose.model(
    "User",
    userSchema
  );