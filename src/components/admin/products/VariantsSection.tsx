'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Weight, Truck, BadgePercent, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = {
  form: ProductFormData;
  update: (f: Partial<ProductFormData>) => void;
  errors: Partial<Record<keyof ProductFormData, string>>;
};

const getWeightOptions = (unit: string) => {
  if (unit === 'ml' || unit === 'L') {
    return ['50ml', '100ml', '250ml', '500ml', '1L', '2L'];
  }
  return ['50g', '100g', '250g', '500g', '1kg', '2kg'];
};

const getComboWeights = (unit: string) => {
  if (unit === 'ml' || unit === 'L') {
    return ['250 ml', '500 ml', '1 L', '2 L', '5 L', '10 L'];
  }
  return ['250 g', '500 g', '1 kg', '2 kg', '3 kg', '4 kg', '5 kg', '10 kg'];
};

const parseWeightLabelToGrams = (label: string): number => {
  const match = label.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return (unit === 'g' || unit === 'ml') ? val : val * 1000;
};

const parseComboWeightStr = (str: string): { val: number; unit: string } => {
  const match = str.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
  if (!match) return { val: 1, unit: 'kg' };
  const val = parseFloat(match[1]);
  const u = match[2].toLowerCase();
  return { val, unit: u === 'l' ? 'L' : u };
};

const toComboBaseValue = (value: number, unit: string) => {
  return unit === 'g' || unit === 'ml' ? value / 1000 : value;
};

const fromComboBaseValue = (value: number | '' | undefined, unit: string) => {
  if (value === '' || value === undefined) return '';
  return unit === 'g' || unit === 'ml' ? value * 1000 : value;
};

