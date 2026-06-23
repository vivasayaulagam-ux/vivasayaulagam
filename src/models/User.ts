import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    pinHash: {
      type: String,
      required: false,
      select: false,
    },
    phone: {
      type: String,
      default: '',
    },
    addresses: [
      {
        label: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String, default: '' },
      }
    ],
    defaultAddress: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    },
  },
  { timestamps: true }
);

// Pre-save hook to synchronize emailVerified/isEmailVerified and password/passwordHash
UserSchema.pre('save', function () {
  if (this.isModified('password') && this.password) {
    this.passwordHash = this.password;
  } else if (this.isModified('passwordHash') && this.passwordHash) {
    this.password = this.passwordHash;
  }
  if (this.isModified('emailVerified')) {
    this.isEmailVerified = this.emailVerified;
  } else if (this.isModified('isEmailVerified')) {
    this.emailVerified = this.isEmailVerified;
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
