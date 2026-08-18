const {
  getCloudinaryClient,
} = require(
  "../config/cloudinary"
);

// ==========================================
// Upload Attachment To Cloudinary
// ==========================================

const uploadAttachmentToCloudinary =
  async (file) => {
    if (
      !file ||
      !file.buffer
    ) {
      throw new Error(
        "Invalid attachment file"
      );
    }

    // IMPORTANT:
    // This now loads the credentials from MongoDB,
    // decrypts them using CONFIG_ENCRYPTION_KEY,
    // and configures Cloudinary.
    const cloudinary =
      await getCloudinaryClient();

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                "todo-api/attachments",

              resource_type:
                "auto",
            },

            (
              error,
              result
            ) => {
              if (error) {
                return reject(
                  error
                );
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

    return uploadAttachmentToCloudinary(
      file
    );
  };

module.exports = {
  uploadAttachmentFile,
};