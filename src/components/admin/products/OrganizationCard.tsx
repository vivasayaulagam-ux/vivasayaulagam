'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, X, ChevronDown } from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

const TEMPLATES = ['Default Product', 'Featured Product', 'Sale Product', 'New Arrival'];

export default function OrganizationCard({ form, update }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !form.tags.includes(val)) update({ tags: [...form.tags, val] });
      setTagInput('');
    }
  };
  const removeTag = (t: string) => update({ tags: form.tags.filter((x: string) => x !== t) });

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Organization</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Type</label>
          <input type="text" value={form.productType} onChange={e => update({ productType: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            placeholder="e.g. Herbal Tea" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Vendor</label>
          <input type="text" value={form.vendor} onChange={e => update({ vendor: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            placeholder="Vivasaya Ullagam" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Collections</label>
          <input type="text" value={form.collections.join(', ')}
            onChange={e => update({ collections: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            placeholder="Best Sellers, New Arrivals" />
          <p className="text-[11px] text-gray-400 mt-1">Separate with commas</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Tags</label>
          <div className="border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-400 min-h-[44px]">
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                  <Tag size={10} />{t}
                  <button type="button" onClick={() => removeTag(t)} className="ml-0.5 text-gray-400 hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                placeholder={form.tags.length ? '' : 'Add tags…'} />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Press Enter or comma to add</p>
        </div>

        {/* Theme template */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Theme Template</label>
          <div className="relative">
            <button type="button" onClick={() => setTemplateOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white hover:border-gray-400 transition-colors">
              <span className="text-gray-800">{form.themeTemplate}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${templateOpen ? 'rotate-180' : ''}`} />
            </button>
            {templateOpen && (
              <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {TEMPLATES.map(t => (
                  <li key={t}>
                    <button type="button" onClick={() => { update({ themeTemplate: t }); setTemplateOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${form.themeTemplate === t ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {t}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
