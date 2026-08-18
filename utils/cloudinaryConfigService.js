const CloudinaryConfig =
  require(
    "../models/CloudinaryConfig"
  );

const {
  encrypt,
  decrypt,
} = require(
  "./encryptionService"
);

const getStoredCloudinaryConfig =
  async () => {
    return CloudinaryConfig.findOne()
      .select(
        "+apiKey +apiSecret"
      )
      .sort({
        updatedAt: -1,
      });
  };

const getDecryptedCloudinaryConfig =
  async () => {
    const config =
      await getStoredCloudinaryConfig();

    if (!config) {
      return null;
    }

    return {
      _id:
        config._id,

      cloudName:
        config.cloudName,

      apiKey:
        decrypt(
          config.apiKey
        ),

      apiSecret:
        decrypt(
          config.apiSecret
        ),

      createdAt:
        config.createdAt,

      updatedAt:
        config.updatedAt,
    };
  };

const createCloudinaryConfig =
  async ({
    cloudName,
    apiKey,
    apiSecret,
  }) => {
    return CloudinaryConfig.create({
      cloudName,

      apiKey:
        encrypt(
          apiKey
        ),

      apiSecret:
        encrypt(
          apiSecret
        ),
    });
  };

const updateCloudinaryConfig =
  async (
    config,
    {
      cloudName,
      apiKey,
      apiSecret,
    }
  ) => {
    if (
      cloudName !==
      undefined
    ) {
      config.cloudName =
        cloudName;
    }

    if (
      apiKey !==
      undefined
    ) {
      config.apiKey =
        encrypt(
          apiKey
        );
    }

    if (
      apiSecret !==
      undefined
    ) {
      config.apiSecret =
        encrypt(
          apiSecret
        );
    }

    await config.save();

    return config;
  };

const deleteCloudinaryConfig =
  async () => {
    return CloudinaryConfig.findOneAndDelete(
      {}
    );
  };

const toPublicCloudinaryConfig =
  (config) => {
    if (!config) {
      return null;
    }

    return {
      _id:
        config._id,

      cloudName:
        config.cloudName,

      apiKey:
        decrypt(
          config.apiKey
        ),

      apiSecret:
        "********",

      createdAt:
        config.createdAt,

      updatedAt:
        config.updatedAt,
    };
  };

module.exports = {
  getStoredCloudinaryConfig,
  getDecryptedCloudinaryConfig,
  createCloudinaryConfig,
  updateCloudinaryConfig,
  deleteCloudinaryConfig,
  toPublicCloudinaryConfig,
};