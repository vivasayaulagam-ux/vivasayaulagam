import { generateStableFeedId } from '@/lib/shopping/productMapper';

export interface CatalogItemInput {
  productId?: string;
  id?: string | number;
  _id?: string | number;
  sku?: string;
  variantSku?: string;
  variantValue?: string;
  variantName?: string;
  selectedVariant?: {
    sku?: string;
    value?: string;
  } | null;
}

/**
 * Returns the exact product/variant feed ID that matches Meta Catalog XML (/api/feeds/meta).
 * 
 * Rules matching src/lib/shopping/productMapper.ts:
 * 1. Variant with its own distinct SKU -> returns variant.sku.trim()
 * 2. Variant without distinct SKU -> returns generateStableFeedId(parentSku, parentId, undefined, variantValue)
 * 3. Simple or Combo product -> returns generateStableFeedId(parentSku, parentId)
 */
export function getMetaCatalogId(item: CatalogItemInput): string {
  if (!item) return '';

  const variantSku = item.variantSku || item.selectedVariant?.sku;
  if (variantSku && String(variantSku).trim()) {
    return String(variantSku).trim();
  }

  const variantVal = item.variantValue || item.variantName || item.selectedVariant?.value;
  const productId = String(item.productId || item._id || item.id || '');
  const productSku = item.sku;

  return generateStableFeedId(productSku, productId, undefined, variantVal);
}
