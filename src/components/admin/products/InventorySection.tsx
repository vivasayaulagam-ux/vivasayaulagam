'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, XCircle } from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

export default function InventorySection({ form, update }: Props) {
  // Ensure trackInventory is set to true for correct inventory validation
  useEffect(() => {
    if (!form.trackInventory) {
      update({ trackInventory: true });
    }
  }, [form.trackInventory, update]);

  // Track the last positive quantity to restore when toggled back to 'In Stock'
  const [lastPositiveQty, setLastPositiveQty] = useState<number>(() => {
    const qty = typeof form.quantity === 'number' ? form.quantity : 0;
    return qty > 0 ? qty : 10;
  });

  useEffect(() => {
    const qty = typeof form.quantity === 'number' ? form.quantity : 0;
    if (qty > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastPositiveQty(qty);
    }
  }, [form.quantity]);

  const qty = typeof form.quantity === 'number' ? form.quantity : 0;
  const isInStock = qty > 0;

  const handleQtyChange = (valStr: string) => {
    if (valStr === '') {
      update({ quantity: '' });
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) return;
    
    update({ quantity: val });
  };

  const handleStatusToggle = (newStatus: 'in_stock' | 'out_of_stock') => {
    if (newStatus === 'out_of_stock') {
      update({ quantity: 0 });
    } else {
      update({ quantity: lastPositiveQty });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
        <Package size={16} className="text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-800">Inventory</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Quantity */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Stock Quantity
          </label>
          <div className="relative rounded-lg shadow-sm">
            <input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => handleQtyChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition-all"
              placeholder="0"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Set to 0 to automatically mark as Out of Stock
          </p>
        </div>

        {/* Stock Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Stock Status
          </label>
          
          <div className="flex bg-gray-100/80 p-1 rounded-xl w-full max-w-[280px] border border-gray-200/20">
            <button
              type="button"
              onClick={() => handleStatusToggle('in_stock')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                isInStock
                  ? 'bg-white text-emerald-700 shadow-sm border border-gray-200/40'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <CheckCircle2 size={13} className={isInStock ? 'text-emerald-500' : 'text-gray-400'} />
              In Stock
            </button>
            <button
              type="button"
              onClick={() => handleStatusToggle('out_of_stock')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                !isInStock
                  ? 'bg-white text-rose-600 shadow-sm border border-gray-200/40'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <XCircle size={13} className={!isInStock ? 'text-rose-500' : 'text-gray-400'} />
              Out of Stock
            </button>
          </div>
          
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isInStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-medium text-gray-400">
              Currently {isInStock ? 'available for purchase' : 'unavailable for purchase'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
