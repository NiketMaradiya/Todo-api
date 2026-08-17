const mongoose = require("mongoose");

const activitySchema =
  new mongoose.Schema(
    {
      action: {
        type: String,
        required: true,
        trim: true,
      },

      performedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      todoId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Todo",
        required: true,
      },

      metadata: {
        type:
          mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

activitySchema.index({
  todoId: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    "Activity",
    activitySchema
  );