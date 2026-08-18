const cloudinary = require("cloudinary").v2;

const {
  getDecryptedCloudinaryConfig,
} = require("../utils/cloudinaryConfigService");

// ==========================================
// Configure Cloudinary from MongoDB
// ==========================================
//
// Cloudinary credentials are NOT read from .env.
//
// They are:
// MongoDB
//   ↓
// Encrypted API key / secret
//   ↓
// CONFIG_ENCRYPTION_KEY
//   ↓
// Decrypted credentials
//   ↓
// Cloudinary SDK
//
// ==========================================

const configureCloudinaryFromDatabase =
  async () => {
    const config =
      await getDecryptedCloudinaryConfig();

    if (!config) {
      throw new Error(
        "Cloudinary is not configured. Please create the Cloudinary configuration using POST /api/admin/cloudinary."
      );
    }

    if (
      !config.cloudName ||
      !config.apiKey ||
      !config.apiSecret
    ) {
      throw new Error(
        "Cloudinary configuration is incomplete."
      );
    }

    cloudinary.config({
      cloud_name:
        config.cloudName,

      api_key:
        config.apiKey,

      api_secret:
        config.apiSecret,

      secure: true,

      timeout: 60000,
    });

    return config;
  };

// ==========================================
// Check Cloudinary configuration
// ==========================================

const isCloudinaryConfigured =
  async () => {
    try {
      const config =
        await getDecryptedCloudinaryConfig();

      return Boolean(
        config &&
          config.cloudName &&
          config.apiKey &&
          config.apiSecret
      );
    } catch (error) {
      console.error(
        "Cloudinary configuration check failed:",
        error.message
      );

      return false;
    }
  };

// ==========================================
// Get Cloudinary client
// ==========================================

const getCloudinaryClient =
  async () => {
    await configureCloudinaryFromDatabase();

    return cloudinary;
  };

// ==========================================
// Export
// ==========================================

module.exports = {
  cloudinary,

  configureCloudinaryFromDatabase,

  isCloudinaryConfigured,

  getCloudinaryClient,
};