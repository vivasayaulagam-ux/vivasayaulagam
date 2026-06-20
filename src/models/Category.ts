import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: '📦' },
    slug: { type: String, required: true, unique: true },
    bgColor: { type: String, default: 'from-green-50 to-green-100' },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String, default: '' },
    redirectUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

CategorySchema.index({ isVisible: 1, order: 1 });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
