import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isImportant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollegeNotification", notificationSchema);
