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

export function toWeightKg(weight: number | string | null | undefined, unit = "kg") {
  const value = typeof weight === "string" ? parseFloat(weight) : Number(weight);
  if (!Number.isFinite(value) || value <= 0) return 0;

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

export function getCourierFee(weightKg: number, subtotal: number, rates?: CourierRates) {
  if (subtotal <= 0) return 0;
  const rate = rates?.rate_per_kg ?? DEFAULT_COURIER_RATES.rate_per_kg;
  return Number((weightKg * Number(rate)).toFixed(2));
}
