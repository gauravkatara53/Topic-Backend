import mongoose from "mongoose";

const newSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    link: {
      type: String,
      required: [true, "Link is required"],
      validate: {
        validator: function (v) {
          return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created By is required"],
    },
  },
  { timestamps: true }
);

const NewModel = mongoose.model("New", newSchema);
NewModel.createIndexes({ title: "text", content: "text" });
export default NewModel;
