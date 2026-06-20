'use client';
import { motion } from 'framer-motion';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void; errors: Partial<Record<keyof ProductFormData, string>> };

export default function ProductTitleDesc({ form, update, errors }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={e => update({ title: e.target.value })}
            placeholder="Short sleeve t-shirt"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          {/* Simple Rich-text toolbar */}
          <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-400">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
              {['B', 'I', 'U'].map(tag => (
                <button key={tag} type="button"
                  onMouseDown={e => { e.preventDefault(); document.execCommand(tag === 'B' ? 'bold' : tag === 'I' ? 'italic' : 'underline'); }}
                  className="w-7 h-7 rounded text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center">
                  {tag}
                </button>
              ))}
              <div className="w-px h-5 bg-gray-300 mx-1" />
              {['insertUnorderedList', 'insertOrderedList'].map((cmd, i) => (
                <button key={cmd} type="button"
                  onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }}
                  className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center">
                  {i === 0 ? '≡' : '①'}
                </button>
              ))}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={e => update({ description: (e.target as HTMLElement).innerHTML })}
              data-placeholder="Write product description..."
              className="min-h-[140px] px-3.5 py-3 text-sm text-gray-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
