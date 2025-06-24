import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["hackathon", "internship", "job"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    link: { type: String, required: true },
    deadline: { type: Date, required: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
