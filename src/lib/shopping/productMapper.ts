import { getProductPrices } from '../pricing';
import { normalizeComboWeightKg } from '../shipping';
import { toAbsoluteProductUrl, toAbsoluteImageUrl, sanitizeDescription } from './urlHelpers';

export interface ShoppingFeedItem {
  id: string;
  item_group_id?: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_links: string[];
  availability: 'in stock' | 'out of stock' | 'preorder' | 'backorder';
  price: string;          // e.g. "300.00 INR"
  sale_price?: string;     // e.g. "250.00 INR"
  brand: string;
  condition: 'new' | 'refurbished' | 'used';
  google_product_category: string;
  product_type: string;
  shipping_weight?: string;
  shipping_label?: string;
  sku: string;
}

/**
 * Checks if a product or variant has a valid real product image.
 * Excludes missing images, empty strings, and placeholder.svg assets.
 */
export function hasValidRealImage(p: any, baseUrl?: string): boolean {
  if (!p || typeof p !== 'object') return false;

  const rawImages: string[] = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.image ? [p.image] : []);

  if (rawImages.length === 0) return false;

  const firstImg = String(rawImages[0] || '').trim().toLowerCase();
  if (!firstImg || firstImg.includes('placeholder.svg')) {
    return false;
  }

  const absUrl = toAbsoluteImageUrl(rawImages[0], baseUrl).toLowerCase();
  if (!absUrl || absUrl.includes('placeholder.svg')) {
    return false;
  }

  return true;
}

/**
 * Formats a numeric price into ISO 4217 standard string (e.g. "250.00 INR").
 */
export function formatIsoPrice(amount: any): string {
  const num = Math.max(0, Number(amount) || 0);
  return `${num.toFixed(2)} INR`;
}

/**
 * Formats an authoritative mass as a Google shipping weight in kilograms.
 * Volume is not physical shipping weight and must not be inferred from ml/L.
 */
export function formatShippingWeight(weight?: any, unit?: any): string | undefined {
  const val = Number(weight);
  if (!Number.isFinite(val) || val <= 0) return undefined;

  const u = String(unit || '').trim().toLowerCase();
  const weightKg = ['g', 'gm', 'gms', 'gram', 'grams'].includes(u)
    ? val / 1000
    : ['kg', 'kilo', 'kilogram', 'kilograms'].includes(u)
      ? val
      : 0;

  if (weightKg <= 0 || weightKg > 1000) return undefined;
  return `${weightKg} kg`;
}

function getVariantShippingWeight(variant: any): string | undefined {
  const value = String(variant?.value || '').trim();
  const measurement = value.match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|gm|gms|grams?)$/i);
  if (measurement) return formatShippingWeight(measurement[1], measurement[2]);

  // A numeric variant value is meaningful only with its own mass unit.
  if (/^\d+(?:\.\d+)?$/.test(value)) {
    return formatShippingWeight(value, variant?.unit);
  }
  return undefined;
}

export function getShippingLabel(product: any): string | undefined {
  if (product.isFreeShipping === true) return 'FREE_SHIPPING';

  const stateRates = product.state_courier_charges || {};
  const genericRate = Number(product.courier_charge) || 0;
  const rate = (state: string) => Number(stateRates[state]) > 0 ? Number(stateRates[state]) : genericRate;
  const regionalRates = ['tamilnadu', 'kerala', 'karnataka', 'andhrapradesh', 'telangana'].map(rate);
  const otherRate = rate('otherstates');

  if (product.product_type === 'combo') {
    return [...regionalRates, otherRate].every((value) => value === 80) ? 'COMBO_80' : undefined;
  }
  if (product.product_type !== 'normal') return undefined;
  if (regionalRates.some((value, index) => value !== [50, 100, 100, 100, 100][index])) return undefined;

  if (otherRate === 150) return 'STANDARD';
  if (otherRate === 149) return 'OTHER_149';
  if (otherRate === 200) return 'OTHER_200';
  if (otherRate === 1149) return 'OTHER_1149';
  return undefined;
}

/**
 * Helper to determine availability based on inventory tracking.
 */
