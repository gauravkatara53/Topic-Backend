import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter (User ID) is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for report is required'],
      trim: true,
      maxlength: [100, 'Reason should not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description too long'],
    },
    imageUrls: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'You can upload a maximum of 5 images.',
      },
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
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

// Optional compound index for admin filtering
reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ListingReport', reportSchema);