export default function VariantsSection({ form, update, errors }: Props) {
  const productType = form.product_type || 'normal';
  const courierCharge = form.courier_charge;
  const basePrice1Kg = form.base_price_1kg;
  const availableWeights = form.available_weights || [];
  const quantity = Number(form.quantity || 0);

  const unit = form.unit || 'g';
  const isVolume = unit === 'ml' || unit === 'L';
  const comboWeightsList = getComboWeights(unit);

  // States for adding custom weights (Normal products)
  const [customWeight, setCustomWeight] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>(() => {
    return isVolume ? 'ml' : 'g';
  });

  // State for combo weight option
  const [selectedWeightOption, setSelectedWeightOption] = useState<string>(() => {
    const wt = form.comboWeight || form.weight;
    if (wt === '' || wt === 0) return isVolume ? '1 L' : '1 kg';
    const matchedOption = comboWeightsList.find(opt => {
      const { val, unit: u } = parseComboWeightStr(opt);
      const baseValue = (u === 'g' || u === 'ml') ? val / 1000 : val;
      return baseValue === wt;
    });
    return matchedOption || 'Custom';
  });

  const selectedCustomUnit = isVolume
    ? (customUnit === 'ml' || customUnit === 'L' ? customUnit : 'ml')
    : (customUnit === 'g' || customUnit === 'kg' ? customUnit : 'g');

  const availableWeightsStr = JSON.stringify(form.available_weights || []);
  const prevProductType = useRef(productType);
  const prevUnit = useRef<string>(form.unit);

  // Clear available weights checklist if admin switches unit type classes (mass vs volume)
  useEffect(() => {
    const isVol = form.unit === 'ml' || form.unit === 'L';
    const prevIsVol = prevUnit.current === 'ml' || prevUnit.current === 'L';
    if (isVol !== prevIsVol && prevUnit.current !== undefined) {
      update({ available_weights: [] });
    }
    prevUnit.current = form.unit;
  }, [form.unit, update]);

  // Set default courier charge of ₹80 and default weight of 1kg when switching to Combo Product
  useEffect(() => {
    if (productType === 'combo' && prevProductType.current !== 'combo') {
      const defaultOption = isVolume ? '1 L' : '1 kg';
      const { val, unit: u } = parseComboWeightStr(defaultOption);
      const baseValue = toComboBaseValue(val, u);
      update({ courier_charge: 80, weight: baseValue, weightUnit: u, comboWeight: baseValue });
      setSelectedWeightOption(defaultOption);
    } else if (productType === 'normal' && prevProductType.current !== 'normal') {
      update({ courier_charge: 0, weight: 0, comboWeight: undefined });
    }
    prevProductType.current = productType;
  }, [productType, isVolume, update]);

  // Synchronize variants dynamically whenever base price, weight list, product type, unit, or stock changes
  useEffect(() => {
    if (productType === 'combo') {
      // Combo products don't have weight variants
      if (form.variants && form.variants.length > 0) {
        update({ variants: [] });
      }
      return;
    }

    const basePriceVal = Number(basePrice1Kg || 0);
    const baseMrpVal = Number(form.base_mrp_1kg || 0);
    const weightsList = form.available_weights || [];

    // Sort weight options logically (ascending weight in grams)
    const sortedWeightsList = [...weightsList].sort((a, b) => {
      return parseWeightLabelToGrams(a) - parseWeightLabelToGrams(b);
    });

    const newVariants = sortedWeightsList.map((w) => {
      const match = w.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
      let calculatedPrice = 0;
      let calculatedMrp = 0;
      let variantUnit = form.unit || 'g';
      if (match) {
        const val = parseFloat(match[1]);
        const unitLabel = match[2].toLowerCase();
        
        // Convert to grams/milliliters
        const amount = (unitLabel === 'kg' || unitLabel === 'l') ? val * 1000 : val;
        
        calculatedPrice = Math.round((basePriceVal / 1000) * amount);
        calculatedMrp = baseMrpVal > 0 ? Math.round((baseMrpVal / 1000) * amount) : 0;
        
        if (unitLabel === 'l') {
          variantUnit = 'L';
        } else if (unitLabel === 'kg') {
          variantUnit = 'kg';
        } else if (unitLabel === 'ml') {
          variantUnit = 'ml';
        } else {
          variantUnit = 'g';
        }
      }
      return {
        type: 'size',
        value: w,
        sellingPrice: calculatedPrice,
        mrp: calculatedMrp,
        price: calculatedPrice, // compatibility
        compareAtPrice: calculatedMrp, // compatibility
        additionalPrice: 0,
        stock: quantity,
        unit: variantUnit,
      };
    });

    // Parent price becomes first variant price or base price
    const firstPrice = newVariants[0]?.sellingPrice ?? basePriceVal;
    const firstMrp = newVariants[0]?.mrp ?? baseMrpVal;

    const areVariantsEqual = (a: any[], b: any[]) => {
      const arrA = a || [];
      const arrB = b || [];
      if (arrA.length !== arrB.length) return false;
      return arrB.every((v, index) => {
        const current = arrA[index];
        if (!current) return false;
        return (
          current.type === v.type &&
          current.value === v.value &&
          current.sellingPrice === v.sellingPrice &&
          current.mrp === v.mrp &&
          current.stock === v.stock &&
          current.unit === v.unit
        );
      });
    };

    const currentPriceMatches = form.sellingPrice === (firstPrice || '') && form.mrp === (firstMrp || '');
    const currentVariantsMatch = areVariantsEqual(form.variants, newVariants);
    const orderOfWeightsMatches = JSON.stringify(form.available_weights) === JSON.stringify(sortedWeightsList);

    if (!currentPriceMatches || !currentVariantsMatch || !orderOfWeightsMatches) {
      update({
        available_weights: sortedWeightsList,
        variants: newVariants,
        sellingPrice: firstPrice || '',
        mrp: firstMrp || '',
        price: firstPrice || '', // compatibility
        compareAtPrice: firstMrp || '', // compatibility
      });
    }
  }, [basePrice1Kg, form.base_mrp_1kg, availableWeightsStr, productType, quantity, form.unit, update]);

  const toggleWeightOption = (weight: string) => {
    if (availableWeights.includes(weight)) {
      update({ available_weights: availableWeights.filter((w) => w !== weight) });
    } else {
      update({ available_weights: [...availableWeights, weight] });
    }
  };

  const removeWeightOption = (weight: string) => {
    update({ available_weights: availableWeights.filter((w) => w !== weight) });
  };

  const handleAddCustomWeight = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(customWeight);
    if (!Number.isFinite(val) || val <= 0) return;

    const weightStr = `${val}${selectedCustomUnit}`;
    if (!availableWeights.includes(weightStr)) {
      update({ available_weights: [...availableWeights, weightStr] });
    }
    setCustomWeight('');
  };

  const handleComboWeightDropdownChange = (option: string) => {
    setSelectedWeightOption(option);
    if (option !== 'Custom') {
      const { val, unit: u } = parseComboWeightStr(option);
      const baseValue = toComboBaseValue(val, u);
      update({ weight: baseValue, weightUnit: u, comboWeight: baseValue });
    } else {
      update({ weight: '', weightUnit: form.unit || 'kg', comboWeight: '' });
    }
  };

  const weightOptions = getWeightOptions(form.unit || 'g');
  const customWeights = availableWeights.filter((w) => !weightOptions.includes(w));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-700">Product Settings & Pricing</h2>
        <p className="text-xs text-gray-500 mt-0.5">Configure product type, shipping rates, and variant pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Product Type Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Product Type
          </label>
          <select
            value={productType}
            onChange={(e) => update({ product_type: e.target.value as 'normal' | 'combo' })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-medium text-gray-800"
          >
            <option value="normal">Normal Product</option>
            <option value="combo">Combo Product</option>
          </select>
        </div>

        {/* Unit Dropdown Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Unit *
          </label>
          <select
            value={form.unit || 'g'}
            onChange={(e) => {
              const newUnit = e.target.value;
              const nextCustomUnit = newUnit === 'ml' || newUnit === 'L' ? 'ml' : 'g';
              const updates: Partial<ProductFormData> = { unit: newUnit, weightUnit: newUnit };
              setCustomUnit(nextCustomUnit);

              if (productType === 'combo') {
                const defaultOption = newUnit === 'ml' || newUnit === 'L' ? '1 L' : '1 kg';
                const { val, unit: u } = parseComboWeightStr(defaultOption);
                const baseValue = toComboBaseValue(val, u);
                setSelectedWeightOption(defaultOption);
                updates.weight = baseValue;
                updates.weightUnit = u;
                updates.comboWeight = baseValue;
              }

              update(updates);
            }}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-medium text-gray-800"
          >
            <option value="g">Gram (g)</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="ml">Milliliter (ml)</option>
            <option value="L">Liter (L)</option>
          </select>
        </div>

        {/* Courier Charge Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Courier Charge (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              min={0}
              value={courierCharge ?? ''}
              onChange={(e) =>
                update({ courier_charge: e.target.value === '' ? '' : parseFloat(e.target.value) })
              }
              className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-medium text-gray-800"
              placeholder={productType === 'combo' ? '80' : '0'}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <Truck size={10} />
            {productType === 'combo'
              ? 'Default charge set to ₹80 for Combo products. Modify if necessary.'
              : 'Left at 0 to calculate shipping dynamically based on weight.'}
          </p>
        </div>

        {/* Product Free Shipping Toggle */}
        <div className="md:col-span-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#34a121]" />
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Product-Level Free Shipping
              </label>
              {form.isFreeShipping ? (
                <span className="bg-[#34a121] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ON (Free Shipping)
                </span>
              ) : (
                <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  OFF (Normal Shipping)
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
              When turned ON, this product will have ₹0 shipping charge and its weight will be completely excluded from cart shipping calculations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ isFreeShipping: !form.isFreeShipping })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              form.isFreeShipping ? 'bg-[#34a121]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                form.isFreeShipping ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Statewise Courier Charges */}
        <div className="md:col-span-2 border border-gray-150 rounded-xl p-4 bg-gray-50/50 mt-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Statewise Courier Charges (₹)
          </label>
          <p className="text-[10px] text-gray-400 mb-3 leading-normal">
            Specify shipping costs for each state. If left blank or 0, the general courier charge (or weight-based slabs) will be used.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'tamilnadu', label: 'Tamil Nadu' },
              { key: 'kerala', label: 'Kerala' },
              { key: 'karnataka', label: 'Karnataka' },
              { key: 'andhrapradesh', label: 'Andhra Pradesh' },
              { key: 'telangana', label: 'Telangana' },
              { key: 'otherstates', label: 'Other States' },
            ].map(({ key, label }) => {
              const val = (form.state_courier_charges as any)?.[key] ?? '';
              return (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">{label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) => {
                        const newCharges = {
                          ...((form.state_courier_charges as any) || {
                            tamilnadu: '', kerala: '', karnataka: '', andhrapradesh: '', telangana: '', otherstates: ''
                          }),
                          [key]: e.target.value === '' ? '' : parseFloat(e.target.value)
                        };
                        update({ state_courier_charges: newCharges });
                      }}
                      className="w-full pl-6 pr-2 py-2 rounded-lg border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-medium text-gray-800 bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {productType === 'combo' ? (
        /* Pricing & Weight fields for Combo Product */
        <div className="border-t border-gray-100 pt-5 space-y-5">
          {/* Combo Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Combo Weight ({form.unit || 'kg'}) *
            </label>
            <select
              value={selectedWeightOption}
              onChange={(e) => handleComboWeightDropdownChange(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-medium text-gray-800"
            >
              {comboWeightsList.map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
              <option value="Custom">Custom</option>
            </select>

            {selectedWeightOption === 'Custom' && (
              <div className="mt-3 max-w-md">
                <input
                  type="number"
                  step="any"
                  min={0.01}
                  value={fromComboBaseValue(form.comboWeight ?? form.weight ?? '', form.unit || 'kg')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    const baseValue = val === '' ? '' : toComboBaseValue(val, form.unit || 'kg');
                    update({ weight: baseValue, weightUnit: form.unit || 'kg', comboWeight: baseValue });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800 ${
                    errors.weight ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={`Enter Combo Weight in ${form.unit || 'kg'}`}
                />
              </div>
            )}
            {errors.weight && <p className="text-xs text-red-500 mt-1.5">{errors.weight}</p>}
          </div>

          {/* Pricing fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Selling Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={form.sellingPrice ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    update({ sellingPrice: val });
                  }}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800 ${
                    errors.sellingPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 899"
                />
              </div>
              {errors.sellingPrice && <p className="text-xs text-red-500 mt-1.5">{errors.sellingPrice}</p>}
            </div>

            {/* MRP (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                MRP (₹) <span className="text-gray-400 text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={form.mrp ?? ''}
                  onChange={(e) =>
                    update({ mrp: e.target.value === '' ? '' : parseFloat(e.target.value) })
                  }
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800"
                  placeholder="e.g. 1199"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Pricing & Weight Variants fields for Normal Product */
        <div className="border-t border-gray-100 pt-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Base Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {form.unit === 'ml' || form.unit === 'L' ? '1L Base Price (₹) *' : '1KG Base Price (₹) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={basePrice1Kg ?? ''}
                  onChange={(e) =>
                    update({ base_price_1kg: e.target.value === '' ? '' : parseFloat(e.target.value) })
                  }
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800 ${
                    errors.base_price_1kg ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 500"
                />
              </div>
              {errors.base_price_1kg && (
                <p className="text-xs text-red-500 mt-1.5">{errors.base_price_1kg}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                Enter the base price for {form.unit === 'ml' || form.unit === 'L' ? '1L' : '1KG'}. Prices for other variants will be computed dynamically.
              </p>
            </div>

            {/* Base MRP */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {form.unit === 'ml' || form.unit === 'L' ? '1L Base MRP (₹)' : '1KG Base MRP (₹)'} <span className="text-gray-400 text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={form.base_mrp_1kg ?? ''}
                  onChange={(e) =>
                    update({ base_mrp_1kg: e.target.value === '' ? '' : parseFloat(e.target.value) })
                  }
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800"
                  placeholder="e.g. 600"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Enter the base MRP for {form.unit === 'ml' || form.unit === 'L' ? '1L' : '1KG'}. MRP for other variants will be computed dynamically.
              </p>
            </div>

            {/* Available Weight Variants Checklist */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Available Weight Variants
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {weightOptions.map((weight) => {
                  const isChecked = availableWeights.includes(weight);
                  return (
                    <button
                      key={weight}
                      type="button"
                      onClick={() => toggleWeightOption(weight)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold transition-all select-none duration-150 ${
                        isChecked
                          ? 'border-[#34a121] bg-[#f2fcf4] text-[#34a121] shadow-xs'
                          : 'border-gray-250 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <Weight size={12} className={isChecked ? 'text-[#34a121]' : 'text-gray-400'} />
                      {weight}
                    </button>
                  );
                })}
              </div>
              {errors.available_weights && (
                <p className="text-xs text-red-500 mt-2">{errors.available_weights}</p>
              )}
            </div>
          </div>

          {/* Custom Weight Variants Input */}
          <div className="bg-gray-50/50 rounded-xl border border-gray-150 p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom Weight Variants</h3>
              <p className="text-[10px] text-gray-500">Add custom weight values like 25g, 750g, 2kg, or 5kg</p>
            </div>

            <div className="flex items-center gap-2 max-w-md">
              <div className="flex-1">
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomWeight();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:border-gray-400 transition-all font-medium text-gray-800"
                  placeholder="Weight value"
                />
              </div>
              <div className="w-24">
                <select
                  value={selectedCustomUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:border-gray-400 transition-all font-medium text-gray-800"
                >
                  {(isVolume ? ['ml', 'L'] : ['g', 'kg']).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleAddCustomWeight()}
                className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                Add
              </button>
            </div>

            {/* Custom Weight Chips */}
            <AnimatePresence>
              {customWeights.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {customWeights.map((w) => (
                    <motion.span
                      key={w}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-gray-700 border border-gray-200 shadow-2xs"
                    >
                      {w}
                      <button
                        type="button"
                        onClick={() => removeWeightOption(w)}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-1 p-0.5 rounded-full hover:bg-gray-100"
                      >
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pricing Preview Table */}
          {availableWeights.length > 0 && basePrice1Kg !== '' && Number(basePrice1Kg) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gray-50/50 border border-gray-150 rounded-xl p-4 space-y-3"
            >
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <BadgePercent size={13} className="text-[#34a121]" />
                Auto-calculated Weight/Volume Prices Preview
              </span>

              <div className="overflow-hidden border border-gray-100 rounded-lg bg-white">
                <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Variant Option</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Proportional Quantity</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Calculated Price</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Calculated MRP</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {availableWeights.map((w) => {
                      const match = w.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
                      let calculatedPrice = 0;
                      let calculatedMrp = 0;
                      let amountVal = 0;
                      const baseMrpVal = Number(form.base_mrp_1kg || 0);
                      if (match) {
                        const val = parseFloat(match[1]);
                        const unitLabel = match[2].toLowerCase();
                        
                        const amount = (unitLabel === 'kg' || unitLabel === 'l') ? val * 1000 : val;
                        calculatedPrice = Math.round((Number(basePrice1Kg) / 1000) * amount);
                        calculatedMrp = baseMrpVal > 0 ? Math.round((baseMrpVal / 1000) * amount) : 0;
                        amountVal = amount;
                      }
                      return (
                        <tr key={w} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-gray-900">{w}</td>
                          <td className="px-4 py-2.5 text-gray-500">{amountVal}{isVolume ? 'ml' : 'g'}</td>
                          <td className="px-4 py-2.5 font-bold text-[#34a121]">₹{calculatedPrice}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-400">₹{calculatedMrp > 0 ? calculatedMrp : '—'}</td>
                          <td className="px-4 py-2.5 text-gray-500">{quantity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
