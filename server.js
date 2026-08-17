require("dotenv").config();

const express =
  require("express");

const cors =
  require("cors");

const connectDB =
  require("./config/db");

const authRoutes =
  require("./routes/authRoutes");

const todoRoutes =
  require("./routes/todoRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const notificationRoutes =
  require(
    "./routes/notificationRoutes"
  );

const {
  notFound,

  errorHandler,
} = require(
  "./middleware/errorMiddleware"
);

const app =
  express();

// ==========================================
// Global Middleware
// ==========================================

app.use(
  cors()
);

app.use(
  express.json()
);

// ==========================================
// Routes
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/todos",
  todoRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

// ==========================================
// Notification Routes
// ==========================================

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
    res.status(200).json({
      success: true,

      message:
        "Todo API is running",
    });
  }
);

// ==========================================
// Error Handling
// ==========================================

app.use(
  notFound
);

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

module.exports =
  app;