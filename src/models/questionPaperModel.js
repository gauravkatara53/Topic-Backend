import mongoose from "mongoose";

const questionPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String }],
    semester: { type: String, required: true },
    branch: { type: String, required: true },
    fileUrl: { type: String, required: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionPaper", questionPaperSchema);
