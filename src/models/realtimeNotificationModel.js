import mongoose from "mongoose";

const realtimeNotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    type: { type: String, enum: ["info", "alert", "update"], default: "info" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "RealtimeNotification",
  realtimeNotificationSchema
);
