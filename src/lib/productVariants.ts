import { toWeightKg } from "@/lib/shipping";

export type ProductVariantLike = {
  _id?: string;
  id?: string;
  type?: string;
  value: string;
  price?: number;
  sellingPrice?: number;
  mrp?: number;
  compareAtPrice?: number;
  stock?: number;
  unit?: string;
  sku?: string;
};

export type VariantMeasurement = {
  weight: number;
  unit: string;
  weightKg: number;
  sortValue: number;
  label: string;
};

function normalizeUnit(unit?: string) {
  const value = String(unit || "").trim().toLowerCase();
  if (["kg", "kilogram", "kilograms"].includes(value)) return "kg";
  if (["g", "gm", "gms", "gram", "grams"].includes(value)) return "g";
  if (["l", "litre", "litres", "liter", "liters"].includes(value)) return "L";
  if (["ml", "millilitre", "millilitres", "milliliter", "milliliters"].includes(value)) return "ml";
  return unit || "g";
}

export function getVariantId(variant?: ProductVariantLike | null) {
  if (!variant) return "";
  return String(variant.id || variant._id || variant.value);
}

export function parseVariantMeasurement(
  label: string,
  fallbackUnit = "g",
  fallbackWeight = 0
): VariantMeasurement {
  const trimmed = String(label || "").trim();
  const withUnit = trimmed.match(
    /(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|gm|gms|grams?|l|litres?|liters?|ml|millilitres?|milliliters?)\b/i
  );
  const numberOnly = trimmed.match(/^(\d+(?:\.\d+)?)$/);
  const match = withUnit || numberOnly;
  const weight = match ? Number(match[1]) : Number(fallbackWeight);
  const unit = normalizeUnit(withUnit?.[2] || fallbackUnit);
  const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 0;
  const weightKg = safeWeight > 0 ? toWeightKg(safeWeight, unit) : 0;
  const sortValue = unit === "kg" || unit === "L" ? safeWeight * 1000 : safeWeight;

  return {
    weight: safeWeight,
    unit,
    weightKg,
    sortValue,
    label: match
      ? trimmed
      : (safeWeight > 0 ? `${Number(safeWeight.toFixed(2))}${unit}` : "Standard"),
  };
}

export function getProductMeasurement(product: {
  name?: string;
  title?: string;
  weight?: number;
  weightUnit?: string;
  unit?: string;
  product_type?: string;
  comboWeight?: number;
}) {
  if (product.product_type === "combo") {
    const comboWeight = Number(product.comboWeight ?? product.weight ?? 0);
    return parseVariantMeasurement(
      comboWeight > 0 ? `${comboWeight}kg` : product.name || product.title || "",
      "kg",
      comboWeight
    );
  }

  const fallbackUnit = product.unit || product.weightUnit || "g";
  const fallbackWeight = Number(product.weight || 0);
  return parseVariantMeasurement(
    product.name || product.title || "",
    fallbackUnit,
    fallbackWeight
  );
}

export function sortVariantsDescending<T extends ProductVariantLike>(variants: T[]) {
  return variants
    .map((variant, index) => ({
      variant,
      index,
      measurement: parseVariantMeasurement(variant.value, variant.unit || "g"),
    }))
    .sort((a, b) => {
      if (b.measurement.sortValue !== a.measurement.sortValue) {
        return b.measurement.sortValue - a.measurement.sortValue;
      }
      return a.index - b.index;
    })
    .map(({ variant }) => variant);
}

export function hasPurchasableStock(product: {
  trackInventory?: boolean;
  continueSelling?: boolean;
  quantity?: number;
  stock_quantity?: number;
  is_out_of_stock?: boolean;
  stock_status?: string;
  variants?: ProductVariantLike[];
}) {
  if (!product.trackInventory || product.continueSelling) return true;
  if (product.variants?.length) {
    return product.variants.some((variant) => Number(variant.stock || 0) > 0);
  }
  if (product.is_out_of_stock === true || product.stock_status === "Out of Stock") return false;
  return Number(product.quantity ?? product.stock_quantity ?? 0) > 0;
}
