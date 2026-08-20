import dbConnect from '../db';
import Product from '@/models/Product';
import { getProductPrices } from '../pricing';
import { hasValidRealImage } from './productMapper';

export interface ProductHealthRow {
  id: string;
  mongoId: string;
  title: string;
  sku: string;
  status: 'active' | 'draft';
  feedEnabled: boolean;
  metaReady: boolean;
  googleReady: boolean;
  missingData: string[];
}

export interface ShoppingIntegrationsSummary {
  totalActiveProducts: number;
  eligibleProductsCount: number;
  excludedProductsCount: number;
  missingInfoProductsCount: number;
  metaStatus: 'Ready' | 'Warning' | 'Error';
  googleStatus: 'Ready' | 'Warning' | 'Error';
  lastGeneratedAt: string;
  feedHealthPercentage: number;
  productRows: ProductHealthRow[];
}

export async function validateShoppingProducts(): Promise<ShoppingIntegrationsSummary> {
  await dbConnect();

  const allProducts = await Product.find({}).sort({ updatedAt: -1 }).lean();

  let totalActive = 0;
  let eligibleCount = 0;
  let excludedCount = 0;
  let missingInfoCount = 0;
  let totalWarningsCount = 0;

  const productRows: ProductHealthRow[] = [];

  for (const p of allProducts) {
    try {
      const isDraft = p.status === 'draft';
      // Treat undefined as true (enabled) for backward compatibility
      const feedEnabled = p.enableShoppingSync !== false;
      const missing: string[] = [];

      if (isDraft) {
        missing.push('Draft Product (Inactive)');
      }

      if (!feedEnabled) {
        missing.push('Feed Sync Disabled');
      }

      if (!p.title || !String(p.title).trim()) {
        missing.push('Missing Title');
      }

      const { sellingPrice } = getProductPrices(p);
      const effectivePrice = sellingPrice || Number(p.base_price_1kg) || Number(p.price) || 0;
      if (!effectivePrice || effectivePrice <= 0) {
        missing.push('Missing Valid Price');
      }

      const hasImages = (Array.isArray(p.images) && p.images.length > 0) || Boolean(p.image);
      const hasRealImg = hasValidRealImage(p);

      if (!hasImages) {
        missing.push('Missing Product Image');
      } else if (!hasRealImg) {
        missing.push('Placeholder Image (Excluded)');
      }

      if (!p.seoSlug || !String(p.seoSlug).trim()) {
        missing.push('Missing SEO Slug');
      }

      if (!p.weight && (!p.variants || p.variants.length === 0)) {
        missing.push('Missing Weight');
      }

      if (!p.googleProductCategory || !String(p.googleProductCategory).trim()) {
        missing.push('Missing Google Category');
      }

      const isMetaReady = !isDraft && feedEnabled && Boolean(p.title) && effectivePrice > 0 && hasRealImg;
      const isGoogleReady = isMetaReady && Boolean(p.googleProductCategory);

      if (p.status === 'active') {
        totalActive += 1;
        if (feedEnabled && isMetaReady) {
          eligibleCount += 1;
        } else if (!feedEnabled) {
          excludedCount += 1;
        }

        if (missing.length > 0 && feedEnabled) {
          missingInfoCount += 1;
        }
      }

      if (missing.length > 0) {
        totalWarningsCount += 1;
      }

      productRows.push({
        id: p.sku || p._id?.toString() || String(p.id || ''),
        mongoId: p._id?.toString() || String(p.id || ''),
        title: p.title || 'Untitled Product',
        sku: p.sku || 'No SKU',
        status: p.status || 'draft',
        feedEnabled,
        metaReady: isMetaReady,
        googleReady: isGoogleReady,
        missingData: missing,
      });
    } catch (rowErr) {
      console.error(`Error validating product row ${p?._id}:`, rowErr);
    }
  }

  // Health index: Show actual percentage if active products exist, or 0 if no active products
  const feedHealthPercentage = totalActive > 0
    ? Math.round((eligibleCount / totalActive) * 100)
    : 0;

  const metaStatus: 'Ready' | 'Warning' | 'Error' = totalActive === 0
    ? 'Warning'
    : (eligibleCount > 0
        ? (missingInfoCount > 0 ? 'Warning' : 'Ready')
        : 'Error');

  const googleStatus: 'Ready' | 'Warning' | 'Error' = metaStatus;

  return {
    totalActiveProducts: totalActive,
    eligibleProductsCount: eligibleCount,
    excludedProductsCount: excludedCount,
    missingInfoProductsCount: missingInfoCount,
    metaStatus,
    googleStatus,
    lastGeneratedAt: new Date().toISOString(),
    feedHealthPercentage,
    productRows,
  };
}
