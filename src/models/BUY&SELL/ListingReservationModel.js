import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
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
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Reservation expiry date is required"],
    },
    isExpired: {
      type: Boolean,
      default: false,
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

// Virtual to calculate active status on the fly
reservationSchema.virtual("isActive").get(function () {
  return !this.isExpired && new Date() < this.expiresAt;
});

// Optional index to speed up expired lookup
reservationSchema.index({ expiresAt: 1 });
reservationSchema.index({ isExpired: 1 });

export default mongoose.model("ListingReservation", reservationSchema);
