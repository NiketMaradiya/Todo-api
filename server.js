require("dotenv").config();

const express = require("express");
const rateLimit = require(
  "express-rate-limit"
);
const helmet = require("helmet");
const cors = require("cors");

const connectDB = require("./config/db");

const todoRoutes = require(
  "./routes/todoRoutes"
);

const authRoutes = require(
  "./routes/authRoutes"
);

const {
  getProfile,
} = require(
  "./controllers/authController"
);

const protect = require(
  "./middleware/authMiddleware"
);

const logger = require(
  "./middleware/logger"
);

const {
  notFound,
  errorHandler,
} = require(
  "./middleware/errorMiddleware"
);

const app = express();

// ==========================================
// Connect Database
// ==========================================

connectDB();

// ==========================================
// Middleware
// ==========================================

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(logger);

// ==========================================
// Rate Limiter
// 20 requests per IP per minute
// ==========================================

const limiter = rateLimit({
  windowMs: 60 * 1000,

  max: 20,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },

  standardHeaders: true,

  legacyHeaders: false,
});

// Apply rate limit
app.use("/api", limiter);

// ==========================================
// Health Check
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Todo API with JWT Authentication is Running 🚀",
  });
});

// ==========================================
// Authentication Routes
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

// ==========================================
// Profile Route
// Protected
// ==========================================

app.get(
  "/api/profile",
  protect,
  getProfile
);

// ==========================================
// Todo Routes
// All Protected
// ==========================================

app.use(
  "/api/todos",
  todoRoutes
);

// ==========================================
// 404 Handler
// ==========================================

app.use(notFound);

// ==========================================
// Global Error Handler
// ==========================================

app.use(errorHandler);

module.exports = app;

// ==========================================
// Start Server
// ==========================================

if (require.main === module) {
  const PORT =
    process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );
  });
}