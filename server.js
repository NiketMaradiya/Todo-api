require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());

app.use(express.json());

/*
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/admin", adminRoutes);

/*
 * Health check
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Todo API is running",
  });
});

/*
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
 * Start server only when this file is executed directly.
 *
 * This is important for Jest.
 */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Server startup failed:");
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = app;