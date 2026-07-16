import { normalizeImageUrl, normalizeProductImage, normalizeSinglePath } from './utils';
import { normalizeComboWeightKg } from './shipping';

export function getProductPrices(product: any, variantValue?: string) {
  const isCombo = product.product_type === 'combo';
  
  if (isCombo) {
    const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0);
    const mrp = Number(product.mrp ?? product.compareAtPrice ?? 0);
    const hasDiscount = mrp > sellingPrice;
    const discount = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
    const savings = hasDiscount ? mrp - sellingPrice : 0;
    return { sellingPrice, mrp, discount, savings, hasDiscount };
  }
  
  const variants = product.variants || [];
  if (variants.length > 0) {
    const selectedVariant = variantValue
      ? variants.find((v: any) => v.value === variantValue)
      : variants[0];
    
    if (selectedVariant) {
      const sellingPrice = Number(selectedVariant.sellingPrice ?? selectedVariant.price ?? 0);
      const mrp = Number(selectedVariant.mrp ?? selectedVariant.compareAtPrice ?? 0);
      const hasDiscount = mrp > sellingPrice;
      const discount = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
      const savings = hasDiscount ? mrp - sellingPrice : 0;
      return { sellingPrice, mrp, discount, savings, hasDiscount };
    }
  }
  
  const sellingPrice = Number(product.sellingPrice ?? product.price ?? 0);
  const mrp = Number(product.mrp ?? product.compareAtPrice ?? 0);
  const hasDiscount = mrp > sellingPrice;
  const discount = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const savings = hasDiscount ? mrp - sellingPrice : 0;
  return { sellingPrice, mrp, discount, savings, hasDiscount };
}

export function normalizeProductOutput(p: any) {
  const isOutOfStock = p.trackInventory && (p.quantity ?? 0) <= 0;
  const primaryImage = normalizeProductImage(p);
  
  const { sellingPrice, mrp, discount, savings, hasDiscount } = getProductPrices(p);
  
  return {
    ...p,
    _id: p._id?.toString() || p.id,
    id: p._id?.toString() || p.id,
    name: p.title || p.name,
    title: p.title || p.name,
    
    // Core pricing fields
    sellingPrice,
    mrp: hasDiscount ? mrp : 0,
    price: sellingPrice, // backward compatibility
    compareAtPrice: hasDiscount ? mrp : 0, // backward compatibility
    originalPrice: hasDiscount ? mrp : sellingPrice, // backward compatibility
    salePrice: sellingPrice, // backward compatibility
    discount,
    savings,
    hasDiscount,
    
    primaryImage,
    image: primaryImage,
    images: (p.images || []).map((img: string) => normalizeSinglePath(img) || primaryImage),
    stock_quantity: p.quantity ?? 0,
    stock_status: isOutOfStock ? 'Out of Stock' : 'In Stock',
    is_out_of_stock: isOutOfStock,
    averageRating: p.rating ?? p.averageRating ?? 0,
    rating: p.rating ?? p.averageRating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    slug: p.seoSlug || p.slug || '',
    stock: p.quantity ?? 0,
    quantity: p.quantity ?? 0,
    trackInventory: p.trackInventory ?? false,
    category: p.category || "Organic Goods",
    categories: p.categories || [],
    bgColor: p.bgColor || "from-gray-100 to-green-50",
    emoji: p.emoji || "🌾",
    isNew: true,
    isBestSeller: p.collections?.includes("Best Sellers") || false,
    status: p.status,
    collections: p.collections || [],
    weight: p.weight,
    weightUnit: p.weightUnit,
    unit: p.unit || p.weightUnit || 'g',
    sku: p.sku || '',
    continueSelling: p.continueSelling ?? false,
    product_type: p.product_type || 'normal',
    courier_charge: p.courier_charge || 0,
    state_courier_charges: p.state_courier_charges ? (p.state_courier_charges.toObject ? p.state_courier_charges.toObject() : p.state_courier_charges) : {
      tamilnadu: 0,
      kerala: 0,
      karnataka: 0,
      andhrapradesh: 0,
      telangana: 0,
      otherstates: 0,
    },
    available_weights: p.available_weights || [],
    base_price_1kg: p.base_price_1kg || 0,
    base_mrp_1kg: p.base_mrp_1kg || 0,
    comboWeight: p.product_type === 'combo'
      ? normalizeComboWeightKg(p.comboWeight !== undefined ? p.comboWeight : p.weight, p.weightUnit || p.unit || 'kg')
      : p.comboWeight,
    variants: (p.variants || []).map((v: any) => {
      const vSellingPrice = Number(v.sellingPrice ?? v.price ?? 0);
      const vMrp = Number(v.mrp ?? v.compareAtPrice ?? 0);
      const vHasDiscount = vMrp > vSellingPrice;
      const vDiscount = vHasDiscount ? Math.round(((vMrp - vSellingPrice) / vMrp) * 100) : 0;
      const vSavings = vHasDiscount ? vMrp - vSellingPrice : 0;
      return {
        _id: v._id?.toString() || v.id,
        id: v._id?.toString() || v.id,
        type: v.type,
        value: v.value,
        sellingPrice: vSellingPrice,
        mrp: vHasDiscount ? vMrp : 0,
        price: vSellingPrice, // backward compatibility
        compareAtPrice: vHasDiscount ? vMrp : 0, // backward compatibility
        discount: vDiscount,
        savings: vSavings,
        stock: v.stock ?? 0,
        unit: v.unit || p.unit || p.weightUnit || 'g',
        sku: v.sku || '',
      };
    })
  };
}

