'use client';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

export default function SeoPreview({ form, update }: Props) {
  const slug = form.seoSlug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const title = form.seoTitle || form.title || 'Product Title';
  const desc = form.seoDescription || form.description?.replace(/<[^>]+>/g, '').slice(0, 160) || 'No description yet.';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Search size={15} className="text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700">Search Engine Preview</h2>
      </div>

      {/* Preview */}
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 mb-5">
        <p className="text-[13px] text-gray-500 mb-1">vivasayaullagam.com/products/{slug || 'product-slug'}</p>
        <p className="text-base text-blue-700 font-medium leading-snug hover:underline cursor-pointer">{title}</p>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{desc}</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">SEO Title</label>
            <span className={`text-[11px] ${title.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>{title.length}/60</span>
          </div>
          <input type="text" value={form.seoTitle} onChange={e => update({ seoTitle: e.target.value })}
            placeholder={form.title || 'Page title'}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-600">Meta Description</label>
            <span className={`text-[11px] ${desc.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{desc.length}/160</span>
          </div>
          <textarea rows={3} value={form.seoDescription} onChange={e => update({ seoDescription: e.target.value })}
            placeholder="Describe this page for search engines"
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">URL Handle</label>
          <div className="flex items-center">
            <span className="px-3 py-2.5 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-xs text-gray-500">/products/</span>
            <input type="text" value={form.seoSlug} onChange={e => update({ seoSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder={slug}
              className="flex-1 px-3.5 py-2.5 rounded-r-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
