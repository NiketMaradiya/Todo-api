const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const logger = require("./middleware/logger");

dotenv.config();

// ==========================================
// Environment Variables
// ==========================================

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing from .env");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// ==========================================
// Express App
// ==========================================

const app = express();

// ==========================================
// Security Middleware
// ==========================================

app.use(helmet());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// ==========================================
// Logging
// ==========================================

app.use(logger);

// ==========================================
// Body Parser
// ==========================================

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);

// ==========================================
// Database
// ==========================================

connectDB();

// ==========================================
// Routes
// ==========================================

const todoRoutes = require("./routes/todoRoutes");

app.use("/api/todos", todoRoutes);

// ==========================================
// Health Check
// ==========================================

app.get("/health", async (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    server: "running",
    database: databaseConnected
      ? "connected"
      : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API Information
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Todo API is Running 🚀",
    version: "1.0.0",
    endpoints: {
      todos: "/api/todos",
      health: "/health",
    },
  });
});

// ==========================================
// 404 Handler
// ==========================================

app.use(notFound);

// ==========================================
// Global Error Handler
// ==========================================

app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================

let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );
  });

  // ==========================================
  // Graceful Shutdown
  // ==========================================

  const shutdown = async (signal) => {
    console.log(
      `\n${signal} received. Shutting down...`
    );

    if (server) {
      server.close(async () => {
        try {
          await mongoose.connection.close();

          console.log("✅ MongoDB connection closed");
          console.log("✅ Server closed");

          process.exit(0);
        } catch (error) {
          console.error(
            "❌ Shutdown error:",
            error.message
          );

          process.exit(1);
        }
      });
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Export app for Jest/Supertest
module.exports = app;