export function determineAvailability(
  trackInventory?: boolean,
  quantity?: any,
  continueSelling?: boolean
): 'in stock' | 'out of stock' | 'backorder' {
  if (!trackInventory) return 'in stock';
  const qty = Number(quantity) || 0;
  if (qty > 0) return 'in stock';
  if (continueSelling) return 'backorder';
  return 'out of stock';
}

/**
 * Computes duplicate SKU frequency across active database products
 * to determine whether a product SKU can be safely used as a feed ID without collision.
 */
export function buildSkuFrequencyMap(products: any[]): Map<string, number> {
  const map = new Map<string, number>();
  products.forEach(p => {
    if (p.sku && String(p.sku).trim()) {
      const cleanSku = String(p.sku).trim().toUpperCase();
      map.set(cleanSku, (map.get(cleanSku) || 0) + 1);
    }
  });
  return map;
}

/**
 * Generates a stable, unique feed ID for a parent product or variant.
 */
export function generateStableFeedId(
  rawSku: string | undefined,
  mongoId: string,
  skuFreqMap?: Map<string, number>,
  variantVal?: string
): string {
  const cleanSku = (rawSku && String(rawSku).trim()) ? String(rawSku).trim().toUpperCase() : '';
  const isUniqueSku = cleanSku && (!skuFreqMap || (skuFreqMap.get(cleanSku) || 0) <= 1);

  const baseId = isUniqueSku ? String(rawSku).trim() : (cleanSku ? `${cleanSku}-${mongoId.slice(-6)}` : mongoId);

  if (variantVal && variantVal.trim()) {
    const cleanVariant = variantVal.trim().replace(/\s+/g, '-').toUpperCase();
    return `${baseId}-${cleanVariant}`;
  }

  return baseId;
}

/**
 * Converts a raw product document into one or more ShoppingFeedItem objects.
 * Strict Rule: Must exclude products/variants that use placeholder.svg or lack valid images.
 */
