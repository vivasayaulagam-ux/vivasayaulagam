import mongoose from 'mongoose';

const EmailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'forgot_password'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Expire document automatically when expiresAt passes
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure unique combination of email and purpose
EmailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });

export default mongoose.models.EmailOtp || mongoose.model('EmailOtp', EmailOtpSchema);
