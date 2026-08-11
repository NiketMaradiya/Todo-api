// 404 Not Found Middleware
const notFound = (req, res, next) => {
  res.status(404);

  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
  }

  // Mongoose Cast Error
  if (err.name === "CastError") {
    statusCode = 400;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal Server Error"
        : err.message || "Something went wrong",
  });
};

module.exports = {
  notFound,
  errorHandler,
};