import mongoose from "mongoose";
import PYQ from "../models/PYQModel.js";

import Notes from "../models/noteModel.js";
import dotenv from "dotenv";
import NewModel from "../models/newsModel.js";
dotenv.config();
const setupIndexes = async () => {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB ✅");

    // Create indexes
    await Notes.createIndexes({
      title: "text",
      description: "text",
      subject: "text",
    });
    await PYQ.createIndexes({
      subject: "text",
      description: "text",
      year: "text",
    });
    await NewModel.createIndexes({ title: "text", content: "text" });

    console.log("Text indexes created successfully ✅");

    process.exit(0);
  } catch (error) {
    console.error("Error creating indexes ❌", error);
    process.exit(1);
  }
};

setupIndexes();
