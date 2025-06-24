import mongoose from "mongoose";

const emailNotificationSchema = new mongoose.Schema(
  {
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: "sentAt", updatedAt: false } }
);

module.exports = mongoose.model("EmailNotification", emailNotificationSchema);
