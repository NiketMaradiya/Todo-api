const {
  getStoredCloudinaryConfig,
  createCloudinaryConfig,
  updateCloudinaryConfig,
  deleteCloudinaryConfig,
  toPublicCloudinaryConfig,
} = require(
  "../utils/cloudinaryConfigService"
);

const cleanRequiredString =
  (value) => {
    if (
      typeof value !==
        "string" ||
      !value.trim()
    ) {
      return null;
    }

    return value.trim();
  };

// ==========================================
// POST /api/admin/cloudinary
// ==========================================

const createAdminCloudinaryConfig =
  async (
    req,
    res
  ) => {
    try {
      const cloudName =
        cleanRequiredString(
          req.body.cloudName
        );

      const apiKey =
        cleanRequiredString(
          req.body.apiKey
        );

      const apiSecret =
        cleanRequiredString(
          req.body.apiSecret
        );

      if (
        !cloudName ||
        !apiKey ||
        !apiSecret
      ) {
        return res.status(400).json({
          success: false,
          message:
            "cloudName, apiKey and apiSecret are required",
        });
      }

      const existing =
        await getStoredCloudinaryConfig();

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "Cloudinary configuration already exists. Use PUT to update it.",
        });
      }

      const config =
        await createCloudinaryConfig({
          cloudName,
          apiKey,
          apiSecret,
        });

      return res.status(201).json({
        success: true,

        message:
          "Cloudinary configuration saved successfully",

        data:
          toPublicCloudinaryConfig(
            config
          ),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// GET /api/admin/cloudinary
// ==========================================

const getAdminCloudinaryConfig =
  async (
    req,
    res
  ) => {
    try {
      const config =
        await getStoredCloudinaryConfig();

      if (!config) {
        return res.status(404).json({
          success: false,
          message:
            "Cloudinary configuration not found",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          toPublicCloudinaryConfig(
            config
          ),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// PUT /api/admin/cloudinary
// ==========================================

const updateAdminCloudinaryConfig =
  async (
    req,
    res
  ) => {
    try {
      const config =
        await getStoredCloudinaryConfig();

      if (!config) {
        return res.status(404).json({
          success: false,
          message:
            "Cloudinary configuration not found",
        });
      }

      const updates = {};

      if (
        req.body.cloudName !==
        undefined
      ) {
        const cloudName =
          cleanRequiredString(
            req.body.cloudName
          );

        if (!cloudName) {
          return res.status(400).json({
            success: false,
            message:
              "cloudName must be a non-empty string",
          });
        }

        updates.cloudName =
          cloudName;
      }

      if (
        req.body.apiKey !==
        undefined
      ) {
        const apiKey =
          cleanRequiredString(
            req.body.apiKey
          );

        if (!apiKey) {
          return res.status(400).json({
            success: false,
            message:
              "apiKey must be a non-empty string",
          });
        }

        updates.apiKey =
          apiKey;
      }

      if (
        req.body.apiSecret !==
        undefined
      ) {
        const apiSecret =
          cleanRequiredString(
            req.body.apiSecret
          );

        if (
          !apiSecret ||
          apiSecret ===
            "********"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Send a real apiSecret or omit apiSecret to keep the existing secret",
          });
        }

        updates.apiSecret =
          apiSecret;
      }

      if (
        Object.keys(
          updates
        ).length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Provide at least one field to update",
        });
      }

      await updateCloudinaryConfig(
        config,
        updates
      );

      return res.status(200).json({
        success: true,

        message:
          "Cloudinary configuration updated successfully",

        data:
          toPublicCloudinaryConfig(
            config
          ),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// DELETE /api/admin/cloudinary
// ==========================================

const deleteAdminCloudinaryConfig =
  async (
    req,
    res
  ) => {
    try {
      const deleted =
        await deleteCloudinaryConfig();

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message:
            "Cloudinary configuration not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Cloudinary configuration deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

module.exports = {
  createAdminCloudinaryConfig,
  getAdminCloudinaryConfig,
  updateAdminCloudinaryConfig,
  deleteAdminCloudinaryConfig,
};