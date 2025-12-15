const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["freezer", "ambient"],
  },
  operator: {
    type: String,
    required: true,
    enum: [">", "<"],
  },
  value: {
    type: Number,
    required: true
  }
});

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, unique: true, required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    conditions: [conditionSchema],

    apiKey: { type: String, unique: true, required: true },

    // alerts
    batteryAlert: { type: Boolean, default: false },
    refrigeratorAlert: { type: Boolean, default: false },
    espFreezer: { type: Number, default: null },
    espAmbient: { type: Number, default: null },

    versionId: { type: String, default: null },

    lastUpdateTime: { type: Date, default: null }

  },
  { timestamps: true }
);

const deviceModel = mongoose.model("Device", deviceSchema);

module.exports = deviceModel;

