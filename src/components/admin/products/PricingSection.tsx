'use client';
import { motion } from 'framer-motion';
import { IndianRupee } from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void; errors: Partial<Record<keyof ProductFormData, string>> };

function NumField({ label, value, onChange, error, hint }: { label: string; value: number | ''; onChange: (v: number | '') => void; error?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IndianRupee size={13} /></span>
        <input type="number" min={0} step="0.01" value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
          className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          placeholder="0.00" />
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function PricingSection({ form, update, errors }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Pricing</h2>

      <div className="grid grid-cols-2 gap-4">
        <NumField label="Price *" value={form.price} onChange={v => update({ price: v })} error={errors.price} />
        <NumField label="Compare-at Price" value={form.compareAtPrice} onChange={v => update({ compareAtPrice: v })} hint="Original price before discount" />
        <NumField label="Unit Price" value={form.unitPrice} onChange={v => update({ unitPrice: v })} />
        <NumField label="Cost per Item" value={form.costPerItem} onChange={v => update({ costPerItem: v })} hint="Customers won't see this" />
      </div>

      {/* Profit display */}
      {form.price !== '' && form.costPerItem !== '' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-gray-50 rounded-lg flex gap-6 text-sm">
          <div>
            <p className="text-xs text-gray-500">Margin</p>
            <p className="font-semibold text-gray-800">
              {form.costPerItem === 0 ? '–' : `${(((Number(form.price) - Number(form.costPerItem)) / Number(form.price)) * 100).toFixed(1)}%`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Profit</p>
            <p className="font-semibold text-green-700">₹{(Number(form.price) - Number(form.costPerItem)).toFixed(2)}</p>
          </div>
        </motion.div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <input type="checkbox" id="chargeTax" checked={form.chargeTax} onChange={e => update({ chargeTax: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
        <label htmlFor="chargeTax" className="text-sm text-gray-700">Charge tax on this product</label>
      </div>
    </motion.div>
  );
}
