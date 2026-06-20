'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';

const FALLBACK_CATEGORIES = [
  'Herbal Supplements', 'Organic Foods', 'Cold Pressed Oils', 'Herbal Teas',
  'Natural Skincare', 'Ayurvedic Products', 'Seeds & Grains', 'Spices & Masalas', 'Others'
];

type Props = { 
  form: ProductFormData & { categories?: string[] }; 
  update: (f: Partial<ProductFormData & { categories?: string[] }>) => void 
};

export default function CategorySelect({ form, update }: Props) {
  const [open, setOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchDbCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.categories?.length > 0) {
          setDbCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load DB categories in select:', err);
      }
    }
    fetchDbCategories();
  }, []);

  const activeCategoriesList = dbCategories.length > 0 
    ? dbCategories.map(c => c.name) 
    : FALLBACK_CATEGORIES;

  // Selected multi-categories (initialized from form.categories or derived from form.category)
  const selectedCategories = form.categories || (form.category ? [form.category] : []);

  const handleToggleCategory = (cat: string) => {
    let updated: string[];
    if (selectedCategories.includes(cat)) {
      updated = selectedCategories.filter(c => c !== cat);
    } else {
      updated = [...selectedCategories, cat];
    }
    
    // Update both categories array and single category (for backwards compatibility)
    update({
      categories: updated,
      category: updated.length > 0 ? updated[0] : ''
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Product Category Assignment</h2>
      
      <div className="relative">
        <button 
          type="button" 
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-800 bg-white hover:border-gray-400 transition-colors"
        >
          <span className={selectedCategories.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {selectedCategories.length > 0 
              ? `${selectedCategories.length} categories chosen` 
              : 'Assign to product categories'}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <motion.ul 
            initial={{ opacity: 0, y: -6 }} 
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {activeCategoriesList.map(cat => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <li key={cat}>
                  <button 
                    type="button" 
                    onClick={() => handleToggleCategory(cat)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <span>{cat}</span>
                    {isSelected && <Check size={14} className="text-[#34a121]" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </div>

      {/* Selected badges display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3.5">
          {selectedCategories.map(cat => (
            <span 
              key={cat} 
              className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold border border-green-100"
            >
              {cat}
              <button 
                type="button" 
                onClick={() => handleToggleCategory(cat)}
                className="hover:text-red-500 font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
