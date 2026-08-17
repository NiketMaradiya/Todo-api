const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");

// ==========================================
// Upload Attachment To Cloudinary
// ==========================================

const uploadAttachmentToCloudinary = (
  file
) => {
  return new Promise(
    (resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(
          new Error(
            "Invalid attachment file"
          )
        );
      }

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "todo-api/attachments",

            resource_type:
              "auto",
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

            resolve({
              url:
                result.secure_url,

              public_id:
                result.public_id ||
                null,

              resource_type:
                result.resource_type ||
                null,

              format:
                result.format ||
                null,

              original_filename:
                result.original_filename ||
                file.originalname ||
                null,
            });
          }
        );

      uploadStream.on(
        "error",
        reject
      );

      uploadStream.end(
        file.buffer
      );
    }
  );
};

// ==========================================
// Main Attachment Function
// ==========================================

const uploadAttachmentFile =
  async (file) => {
    if (!file) {
      throw new Error(
        "Attachment file is required"
      );
    }

    if (
      !isCloudinaryConfigured()
    ) {
      throw new Error(
        "Cloudinary is not configured. Add your real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET values to .env"
      );
    }

    return await uploadAttachmentToCloudinary(
      file
    );
  };

module.exports = {
  uploadAttachmentFile,
};