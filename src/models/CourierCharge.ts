import mongoose from 'mongoose';

const CourierChargeSchema = new mongoose.Schema(
  {
    state_name: { type: String, trim: true },
    state_code: { type: String, trim: true },
    pincode: { type: String, trim: true },
    pincode_start: { type: Number },
    pincode_end: { type: Number },
    courier_charge: { type: Number, required: true, default: 0 },
    slabs: [
      {
        weight_start_g: { type: Number, required: true },
        weight_end_g: { type: Number, required: true },
        charge: { type: Number, required: true },
      }
    ],
    minimum_order_value: { type: Number, default: 0 },
    free_shipping_above: { type: Number, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.models.CourierCharge || mongoose.model('CourierCharge', CourierChargeSchema);
