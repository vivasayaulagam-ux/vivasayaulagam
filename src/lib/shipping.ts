export type CourierRates = {
  charge_250g?: number;
  charge_500g?: number;
  charge_1kg?: number;
  charge_above?: number;
  rate_per_kg?: number;
};

export const DEFAULT_COURIER_RATES: Required<CourierRates> = {
  charge_250g: 40,
  charge_500g: 60,
  charge_1kg: 80,
  charge_above: 120,
  rate_per_kg: 100,
};

export function parseWeightFromText(text: string): number {
  if (!text) return 0.25; // default fallback weight: 250g
  
  const lower = text.toLowerCase();
  
  // Handlers for common text descriptions
  if (lower.includes("half kg") || lower.includes("half-kg") || lower.includes("1/2 kg") || lower.includes("0.5 kg")) {
    return 0.5;
  }
  if (lower.includes("one kg") || lower.includes("1 kg") || lower.includes("one-kg")) {
    return 1.0;
  }
  if (lower.includes("quarter kg") || lower.includes("1/4 kg") || lower.includes("250 g") || lower.includes("250g")) {
    return 0.25;
  }

  // Regex to extract numbers followed by weight units
  // E.g., "500 Gm", "200 GM", "100 g", "1.5 kg"
  const regex = /(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|kgm|kilogram|kilograms|ml|l|lb|lbs|oz)\b/i;
  const match = text.match(regex);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith("g") || unit === "ml") { // g, gm, gms, gram, grams, ml
      return value / 1000;
    }
    if (unit === "lb" || unit === "lbs") {
      return value * 0.45359237;
    }
    if (unit === "oz") {
      return value * 0.0283495231;
    }
    // kg, l, etc.
    return value;
  }

  return 0.25; // default fallback: 250g
}

export function toWeightKg(weight: number | string | null | undefined, unit = "kg", name = "") {
  const numericWeight = typeof weight === "string" ? parseFloat(weight) : Number(weight);
  if ((!Number.isFinite(numericWeight) || numericWeight <= 0) && name) {
    return parseWeightFromText(name);
  }
  
  const value = Number.isFinite(numericWeight) ? numericWeight : 0;
  if (value <= 0) {
    if (name) return parseWeightFromText(name);
    return 0.25; // default fallback: 250g
  }

  switch (unit.toLowerCase()) {
    case "g":
    case "gram":
    case "grams":
    case "ml":
      return value / 1000;
    case "lb":
    case "lbs":
      return value * 0.45359237;
    case "oz":
      return value * 0.0283495231;
    case "l":
    case "kg":
    default:
      return value;
  }
}

export function parseWeightLabelToKg(label: string, fallbackWeight = 0, fallbackUnit = "kg") {
  const match = label.match(/^([\d.]+)\s*(g|kg|ml|l|lb|lbs|oz)$/i);
  if (!match) return toWeightKg(fallbackWeight, fallbackUnit);
  return toWeightKg(match[1], match[2]);
}

export function formatWeightKg(weightKg: number) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return "Weight not set";
  if (weightKg < 1) return `${Math.round(weightKg * 1000)} g`;
  return `${Number(weightKg.toFixed(2)).toLocaleString("en-IN")} kg`;
}

export function getCartItemWeightKg(item: {
  isCombo?: boolean;
  comboWeight?: number;
  weightKg?: number;
  weight?: number | string;
  unit?: string;
  weightUnit?: string;
  name?: string;
}) {
  if (item.isCombo) return item.comboWeight || item.weightKg || 0;
  if (Number.isFinite(item.weightKg) && Number(item.weightKg) > 0) {
    return Number(item.weightKg);
  }
  return toWeightKg(item.weight, item.unit || item.weightUnit || "kg", item.name || "");
}

export function normalizeComboWeightKg(weight: number | string | null | undefined, unit = "kg") {
  const value = typeof weight === "string" ? parseFloat(weight) : Number(weight);
  if (!Number.isFinite(value) || value <= 0) return 0;

  // New comboWeight values are stored as kg/L-equivalent. This protects older
  // records that may have persisted raw g/ml values before normalization.
  if ((unit === "g" || unit === "ml") && value > 50) {
    return value / 1000;
  }

  return value;
}

export function getCourierBracketLabel(weightKg: number) {
  if (!Number.isFinite(weightKg) || weightKg <= 0.25) return "Up to 250g";
  if (weightKg <= 0.5) return "Up to 500g";
  if (weightKg <= 1) return "Up to 1kg";
  return "Above 1kg";
}

export const DEFAULT_TN_SLABS = [
  { weight_start_g: 0, weight_end_g: 1000, charge: 50 },
  { weight_start_g: 1000, weight_end_g: 2000, charge: 100 },
  { weight_start_g: 2000, weight_end_g: 3000, charge: 150 },
  { weight_start_g: 3000, weight_end_g: 4000, charge: 200 },
  { weight_start_g: 4000, weight_end_g: 5000, charge: 250 },
  { weight_start_g: 5000, weight_end_g: 6000, charge: 300 }
];

export const DEFAULT_OTHER_SLABS = [
  { weight_start_g: 0, weight_end_g: 1000, charge: 100 },
  { weight_start_g: 1000, weight_end_g: 2000, charge: 200 },
  { weight_start_g: 2000, weight_end_g: 3000, charge: 300 },
  { weight_start_g: 3000, weight_end_g: 4000, charge: 400 },
  { weight_start_g: 4000, weight_end_g: 5000, charge: 500 },
  { weight_start_g: 5000, weight_end_g: 6000, charge: 600 }
];

