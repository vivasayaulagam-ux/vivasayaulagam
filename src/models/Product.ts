import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'size' | 'color'
  value: { type: String, required: true },
  price: { type: Number },
  additionalPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
});

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    images: [{ type: String }],
    images360: [{ type: String }],
    category: { type: String, default: '' },
    categories: [{ type: String }],

    // Pricing
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    chargeTax: { type: Boolean, default: false },
    costPerItem: { type: Number, default: 0 },

    // Inventory
    trackInventory: { type: Boolean, default: false },
    quantity: { type: Number, default: 0 },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },
    continueSelling: { type: Boolean, default: false },



    // Variants
    variants: [VariantSchema],

    // SEO
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoSlug: { type: String, default: '' },

    // Organization
    status: { type: String, enum: ['active', 'draft'], default: 'draft' },
    productType: { type: String, default: '' },
    vendor: { type: String, default: '' },
    collections: [{ type: String }],
    tags: [{ type: String }],
    themeTemplate: { type: String, default: 'default' },

    // Reviews (Calculated from approved customer reviews)
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ seoSlug: 1 }, { sparse: true });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, price: 1 });
ProductSchema.index({ status: 1, price: -1 });
ProductSchema.index({ category: 1, status: 1, price: 1 });
ProductSchema.index({ category: 1, status: 1, price: -1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
