import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing ID is required"],
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer ID is required"],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },
    finalSellingPrice: {
      type: Number,
      required: [true, "Final selling price is required"],
      min: [0, "Price must be a positive number"],
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      trim: true,
      maxlength: [100, "Transaction ID too long"],
      default: null,
    },
    soldAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Optional compound index for analytics
transactionSchema.index({ soldAt: -1 });

export default mongoose.model("ListingTransaction", transactionSchema);