export function mapProductToShoppingItems(
  p: any,
  baseUrl?: string,
  skuFreqMap?: Map<string, number>
): ShoppingFeedItem[] {
  try {
    if (!p || typeof p !== 'object') return [];

    // Rule 1: Exclude inactive or sync-disabled products
    if (p.status !== 'active' || p.enableShoppingSync === false) {
      return [];
    }

    // Rule 2: Exclude products without a valid real image (no placeholder.svg)
    if (!hasValidRealImage(p, baseUrl)) {
      return [];
    }

    const parentId = p._id?.toString() || String(p.id || '');
    if (!parentId) return [];

    const parentFeedId = generateStableFeedId(p.sku, parentId, skuFreqMap);
    const brand = (p.vendor && String(p.vendor).trim()) ? String(p.vendor).trim() : 'Vivasaya Ulagam';
    const condition = (p.condition === 'refurbished' || p.condition === 'used') ? p.condition : 'new';
    const description = sanitizeDescription(p.description || p.seoDescription || p.title);
    const link = toAbsoluteProductUrl(p.seoSlug, parentId, baseUrl);
    const googleProductCategory = (p.googleProductCategory && String(p.googleProductCategory).trim())
      ? String(p.googleProductCategory).trim()
      : 'Food, Beverages & Tobacco > Food Items';
    const productType = (p.category && String(p.category).trim())
      ? String(p.category).trim()
      : 'Organic Goods';
    const shippingLabel = getShippingLabel(p);

    // Format images
    const rawImages: string[] = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : [p.image];
    const absoluteImages = rawImages
      .map(img => toAbsoluteImageUrl(img, baseUrl))
      .filter(img => img && !img.toLowerCase().includes('placeholder.svg'));

    if (absoluteImages.length === 0) {
      return [];
    }

    const primaryImage = absoluteImages[0];
    const secondaryImages = absoluteImages.slice(1, 10);

    const variants = Array.isArray(p.variants) ? p.variants : [];

    // Case A: Product has multiple variants
    if (variants.length > 0) {
      const items: ShoppingFeedItem[] = [];

      variants.forEach((v: any, index: number) => {
        try {
          const variantVal = String(v?.value || '').trim();
          const variantFeedId = v?.sku && String(v.sku).trim()
            ? String(v.sku).trim()
            : generateStableFeedId(p.sku, parentId, skuFreqMap, variantVal || `V${index + 1}`);

          const vSellingPrice = Number(v?.sellingPrice ?? v?.price ?? p.sellingPrice ?? p.price ?? p.base_price_1kg ?? 0);
          const vMrp = Number(v?.mrp ?? v?.compareAtPrice ?? p.mrp ?? p.compareAtPrice ?? 0);
          const hasDiscount = vMrp > vSellingPrice && vSellingPrice > 0;

          const price = formatIsoPrice(hasDiscount ? vMrp : (vSellingPrice || 100));
          const salePrice = hasDiscount ? formatIsoPrice(vSellingPrice) : undefined;

          const vStock = v?.stock !== undefined ? Number(v.stock) : (p.quantity ?? 0);
          const availability = determineAvailability(p.trackInventory, vStock, p.continueSelling);

          const variantTitle = `${p.title || 'Product'} (${variantVal || `Variant ${index + 1}`})`;
          const weightStr = getVariantShippingWeight(v);

          items.push({
            id: variantFeedId,
            item_group_id: parentFeedId,
            title: variantTitle,
            description,
            link,
            image_link: primaryImage,
            additional_image_links: secondaryImages,
            availability,
            price,
            sale_price: salePrice,
            brand,
            condition,
            google_product_category: googleProductCategory,
            product_type: productType,
            shipping_weight: weightStr,
            shipping_label: shippingLabel,
            sku: variantFeedId,
          });
        } catch (vErr) {
          console.error(`Error mapping variant index ${index} for product ${parentId}:`, vErr);
        }
      });

      if (items.length > 0) return items;
    }

    // Case B: Simple Product or Combo Product
    const { sellingPrice, mrp, hasDiscount } = getProductPrices(p);
    const finalSellingPrice = sellingPrice || Number(p.base_price_1kg) || Number(p.price) || 100;
    const finalMrp = mrp || Number(p.mrp) || Number(p.compareAtPrice) || 0;
    const actualHasDiscount = hasDiscount && finalMrp > finalSellingPrice;

    const price = formatIsoPrice(actualHasDiscount ? finalMrp : finalSellingPrice);
    const salePrice = actualHasDiscount ? formatIsoPrice(finalSellingPrice) : undefined;
    const availability = determineAvailability(p.trackInventory, p.quantity, p.continueSelling);
    const comboUnit = String(p.weightUnit || p.unit || '').toLowerCase();
    const weightStr = p.product_type === 'combo'
      ? ['g', 'kg'].includes(comboUnit)
        ? formatShippingWeight(normalizeComboWeightKg(p.comboWeight, comboUnit), 'kg')
        : undefined
      : formatShippingWeight(p.weight, p.weightUnit || p.unit);

    return [{
      id: parentFeedId,
      title: p.title || 'Untitled Product',
      description,
      link,
      image_link: primaryImage,
      additional_image_links: secondaryImages,
      availability,
      price,
      sale_price: salePrice,
      brand,
      condition,
      google_product_category: googleProductCategory,
      product_type: productType,
      shipping_weight: weightStr,
      shipping_label: shippingLabel,
      sku: parentFeedId,
    }];
  } catch (err) {
    console.error(`Error mapping product ${p?._id || p?.id}:`, err);
    return [];
  }
}

/**
 * Deduplicates an array of ShoppingFeedItem objects so that 0 duplicate IDs exist in the final feed.
 */
export function deduplicateFeedItems(items: ShoppingFeedItem[]): ShoppingFeedItem[] {
  const seenIds = new Set<string>();
  const result: ShoppingFeedItem[] = [];

  items.forEach((item, index) => {
    let finalId = item.id;
    if (seenIds.has(finalId)) {
      console.warn(`[ShoppingFeed] Duplicate feed ID detected "${finalId}" for title "${item.title}". Resolving deterministically.`);
      // Append index to guarantee uniqueness while remaining deterministic for the feed request
      finalId = `${item.id}-ID${index + 1}`;
    }

    seenIds.add(finalId);
    result.push({
      ...item,
      id: finalId,
      sku: finalId,
    });
  });

  return result;
}
