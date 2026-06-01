'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductFormData } from '@/app/admin/products/add/page';
import {
  DEFAULT_COURIER_RATES,
  formatWeightKg,
  getCourierBracketLabel,
  getCourierFee,
  toWeightKg,
  type CourierRates,
} from '@/lib/shipping';

const COUNTRIES = ['India', 'China', 'USA', 'Germany', 'Japan', 'Sri Lanka', 'Nepal', 'Bangladesh', 'Other'];
const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz'];

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

export default function ShippingSection({ form, update }: Props) {
  const [courierRates, setCourierRates] = useState<CourierRates>(DEFAULT_COURIER_RATES);
  const weightKg = form.isPhysical ? toWeightKg(form.weight, form.weightUnit) : 0;
  const courierPreview = getCourierFee(weightKg, 1, courierRates);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.settings?.courier_charges) {
          setCourierRates(data.settings.courier_charges);
        }
      })
      .catch(err => console.error('Failed to load courier charge settings:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Shipping</h2>

      <label className="flex items-center justify-between cursor-pointer mb-4">
        <div>
          <p className="text-sm text-gray-700 font-medium">This is a physical product</p>
          <p className="text-xs text-gray-400 mt-0.5">Uncheck for digital products or services</p>
        </div>
        <button type="button" onClick={() => update({ isPhysical: !form.isPhysical })}
          className={`w-10 h-6 rounded-full relative transition-colors ${form.isPhysical ? 'bg-gray-900' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isPhysical ? 'left-5' : 'left-1'}`} />
        </button>
      </label>

      <AnimatePresence>
        {form.isPhysical && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {/* Weight */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Weight</label>
                <div className="flex gap-2">
                  <input type="number" min={0} step="0.01" value={form.weight}
                    onChange={e => update({ weight: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                    placeholder="0.00" />
                  <select value={form.weightUnit} onChange={e => update({ weightUnit: e.target.value })}
                    className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 bg-white">
                    {WEIGHT_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-green-50 border-b border-green-100 px-3 py-2 text-xs text-green-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">Current Courier Preview</span>
                      <span className="font-bold">
                        {formatWeightKg(weightKg)} / {getCourierBracketLabel(weightKg)} / ₹{courierPreview}
                      </span>
                    </div>
                    {weightKg <= 0 && (
                      <p className="mt-1 text-[11px] font-medium text-amber-700">
                        Set product weight so cart and checkout can calculate courier charges correctly. Note: Weight variants will override this base weight.
                      </p>
                    )}
                  </div>
                  
                  <div className="p-3 bg-white text-xs">
                    <h4 className="font-semibold text-gray-600 mb-2">Courier Charge Slabs</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 border border-gray-100 rounded bg-gray-50">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Up to 250g</div>
                        <div className="font-semibold text-gray-800">₹{courierRates.charge_250g}</div>
                      </div>
                      <div className="p-2 border border-gray-100 rounded bg-gray-50">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Up to 500g</div>
                        <div className="font-semibold text-gray-800">₹{courierRates.charge_500g}</div>
                      </div>
                      <div className="p-2 border border-gray-100 rounded bg-gray-50">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Up to 1kg</div>
                        <div className="font-semibold text-gray-800">₹{courierRates.charge_1kg}</div>
                      </div>
                      <div className="p-2 border border-gray-100 rounded bg-gray-50">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Above 1kg</div>
                        <div className="font-semibold text-gray-800">₹{courierRates.charge_above}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Country / Region of origin</label>
                  <select value={form.countryOrigin} onChange={e => update({ countryOrigin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 bg-white">
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">HS (Harmonized System) Code</label>
                  <input type="text" value={form.hsCode} onChange={e => update({ hsCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                    placeholder="e.g. 0901.21" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
