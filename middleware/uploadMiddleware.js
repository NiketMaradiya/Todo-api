const multer = require("multer");
const path = require("path");

// ==========================================
// Maximum Attachment Size
// ==========================================

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

// ==========================================
// Allowed File Extensions
// ==========================================

const allowedExtensions =
  new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
  ]);

// ==========================================
// Allowed MIME Types
// ==========================================

const allowedMimeTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

// ==========================================
// Multer Storage
// ==========================================
//
// Keep uploaded file in memory temporarily.
// The file will then be sent to Cloudinary.
//

const storage =
  multer.memoryStorage();

// ==========================================
// File Validation
// ==========================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const extension = path
    .extname(
      file.originalname
    )
    .toLowerCase();

  const isValidExtension =
    allowedExtensions.has(
      extension
    );

  const isValidMimeType =
    allowedMimeTypes.has(
      file.mimetype
    );

  if (
    !isValidExtension ||
    !isValidMimeType
  ) {
    const error = new Error(
      "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, PDF, DOC and DOCX"
    );

    error.code =
      "UNSUPPORTED_FILE_TYPE";

    return cb(error);
  }

  cb(null, true);
};

// ==========================================
// Multer Upload Configuration
// ==========================================

const uploadAttachment =
  multer({
    storage,

    limits: {
      fileSize:
        MAX_FILE_SIZE,

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