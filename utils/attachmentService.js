const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinary");

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads"
);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ensureUploadDirectory = async () => {
  await fs.mkdir(UPLOAD_DIR, {
    recursive: true,
  });
};

const uploadImageToCloudinary = (
  file
) => {
  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              "todo-api/attachments",
            resource_type: "image",
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

      uploadStream.end(
        file.buffer
      );
    }
  );
};

const saveDocumentLocally = async (
  file
) => {
  await ensureUploadDirectory();

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const randomName = `${Date.now()}-${crypto
    .randomBytes(12)
    .toString(
      "hex"
    )}${extension}`;

  const filePath = path.join(
    UPLOAD_DIR,
    randomName
  );

  await fs.writeFile(
    filePath,
    file.buffer
  );

  return `/uploads/${randomName}`;
};

const uploadAttachmentFile = async (
  file
) => {
  if (!file) {
    return null;
  }

  // Images -> Cloudinary
  if (
    IMAGE_MIME_TYPES.has(
      file.mimetype
    )
  ) {
    if (
      !isCloudinaryConfigured()
    ) {
      throw new Error(
        "Cloudinary is not configured. Add your real CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET values to .env"
      );
    }

    const result =
      await uploadImageToCloudinary(
        file
      );

    return result.secure_url;
  }

  // PDF/DOC/DOCX -> local public/uploads
  return saveDocumentLocally(
    file
  );
};

module.exports = {
  uploadAttachmentFile,
};