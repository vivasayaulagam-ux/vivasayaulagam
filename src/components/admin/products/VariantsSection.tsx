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

const DEFAULT_WEIGHT_OPTIONS = ['50g', '100g', '250g', '500g', '1kg'];
const COMBO_STANDARD_WEIGHTS = ['1 kg', '2 kg', '3 kg', '4 kg', '5 kg', '10 kg'];

const parseWeightLabelToGrams = (label: string): number => {
  const match = label.match(/^([\d.]+)\s*(g|kg)$/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  return unit === 'g' ? val : val * 1000;
};

export default function VariantsSection({ form, update, errors }: Props) {
  const productType = form.product_type || 'normal';
  const courierCharge = form.courier_charge;
  const basePrice1Kg = form.base_price_1kg;
  const availableWeights = form.available_weights || [];
  const quantity = Number(form.quantity || 0);

  // States for adding custom weights (Normal products)
  const [customWeight, setCustomWeight] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<'g' | 'kg'>('g');

  // State for combo weight option
  const [selectedWeightOption, setSelectedWeightOption] = useState<string>(() => {
    const wt = form.weight;
    if (wt === '' || wt === 0) return '1 kg';
    const wtStr = `${wt} kg`;
    return COMBO_STANDARD_WEIGHTS.includes(wtStr) ? wtStr : 'Custom';
  });

  const availableWeightsStr = JSON.stringify(form.available_weights || []);
  const prevProductType = useRef(productType);

  // Set default courier charge of ₹80 and default weight of 1kg when switching to Combo Product
  useEffect(() => {
    if (productType === 'combo' && prevProductType.current !== 'combo') {
      update({ courier_charge: 80, weight: 1, weightUnit: 'kg' });
      setSelectedWeightOption('1 kg');
    } else if (productType === 'normal' && prevProductType.current !== 'normal') {
      update({ courier_charge: 0, weight: 0 });
    }
    prevProductType.current = productType;
  }, [productType, update]);

  // Synchronize variants dynamically whenever base price, weight list, product type, or stock changes
  useEffect(() => {
    if (productType === 'combo') {
      // Combo products don't have weight variants
      if (form.variants && form.variants.length > 0) {
        update({ variants: [] });
      }
      return;
    }

    const basePriceVal = Number(basePrice1Kg || 0);
    const weightsList = form.available_weights || [];

    // Sort weight options logically (ascending weight in grams)
    const sortedWeightsList = [...weightsList].sort((a, b) => {
      return parseWeightLabelToGrams(a) - parseWeightLabelToGrams(b);
    });

    const newVariants = sortedWeightsList.map((w) => {
      const match = w.match(/^([\d.]+)\s*(g|kg)$/i);
      let calculatedPrice = 0;
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === 'g') {
          calculatedPrice = Math.round((basePriceVal / 1000) * val);
        } else if (unit === 'kg') {
          calculatedPrice = Math.round(basePriceVal * val);
        }
      }
      return {
        type: 'size',
        value: w,
        price: calculatedPrice,
        additionalPrice: 0,
        stock: quantity,
      };
    });

    // Parent price becomes first variant price or base price
    const firstPrice = newVariants[0]?.price ?? basePriceVal;

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
          current.price === v.price &&
          current.additionalPrice === v.additionalPrice &&
          current.stock === v.stock
        );
      });
    };

    const currentPriceMatches = form.price === (firstPrice || '');
    const currentVariantsMatch = areVariantsEqual(form.variants, newVariants);
    const orderOfWeightsMatches = JSON.stringify(form.available_weights) === JSON.stringify(sortedWeightsList);

    if (!currentPriceMatches || !currentVariantsMatch || !orderOfWeightsMatches) {
      update({
        available_weights: sortedWeightsList,
        variants: newVariants,
        price: firstPrice || '',
      });
    }
  }, [basePrice1Kg, availableWeightsStr, productType, quantity, update]);

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

    const weightStr = `${val}${customUnit}`;
    if (!availableWeights.includes(weightStr)) {
      update({ available_weights: [...availableWeights, weightStr] });
    }
    setCustomWeight('');
  };

  const handleComboWeightDropdownChange = (option: string) => {
    setSelectedWeightOption(option);
    if (option !== 'Custom') {
      const numericVal = parseFloat(option.split(' ')[0]);
      update({ weight: numericVal, weightUnit: 'kg' });
    } else {
      update({ weight: '', weightUnit: 'kg' });
    }
  };

  const customWeights = availableWeights.filter((w) => !DEFAULT_WEIGHT_OPTIONS.includes(w));

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
      </div>

      {productType === 'combo' ? (
        /* Pricing & Weight fields for Combo Product */
        <div className="border-t border-gray-100 pt-5 space-y-5">
          {/* Combo Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Combo Weight (kg) *
            </label>
            <select
              value={selectedWeightOption}
              onChange={(e) => handleComboWeightDropdownChange(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-medium text-gray-800"
            >
              {COMBO_STANDARD_WEIGHTS.map((wt) => (
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
                  value={form.weight ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    update({ weight: val });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800 ${
                    errors.weight ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter Combo Weight in kg (e.g. 2.5)"
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
                  value={form.price ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    update({ price: val, base_price_1kg: val });
                  }}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-semibold text-gray-800 ${
                    errors.price ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 899"
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1.5">{errors.price}</p>}
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
                  value={form.compareAtPrice ?? ''}
                  onChange={(e) =>
                    update({ compareAtPrice: e.target.value === '' ? '' : parseFloat(e.target.value) })
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* 1KG Base Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                1KG Base Price (₹) *
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
                Enter the base price for 1KG. Prices for other weight variants will be computed dynamically.
              </p>
            </div>

            {/* Available Weight Variants Checklist */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Available Weight Variants
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {DEFAULT_WEIGHT_OPTIONS.map((weight) => {
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
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as 'g' | 'kg')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:border-gray-400 transition-all font-medium text-gray-800"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
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
                Auto-calculated Weight Prices Preview
              </span>

              <div className="overflow-hidden border border-gray-100 rounded-lg bg-white">
                <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Weight Variant</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Proportional Weight</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Calculated Price</th>
                      <th className="px-4 py-2 font-bold text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {availableWeights.map((w) => {
                      const match = w.match(/^([\d.]+)\s*(g|kg)$/i);
                      let calculatedPrice = 0;
                      let weightInGrams = 0;
                      if (match) {
                        const val = parseFloat(match[1]);
                        const unit = match[2].toLowerCase();
                        if (unit === 'g') {
                          calculatedPrice = Math.round((Number(basePrice1Kg) / 1000) * val);
                          weightInGrams = val;
                        } else if (unit === 'kg') {
                          calculatedPrice = Math.round(Number(basePrice1Kg) * val);
                          weightInGrams = val * 1000;
                        }
                      }
                      return (
                        <tr key={w} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-gray-900">{w}</td>
                          <td className="px-4 py-2.5 text-gray-500">{weightInGrams}g</td>
                          <td className="px-4 py-2.5 font-bold text-[#34a121]">₹{calculatedPrice}</td>
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
