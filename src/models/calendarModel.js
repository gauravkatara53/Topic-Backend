import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    eventDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicCalendar", calendarSchema);
