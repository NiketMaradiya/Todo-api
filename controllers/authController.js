const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// Generate JWT Token
// ==========================================

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// ==========================================
// Register User
// POST /api/auth/register
// ==========================================

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } =
      req.body || {};

    // Validate name
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name must be a string",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email must be a string",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // Basic email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
      });
    }

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password must be a string",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with this email",
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Login User
// POST /api/auth/login
// ==========================================

const loginUser = async (req, res, next) => {
  try {
    const { email, password } =
      req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordCorrect =
      await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Logout User
// POST /api/auth/logout
// ==========================================

const logoutUser = async (req, res, next) => {
  try {
    /*
      JWT is stateless.

      The client must delete the token
      from localStorage, cookies, etc.
    */

    res.status(200).json({
      success: true,
      message:
        "Logout successful. Please remove the token from the client.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Profile
// GET /api/profile
// ==========================================

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
};