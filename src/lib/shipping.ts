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

export function resolveSlabCharge(weightKg: number, stateName: string, slabsFromRule?: any[]): number {
  const weightGrams = Math.round(weightKg * 1000);
  if (weightGrams <= 0) return 0;
  
  const isTN = (stateName || '').toLowerCase().trim() === 'tamil nadu' || (stateName || '').toLowerCase().trim() === 'tn';

  // Choose slabs to use
  let slabs = slabsFromRule;
  if (!slabs || slabs.length === 0) {
    slabs = isTN ? DEFAULT_TN_SLABS : DEFAULT_OTHER_SLABS;
  }

  // Sort slabs by end weight ascending
  const sortedSlabs = [...slabs].sort((a, b) => a.weight_end_g - b.weight_end_g);

  // Check matching slab
  const matchedSlab = sortedSlabs.find(
    (s) => weightGrams > s.weight_start_g && weightGrams <= s.weight_end_g
  );

  if (matchedSlab) {
    return matchedSlab.charge;
  }

  // Extrapolate if weight exceeds the maximum defined slab
  const lastSlab = sortedSlabs[sortedSlabs.length - 1];
  if (lastSlab) {
    const weightDiff = weightGrams - lastSlab.weight_end_g;
    const extraSlabsCount = Math.ceil(weightDiff / 1000);
    
    let increment = isTN ? 50 : 100;
    if (sortedSlabs.length >= 2) {
      const secondLastSlab = sortedSlabs[sortedSlabs.length - 2];
      increment = lastSlab.charge - secondLastSlab.charge;
    }
    
    return lastSlab.charge + (extraSlabsCount * increment);
  }

  return isTN ? 50 : 100;
}

export function getCourierFee(weightKg: number, subtotal: number, stateName = "Tamil Nadu", slabs?: any[]) {
  if (subtotal <= 0) return 0;
  return resolveSlabCharge(weightKg, stateName, slabs);
}
