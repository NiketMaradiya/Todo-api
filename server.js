const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB =
  require("./config/db");

const todoRoutes =
  require("./routes/todoRoutes");

const authRoutes =
  require("./routes/authRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const app = express();

// Database connection
connectDB();

// Middleware
app.use(cors());

app.use(express.json());

// Home
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Todo
app.use(
  "/api/todos",
  todoRoutes
);

// Admin
app.use(
  "/api/admin",
  adminRoutes
);

if (require.main === module) {
  const PORT =
    process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT}`
    );
  });
}

module.exports = app;