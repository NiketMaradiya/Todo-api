const mongoose = require("mongoose");

const cloudinaryConfigSchema = new mongoose.Schema(
  {
    cloudName: {
      type: String,
      required: true,
      trim: true,
    },

    apiKey: {
      type: String,
      required: true,
      select: false,
    },

    apiSecret: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CloudinaryConfig",
  cloudinaryConfigSchema
);