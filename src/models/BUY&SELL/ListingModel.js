import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description too long"],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one image is required",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    finalPrice: {
      type: Number,
      min: [0, "Final price must be positive"],
      default: null,
    },
    condition: {
      type: String,
      enum: ["new", "like-new", "used", "heavily-used"],
      required: [true, "Condition is required"],
    },
    category: {
      type: String,
      enum: [
        "books",
        "electronics",
        "hostel",
        "furniture",
        "fashion",
        "stationery",
        "sports",
        "cycles",
        "misc",
        "other",
      ],
      required: [true, "Category is required"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [255, "Location too long"],
    },
    upiId: {
      type: String,
      trim: true,
      maxlength: [50, "UPI ID too long"],
    },
    allowCash: {
      type: Boolean,
      default: false,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
      index: true,
    },

    // Reservation
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reservedAt: Date,
    reservationExpiresAt: Date,

    soldAt: Date,

    // Status field replaces isSold and isActive
    status: {
      type: String,
      enum: ["available", "reserved", "sold", "inactive"],
      default: "available",
      index: true,
    },

    contactNumber: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactName: {
      type: String,
      trim: true,
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

// Indexing for performance
listingSchema.index({ category: 1, price: 1 });
listingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Listing", listingSchema);
