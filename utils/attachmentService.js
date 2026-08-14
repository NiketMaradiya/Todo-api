const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");

// ==========================================
// Upload Any Attachment To Cloudinary
// ==========================================

const uploadAttachmentToCloudinary = (
  file
) => {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "todo-api/attachments",

            // Cloudinary automatically detects
            // whether the file is an image,
            // PDF or another supported document.
            resource_type: "auto",
          },

          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (
              !result ||
              !result.secure_url
            ) {
              return reject(
                new Error(
                  "Cloudinary upload completed but no secure URL was returned"
                )
              );
            }

            resolve(result);
          }
        );

      uploadStream.on(
        "error",
        reject
      );

      // Multer uses memoryStorage(),
      // so file.buffer contains the uploaded file.
      uploadStream.end(
        file.buffer
      );
    }
  );
};

// ==========================================
// Main Attachment Function
// ==========================================

const uploadAttachmentFile = async (
  file
) => {
  if (!file) {
    return null;
  }

  // Check Cloudinary configuration.
  if (
    !isCloudinaryConfigured()
  ) {
    throw new Error(
      "Cloudinary is not configured. Add your real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET values to .env"
    );
  }

  // Upload ALL supported files to Cloudinary.
  const result =
    await uploadAttachmentToCloudinary(
      file
    );

  return result.secure_url;
};

module.exports = {
  uploadAttachmentFile,
};