export function normalizeProductPayload(body: any) {
  const normalizedImages = Array.isArray(body?.images)
    ? body.images.map((img: string) => normalizeImageUrl(img))
    : body?.image
    ? [normalizeImageUrl(body.image)]
    : [];
  const productUnit = body.unit || body.weightUnit || 'g';
  const rawComboWeight = body.comboWeight !== undefined && body.comboWeight !== ''
    ? body.comboWeight
    : body.weight !== undefined && body.weight !== ''
      ? body.weight
      : undefined;

  return {
    ...body,
    images: normalizedImages,
    variants: Array.isArray(body?.variants)
      ? body.variants.map((variant: any) => ({
          ...variant,
          sellingPrice: variant.sellingPrice === '' || variant.sellingPrice === undefined ? undefined : Number(variant.sellingPrice),
          mrp: variant.mrp === '' || variant.mrp === undefined ? undefined : Number(variant.mrp),
          price: variant.sellingPrice === '' || variant.sellingPrice === undefined ? undefined : Number(variant.sellingPrice),
          compareAtPrice: variant.mrp === '' || variant.mrp === undefined ? undefined : Number(variant.mrp),
          stock: variant.stock === '' || variant.stock === undefined ? 0 : Number(variant.stock),
          unit: variant.unit || productUnit,
        }))
      : [],
    product_type: body.product_type || 'normal',
    courier_charge: body.courier_charge === '' || body.courier_charge === undefined ? 0 : Number(body.courier_charge),
    state_courier_charges: {
      tamilnadu: body.state_courier_charges?.tamilnadu === '' || body.state_courier_charges?.tamilnadu === undefined ? 0 : Number(body.state_courier_charges.tamilnadu),
      kerala: body.state_courier_charges?.kerala === '' || body.state_courier_charges?.kerala === undefined ? 0 : Number(body.state_courier_charges.kerala),
      karnataka: body.state_courier_charges?.karnataka === '' || body.state_courier_charges?.karnataka === undefined ? 0 : Number(body.state_courier_charges.karnataka),
      andhrapradesh: body.state_courier_charges?.andhrapradesh === '' || body.state_courier_charges?.andhrapradesh === undefined ? 0 : Number(body.state_courier_charges.andhrapradesh),
      telangana: body.state_courier_charges?.telangana === '' || body.state_courier_charges?.telangana === undefined ? 0 : Number(body.state_courier_charges.telangana),
      otherstates: body.state_courier_charges?.otherstates === '' || body.state_courier_charges?.otherstates === undefined ? 0 : Number(body.state_courier_charges.otherstates),
    },
    available_weights: Array.isArray(body.available_weights) ? body.available_weights : [],
    base_price_1kg: body.base_price_1kg === '' || body.base_price_1kg === undefined ? 0 : Number(body.base_price_1kg),
    base_mrp_1kg: body.base_mrp_1kg === '' || body.base_mrp_1kg === undefined ? 0 : Number(body.base_mrp_1kg),
    weight: body.weight === '' || body.weight === undefined ? 0 : Number(body.weight),
    weightUnit: body.weightUnit || 'kg',
    unit: productUnit,
    comboWeight: body.product_type === 'combo' && rawComboWeight !== undefined
      ? normalizeComboWeightKg(rawComboWeight, body.weightUnit || productUnit || 'kg')
      : undefined,
  };
}
