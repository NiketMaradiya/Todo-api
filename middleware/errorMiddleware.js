const multer = require("multer");

// ==========================================
// 404 Handler
// ==========================================

const notFound = (
  req,
  res,
  next
) => {
  const error =
    new Error(
      `Route not found: ${req.method} ${req.originalUrl}`
    );

  res.status(404);

  next(error);
};

// ==========================================
// Global Error Handler
// ==========================================

const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error(
    err
  );

  let statusCode =
    res.statusCode &&
    res.statusCode !==
      200
      ? res.statusCode
      : 500;

  let message =
    err.message ||
    "Internal Server Error";

  // ==========================================
  // Multer Errors
  // ==========================================

  if (
    err instanceof
    multer.MulterError
  ) {
    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {
      statusCode = 413;

      message =
        "File too large. Maximum file size is 5 MB";
    } else if (
      err.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      statusCode = 400;

      message =
        'Unexpected file field. Use the field name "attachment"';
    } else if (
      err.code ===
      "LIMIT_FILE_COUNT"
    ) {
      statusCode = 400;

      message =
        "Only one attachment is allowed";
    } else {
      statusCode = 400;
    }
  }

  // ==========================================
  // Unsupported File Type
  // ==========================================

  if (
    err.code ===
    "UNSUPPORTED_FILE_TYPE"
  ) {
    statusCode = 400;

    message =
      "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC and DOCX";
  }

  // ==========================================
  // Mongoose Errors
  // ==========================================

  if (
    err.name ===
    "ValidationError"
  ) {
    statusCode = 400;
  }

  if (
    err.name ===
    "CastError"
  ) {
    statusCode = 400;
  }

  if (
    err.code === 11000
  ) {
    statusCode = 400;
  }

  // ==========================================
  // Response
  // ==========================================

  res
    .status(
      statusCode
    )
    .json({
      success: false,
      message,
    });
};

module.exports = {
  notFound,
  errorHandler,
};