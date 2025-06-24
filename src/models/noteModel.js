import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    semester: { type: Number, required: true, trim: true },
    branch: {
      type: String,
      enum: ["MME", "CSE", "EE", "ME", "CE", "ECM", "PIE", "ECE"],
      required: true,
      trim: true,
    },
    subject: { type: String, required: true, trim: true }, // ✅ Added subject
    fileUrl: { type: String, required: true },
    downloadCount: { type: Number, default: 0 }, // ✅ Tracking popularity
    views: { type: Number, default: 0 }, // ✅ Optional: Engagement analytics
    isApproved: { type: Boolean, default: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // ✅ If admin approval involved
    rejectionReason: { type: String }, // ✅ Optional: track why rejected
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    }, // ✅ Control access
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    }, // ✅ Optional: avg rating
    numberOfRatings: { type: Number, default: 0 }, // ✅ To calculate average
  },
  { timestamps: true }
);

const Notes = mongoose.model("Notes", noteSchema);
Notes.createIndexes({ title: "text", description: "text", subject: "text" });

export default Notes;
