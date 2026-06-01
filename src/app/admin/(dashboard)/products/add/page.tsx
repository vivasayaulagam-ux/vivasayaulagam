'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import ProductTitleDesc from '@/components/admin/products/ProductTitleDesc';
import MediaUpload from '@/components/admin/products/MediaUpload';
import CategorySelect from '@/components/admin/products/CategorySelect';
import PricingSection from '@/components/admin/products/PricingSection';
import InventorySection from '@/components/admin/products/InventorySection';
import ShippingSection from '@/components/admin/products/ShippingSection';
import VariantsSection from '@/components/admin/products/VariantsSection';
import SeoPreview from '@/components/admin/products/SeoPreview';
import StatusCard from '@/components/admin/products/StatusCard';
import OrganizationCard from '@/components/admin/products/OrganizationCard';

export type ProductFormData = {
  title: string;
  description: string;
  images: string[];
  category: string;
  categories: string[];
  price: number | '';
  compareAtPrice: number | '';
  unitPrice: number | '';
  chargeTax: boolean;
  costPerItem: number | '';
  trackInventory: boolean;
  quantity: number | '';
  sku: string;
  barcode: string;
  continueSelling: boolean;
  isPhysical: boolean;
  weight: number | '';
  weightUnit: string;
  countryOrigin: string;
  hsCode: string;
  variants: { type: string; value: string; price?: number | ''; additionalPrice: number | ''; stock: number | '' }[];
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  status: 'active' | 'draft';
  productType: string;
  vendor: string;
  collections: string[];
  tags: string[];
  themeTemplate: string;
};

const defaultForm: ProductFormData = {
  title: '', description: '', images: [], category: '', categories: [],
  price: '', compareAtPrice: '', unitPrice: '', chargeTax: false, costPerItem: '',
  trackInventory: false, quantity: '', sku: '', barcode: '', continueSelling: false,
  isPhysical: true, weight: '', weightUnit: 'kg', countryOrigin: '', hsCode: '',
  variants: [], seoTitle: '', seoDescription: '', seoSlug: '',
  status: 'draft', productType: '', vendor: '', collections: [], tags: [],
  themeTemplate: 'default',
};

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const update = (fields: Partial<ProductFormData>) => setForm(prev => ({ ...prev, ...fields }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.price === '' || Number(form.price) < 0) e.price = 'Valid price is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) router.push('/admin/products');
      else alert(data.error || 'Failed to save');
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Add Product</h1>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details below to list a new product</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Product'}
        </motion.button>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* LEFT */}
        <div className="space-y-5">
          <ProductTitleDesc form={form} update={update} errors={errors} />
          <MediaUpload form={form} update={update} />
          <CategorySelect form={form} update={update} />
          <PricingSection form={form} update={update} errors={errors} />
          <InventorySection form={form} update={update} />
          <ShippingSection form={form} update={update} />
          <VariantsSection form={form} update={update} />
          <SeoPreview form={form} update={update} />
        </div>

        {/* RIGHT */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <StatusCard form={form} update={update} />
          <OrganizationCard form={form} update={update} />
        </div>
      </div>
    </div>
  );
}
