'use client';
import { motion } from 'framer-motion';
import { Globe, EyeOff } from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

export default function StatusCard({ form, update }: Props) {
  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Status</h2>

      <div className="space-y-2">
        {(['active', 'draft'] as const).map(s => (
          <label key={s} onClick={() => update({ status: s })}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.status === s ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.status === s ? 'border-gray-900' : 'border-gray-400'}`}>
              {form.status === s && <div className="w-2 h-2 rounded-full bg-gray-900" />}
            </div>
            <div className="flex items-center gap-2">
              {s === 'active' ? <Globe size={14} className="text-green-500" /> : <EyeOff size={14} className="text-gray-400" />}
              <span className="text-sm font-medium text-gray-800 capitalize">{s}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-3">Sales channels</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Online Store</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {form.status === 'active' ? 'Published' : 'Hidden'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
