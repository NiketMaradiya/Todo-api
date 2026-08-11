require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const todoRoutes = require("./routes/todoRoutes");

const app = express();

// Connect MongoDB
connectDB();

// JSON middleware
app.use(express.json());

// Rate limiter
// Maximum 20 requests per IP in 1 minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,

  message: {
    success: false,
    message: "Too many requests. Please try again later."
  },

  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limit to API
app.use("/api", limiter);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Todo API is Running 🚀"
  });
});

// Todo routes
app.use("/api/todos", todoRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});