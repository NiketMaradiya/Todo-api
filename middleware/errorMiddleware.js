const notFound = (req, res, next) => {
  res.status(404);

  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  next(error);
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode =
    res.statusCode === 200
      ? 500
      : res.statusCode;

  if (err.name === "ValidationError") {
    statusCode = 400;
  }

  if (err.name === "CastError") {
    statusCode = 400;
  }

  if (err.code === 11000) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message:
      err.message || "Internal Server Error",
  });
};

module.exports = {
  notFound,
  errorHandler,
};