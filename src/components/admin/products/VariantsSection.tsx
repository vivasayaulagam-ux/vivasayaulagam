'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Weight } from 'lucide-react';
import { ProductFormData } from '@/app/admin/products/add/page';

type Variant = ProductFormData['variants'][number];
type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '100ml', '250ml', '500ml', '1L', '250g', '500g', '1kg', '2kg', '5kg'];
const COLORS = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown'];
const WEIGHT_PRESETS = ['250g', '500g', '1kg'];

export default function VariantsSection({ form, update }: Props) {
  const addVariant = (type: 'size' | 'color', value = '') =>
    update({ variants: [...form.variants, { type, value, price: '', additionalPrice: '', stock: '' }] });

  const updateVariant = (i: number, fields: Partial<Variant>) => {
    const updated = [...form.variants];
    updated[i] = { ...updated[i], ...fields };
    update({ variants: updated });
  };

  const removeVariant = (i: number) =>
    update({ variants: form.variants.filter((_, idx) => idx !== i) });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Variants & Weight Pricing</h2>
          <p className="text-xs text-gray-500 mt-0.5">Define different prices based on weight or size</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 mr-2 pr-2 border-r border-gray-200">
            {WEIGHT_PRESETS.map(weight => (
              <button key={weight} type="button" onClick={() => addVariant('size', weight)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1F6B3B]/20 bg-[#f2fcf4] text-[11px] font-bold text-[#1F6B3B] hover:bg-[#1F6B3B] hover:text-white transition-colors"
                title={`Quick add ${weight} variant`}>
                <Weight size={12} /> {weight}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => addVariant('size')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Plus size={12} /> Add Size
          </button>
          <button type="button" onClick={() => addVariant('color')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Plus size={12} /> Add Color
          </button>
        </div>
      </div>

      {form.variants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          No variants yet. Click the buttons above to add weight, size, or color options.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-[70px_1fr_110px_110px_80px_36px] gap-2 px-2 mb-1">
            {['Type', 'Weight / Value', 'Direct Price (₹)', 'Extra Price (₹)', 'Stock', ''].map(h => (
              <span key={h} className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>
          <AnimatePresence>
            {form.variants.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-[70px_1fr_110px_110px_80px_36px] gap-2 items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 group transition-colors">
                <span className={`text-[11px] font-bold px-2 py-1.5 rounded-md text-center uppercase tracking-wide ${v.type === 'size' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                  {v.type}
                </span>
                <input 
                  type="text" 
                  value={v.value} 
                  onChange={e => updateVariant(i, { value: e.target.value })}
                  list={`variant-list-${v.type}`}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#1F6B3B]/20 focus:border-[#1F6B3B] bg-white transition-all" 
                  placeholder={v.type === 'size' ? 'e.g. 500g' : 'e.g. Red'} 
                />
                <datalist id={`variant-list-${v.type}`}>
                  {(v.type === 'size' ? SIZES : COLORS).map(opt => <option key={opt} value={opt} />)}
                </datalist>
                
                <input type="number" min={0} value={v.price ?? ''}
                  onChange={e => updateVariant(i, { price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#1F6B3B]/20 focus:border-[#1F6B3B] transition-all font-semibold" placeholder="Base Price" />
                
                <input type="number" value={v.additionalPrice}
                  onChange={e => updateVariant(i, { additionalPrice: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#1F6B3B]/20 focus:border-[#1F6B3B] transition-all text-gray-600" placeholder="+ 0.00" />
                
                <input type="number" min={0} value={v.stock}
                  onChange={e => updateVariant(i, { stock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-[#1F6B3B]/20 focus:border-[#1F6B3B] transition-all" placeholder="0" />
                
                <button type="button" onClick={() => removeVariant(i)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center h-full">
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
