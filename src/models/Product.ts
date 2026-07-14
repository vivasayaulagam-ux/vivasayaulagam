import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'size' | 'color'
  value: { type: String, required: true },
  price: { type: Number },
  sellingPrice: { type: Number },
  mrp: { type: Number, default: 0 },
  unit: { type: String, enum: ['g', 'kg', 'ml', 'L'], default: 'g' },
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
    price: { type: Number },
    compareAtPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number, default: 0 },
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

    // Custom fields for weights & combos
    product_type: { type: String, enum: ['normal', 'combo'], default: 'normal' },
    courier_charge: { type: Number, default: 0 },
    available_weights: [{ type: String }],
    base_price_1kg: { type: Number, default: 0 },
    base_mrp_1kg: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    weightUnit: { type: String, default: 'kg' },
    unit: { type: String, enum: ['g', 'kg', 'ml', 'L'], default: 'g', required: true },
    comboWeight: { type: Number },

    // Reviews (Calculated from approved customer reviews)
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.pre('validate', function (next) {
  if (this.price !== undefined && this.sellingPrice === undefined) {
    this.sellingPrice = this.price as any;
  }
  if (this.compareAtPrice !== undefined && this.mrp === undefined) {
    this.mrp = this.compareAtPrice as any;
  }
  if (this.unit === undefined) {
    this.unit = (this.weightUnit || 'g') as any;
  }
  if (this.weightUnit === undefined) {
    this.weightUnit = this.unit;
  }
  if (typeof next === 'function') {
    next();
  }
});

ProductSchema.index({ seoSlug: 1 }, { sparse: true });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, sellingPrice: 1 });
ProductSchema.index({ status: 1, sellingPrice: -1 });
ProductSchema.index({ category: 1, status: 1, sellingPrice: 1 });
ProductSchema.index({ category: 1, status: 1, sellingPrice: -1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);