export const SHIPPING_RATES: Record<string, number> = {
  "Tamil Nadu": 50,
  "Kerala": 100,
  "Karnataka": 100,
  "Andhra Pradesh": 100,
  "Telangana": 100,
  "DEFAULT": 150
};

export const STATE_CODE_MAP: Record<string, string> = {
  "TN": "Tamil Nadu",
  "KL": "Kerala",
  "KA": "Karnataka",
  "AP": "Andhra Pradesh",
  "TG": "Telangana"
};

export function calculateCourierCharge(weightKg: number, stateName?: string): number {
  if (!weightKg || weightKg <= 0) return 0;
  
  const state = (stateName || "").trim();
  let baseRate = SHIPPING_RATES.DEFAULT;
  
  if (state) {
    let resolvedState = state;
    if (state.toUpperCase() in STATE_CODE_MAP) {
      resolvedState = STATE_CODE_MAP[state.toUpperCase()];
    }
    const matchedState = Object.keys(SHIPPING_RATES).find(
      (key) => key.toLowerCase() === resolvedState.toLowerCase()
    );
    if (matchedState) {
      baseRate = SHIPPING_RATES[matchedState];
    }
  }
  
  const weightInGrams = Math.round(weightKg * 1000);
  const multiplier = Math.ceil(weightInGrams / 1000);
  return baseRate * multiplier;
}

export function resolveSlabCharge(weightKg: number, stateName: string, slabsFromRule?: any[]): number {
  const weightGrams = Math.round(weightKg * 1000);
  if (weightGrams <= 0) return 0;

  const isTN = (stateName || '').toLowerCase().trim() === 'tamil nadu' || (stateName || '').toLowerCase().trim() === 'tn';
  const slabs = slabsFromRule && slabsFromRule.length > 0
    ? slabsFromRule
    : isTN
      ? DEFAULT_TN_SLABS
      : DEFAULT_OTHER_SLABS;

  const sortedSlabs = [...slabs].sort((a, b) => a.weight_end_g - b.weight_end_g);
  const matchedSlab = sortedSlabs.find(
    (s) => weightGrams > s.weight_start_g && weightGrams <= s.weight_end_g
  );

  if (matchedSlab) {
    return matchedSlab.charge;
  }

  const lastSlab = sortedSlabs[sortedSlabs.length - 1];
  if (!lastSlab) {
    return calculateCourierCharge(weightKg, stateName);
  }

  const weightDiff = weightGrams - lastSlab.weight_end_g;
  const extraSlabsCount = Math.ceil(weightDiff / 1000);
  let increment = isTN ? 50 : 100;

  if (sortedSlabs.length >= 2) {
    const secondLastSlab = sortedSlabs[sortedSlabs.length - 2];
    increment = lastSlab.charge - secondLastSlab.charge;
  }

  return lastSlab.charge + (extraSlabsCount * increment);
}

export function getCourierFee(weightKg: number, subtotal: number, stateName = "Tamil Nadu", slabs?: any[]) {
  if (subtotal <= 0) return 0;
  return resolveSlabCharge(weightKg, stateName, slabs);
}

export function getStateChargeKey(stateName: string): string {
  const name = (stateName || '').toLowerCase().replace(/[^a-z]/g, '');
  if (name.includes('tamilnadu')) return 'tamilnadu';
  if (name.includes('kerala')) return 'kerala';
  if (name.includes('karnataka')) return 'karnataka';
  if (name.includes('andhra')) return 'andhrapradesh';
  if (name.includes('telangana')) return 'telangana';
  return 'otherstates';
}

export function calculateCartShipping(
  items: Array<{
    productId: string;
    quantity: number;
    weightKg: number;
    state_courier_charges?: Record<string, number>;
    courier_charge?: number;
    product_type?: string;
  }>,
  state: string,
  subtotal: number,
  matchingRule: any
): number {
  if (!state) return 0;
  
  const stateKey = getStateChargeKey(state);
  const rateGroups: Record<number, number> = {};
  let totalWeightForSlabs = 0;

  for (const item of items) {
    const stateCharge = item.state_courier_charges?.[stateKey];
    
    let productCourierRate = 0;
    if (typeof stateCharge === 'number' && stateCharge > 0) {
      productCourierRate = stateCharge;
    } else if (typeof item.courier_charge === 'number' && item.courier_charge > 0) {
      productCourierRate = item.courier_charge;
    }

    const itemTotalWeight = (item.weightKg || 0.25) * item.quantity;

    if (productCourierRate > 0) {
      rateGroups[productCourierRate] = (rateGroups[productCourierRate] || 0) + itemTotalWeight;
    } else {
      totalWeightForSlabs += itemTotalWeight;
    }
  }

  let finalShipping = 0;

  for (const [rateStr, weight] of Object.entries(rateGroups)) {
    const rate = Number(rateStr);
    if (weight > 0) {
      const multiplier = Math.ceil(weight);
      finalShipping += multiplier * rate;
    }
  }

  if (totalWeightForSlabs > 0) {
    const ruleApplies = matchingRule && subtotal >= (matchingRule.minimum_order_value || 0);
    const isFreeShipping = ruleApplies &&
      matchingRule.free_shipping_above !== null &&
      matchingRule.free_shipping_above !== undefined &&
      subtotal >= matchingRule.free_shipping_above;

    if (!isFreeShipping) {
      const slabs = ruleApplies ? matchingRule.slabs : [];
      const slabCharge = resolveSlabCharge(totalWeightForSlabs, state || matchingRule?.state_name || '', slabs);
      finalShipping += slabCharge;
    }
  }

  return finalShipping;
}
