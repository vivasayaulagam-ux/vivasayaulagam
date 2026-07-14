import dbConnect from './db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import mongoose from 'mongoose';
import { normalizeProductImage, normalizeSinglePath } from './utils';
import { normalizeProductOutput } from './pricing';

// Helper for aesthetics mapping
export const getEmojiAndBg = (title: string, category: string) => {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();
  
  if (cat.includes("noodle") || cat.includes("pasta") || t.includes("noodle")) {
    return { emoji: "🍜", bgColor: "from-emerald-100 to-green-200" };
  }
  if (cat.includes("honey") || t.includes("honey")) {
    return { emoji: "🍯", bgColor: "from-amber-100 to-yellow-200" };
  }
  if (cat.includes("sweet") || cat.includes("jaggery") || t.includes("jaggery") || t.includes("sugar")) {
    return { emoji: "🌿", bgColor: "from-orange-100 to-amber-200" };
  }
  if (cat.includes("millet") || cat.includes("grain") || cat.includes("rice") || t.includes("millet") || t.includes("rice") || cat.includes("seed")) {
    return { emoji: "🌾", bgColor: "from-lime-100 to-green-200" };
  }
  if (cat.includes("oil") || cat.includes("ghee") || t.includes("oil") || t.includes("ghee")) {
    return { emoji: "🥛", bgColor: "from-yellow-100 to-amber-200" };
  }
  if (cat.includes("tea") || cat.includes("herbal") || t.includes("tea")) {
    return { emoji: "🍵", bgColor: "from-green-100 to-emerald-200" };
  }
  return { emoji: "📦", bgColor: "from-gray-100 to-green-50" };
};

// Legacy category matching
export function getLegacyMongoQueryForCategory(activeSlug: string): any {
  if (!activeSlug || activeSlug === 'all') return {};

  let pattern: RegExp;
  if (activeSlug === 'combo') {
    pattern = /combo|bundle|offer/i;
  } else if (activeSlug === 'hair-skin-care') {
    pattern = /hair & skin care|hair-skin-care|skincare|hair|ayurvedic|supplements/i;
  } else if (activeSlug === 'rice-powders') {
    pattern = /rice powders|rice-powders|grain|rice/i;
  } else if (activeSlug === 'thokku-pickles') {
    pattern = /thokku & pickles|thokku-pickles|thokku|pickle/i;
  } else if (activeSlug === 'masala-spice-powders') {
    pattern = /masala & spice powders|masala-spice-powders|masala|spice/i;
  } else if (activeSlug === 'sweets-snacks') {
    pattern = /sweets & snacks|sweets-snacks|sweet|snack|chips|urundai|laddu/i;
  } else if (activeSlug === 'health-dairy') {
    pattern = /health & dairy|health-dairy|dairy|ghee|oil|tea|honey/i;
  } else {
    pattern = new RegExp(activeSlug, 'i');
  }
  return pattern;
}

export function getMongoSort(sortBy: string): any {
  if (sortBy === "Price: Low to High") {
    return { sellingPrice: 1 };
  }
  if (sortBy === "Price: High to Low") {
    return { sellingPrice: -1 };
  }
  if (sortBy === "Newest Arrivals") {
    return { createdAt: -1 };
  }
  if (sortBy === "Best Selling") {
    return { collections: -1, createdAt: -1 };
  }
  return { createdAt: -1 };
}

export interface GetProductsParams {
  category?: string;
  maxPrice?: string | number;
  sort?: string;
  page?: string | number;
  limit?: string | number;
  status?: string;
  view?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  await dbConnect();

  const {
    category,
    maxPrice,
    sort = 'Featured',
    page,
    limit,
    status = 'active',
  } = params;

  const query: any = {};
  if (status !== 'all') {
    query.status = status;
  }

  // 1. Category resolution logic:
  if (category && category !== 'all') {
    let categoryDoc = null;
    if (mongoose.isValidObjectId(category)) {
      categoryDoc = await Category.findById(category).lean();
    }
    if (!categoryDoc) {
      // Find by slug or name (case-insensitive)
      categoryDoc = await Category.findOne({
        $or: [
          { slug: category },
          { slug: new RegExp('^' + category.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
          { name: new RegExp('^' + category.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
        ]
      }).lean();
    }

    const matchTerms: any[] = [];
    if (categoryDoc) {
      matchTerms.push(categoryDoc._id);
      matchTerms.push(categoryDoc._id.toString());
      matchTerms.push(categoryDoc.name);
      matchTerms.push(categoryDoc.slug);
      
      // Also push variations of name & slug case-insensitively
      matchTerms.push(new RegExp('^' + categoryDoc.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'));
      matchTerms.push(new RegExp('^' + categoryDoc.slug.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i'));
    }

    // Try fallback mapping from getLegacyMongoQueryForCategory
    const pattern = getLegacyMongoQueryForCategory(category);
    if (pattern instanceof RegExp) {
      matchTerms.push(pattern);
    } else if (typeof pattern === 'string' && pattern !== '') {
      matchTerms.push(new RegExp(pattern, 'i'));
    }

    if (matchTerms.length === 0) {
      // Direct param query fallback
      const cleanParam = new RegExp(category.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      matchTerms.push(cleanParam);
    }

    query.$or = [
      { category: { $in: matchTerms } },
      { categories: { $in: matchTerms } }
    ];
  }

  // 2. Price filter
  if (maxPrice) {
    const maxPriceVal = Number(maxPrice);
    if (!isNaN(maxPriceVal)) {
      query.sellingPrice = { $lte: maxPriceVal };
    }
  }

  const sortQuery = getMongoSort(sort);

  // Projection - only required fields for cards to optimize performance
  const projection = 'title seoSlug price compareAtPrice sellingPrice mrp base_price_1kg base_mrp_1kg variants images reviewCount quantity trackInventory category status collections weight weightUnit unit rating averageRating createdAt';

  let productsDocs;
  let totalProducts = 0;
  let totalPages = 1;
  let parsedPage = 1;
  let parsedLimit = 24;

  if (page || limit) {
    parsedPage = Math.max(1, parseInt(String(page || '1'), 10));
    parsedLimit = Math.max(1, parseInt(String(limit || '24'), 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const [docs, count] = await Promise.all([
      Product.find(query).select(projection).sort(sortQuery).skip(skip).limit(parsedLimit).lean(),
      Product.countDocuments(query),
    ]);

    productsDocs = docs;
    totalProducts = count;
    totalPages = Math.ceil(count / parsedLimit);
  } else {
    // If no page/limit specified, fetch all matching products
    const [docs, count] = await Promise.all([
      Product.find(query).select(projection).sort(sortQuery).lean(),
      Product.countDocuments(query),
    ]);
    productsDocs = docs;
    totalProducts = count;
    totalPages = 1;
  }

  // Normalize products output
  const products = productsDocs.map((p: any) => normalizeProductOutput(p));

  // Query max product price in DB for pricing slider default
  let maxProductPriceLimit = 2000;
  const maxPriceProd = await Product.findOne({ status: "active" })
    .sort({ sellingPrice: -1 })
    .select("sellingPrice")
    .lean<{ sellingPrice?: number }>();
  if (maxPriceProd?.sellingPrice) {
    maxProductPriceLimit = Math.max(1000, Number(maxPriceProd.sellingPrice));
  }

  return {
    products,
    totalProducts,
    currentPage: parsedPage,
    totalPages,
    limit: parsedLimit,
    maxProductPriceLimit,
  };
}
