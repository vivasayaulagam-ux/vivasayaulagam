import mongoose from 'mongoose';
import Counter from './Counter';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  weightKg: { type: Number, default: 0 },
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [OrderItemSchema],
    subtotalAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalWeightKg: {
      type: Number,
      default: 0,
    },
    courierRate: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
      email: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

OrderSchema.pre('save', async function () {
  if (!this.orderId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { model: 'Order' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.orderId = `VIU${String(counter.seq).padStart(3, '0')}`;
    } catch (err) {
      console.error('Failed to generate orderId atomically:', err);
      // Fallback to timestamp-based ID
      this.orderId = `VIU${Date.now().toString().slice(-6)}`;
    }
  }
});

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
