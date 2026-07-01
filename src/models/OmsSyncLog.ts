import mongoose from 'mongoose';

const OmsSyncLogSchema = new mongoose.Schema(
  {
    websiteOrderId: {
      type: String,
      required: true,
      index: true,
    },
    request: {
      type: String,
      required: true,
    },
    response: {
      type: String,
    },
    httpStatus: {
      type: Number,
      required: true,
    },
    error: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.OmsSyncLog || mongoose.model('OmsSyncLog', OmsSyncLogSchema);
