const multer = require("multer");
const path = require("path");

// Maximum attachment size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Supported file extensions.
const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
]);

// Supported MIME types.
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    !allowedExtensions.has(extension) ||
    !allowedMimeTypes.has(file.mimetype)
  ) {
    const error = new Error(
      "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC and DOCX"
    );

    error.code = "UNSUPPORTED_FILE_TYPE";

    return cb(error);
  }

  cb(null, true);
};

const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

module.exports = {
  uploadAttachment,
  MAX_FILE_SIZE,
  allowedExtensions,
  allowedMimeTypes,
};