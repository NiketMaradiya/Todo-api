require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { setupSwagger } = require("./config/swagger");

const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

// ==========================================
// Global Middleware
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// Swagger API Documentation
// ==========================================

setupSwagger(app);

// ==========================================
// Routes
// ==========================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Todos
//
// Includes:
// - Todo CRUD
// - Comments
// - Attachments
// - Status
// - Activity / Audit Log
//
// GET /api/todos/:id/activity
//
app.use(
  "/api/todos",
  todoRoutes
);

// Admin
//
// Includes:
// - Admin users
// - Admin Todo access
// - Trash
// - Restore
//
// PATCH /api/admin/todos/:id/restore
//
app.use(
  "/api/admin",
  adminRoutes
);

// Notifications
app.use(
  "/api/notifications",
  notificationRoutes
);

// ==========================================
// Health Check
// ==========================================

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,

      message:
        "Todo API is running",
    });
  }
);

// ==========================================
// 404 Handler
// ==========================================

app.use(
  notFound
);

// ==========================================
// Global Error Handler
// ==========================================

app.use(
  errorHandler
);

// ==========================================
// Start Server
// ==========================================

if (
  require.main === module
) {
  const PORT =
    process.env.PORT ||
    5000;

  connectDB()
    .then(() => {
      app.listen(
        PORT,
        () => {
          console.log(
            `Server running on port ${PORT}`
          );
        }
      );
    })
    .catch(
      (error) => {
        console.error(
          "Server startup failed:"
        );

        console.error(
          error.message
        );

        process.exit(1);
      }
    );
}

module.exports = app;