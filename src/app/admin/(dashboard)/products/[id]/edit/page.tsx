'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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
import { ProductFormData } from '@/app/admin/products/add/page';

const defaultForm: ProductFormData = {
  title: '', description: '', images: [], category: '', categories: [],
  price: '', compareAtPrice: '', unitPrice: '', chargeTax: false, costPerItem: '',
  trackInventory: false, quantity: '', sku: '', barcode: '', continueSelling: false,
  isPhysical: true, weight: '', weightUnit: 'kg', countryOrigin: '', hsCode: '',
  variants: [], seoTitle: '', seoDescription: '', seoSlug: '',
  status: 'draft', productType: '', vendor: '', collections: [], tags: [],
  themeTemplate: 'default',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const update = (fields: Partial<ProductFormData>) =>
    setForm(prev => ({ ...prev, ...fields }));

  // Fetch existing product data
  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.product) {
          const p = data.product;
          setForm({
            title: p.title ?? '',
            description: p.description ?? '',
            images: p.images ?? [],
            category: p.category ?? '',
            categories: p.categories ?? [],
            price: p.price ?? '',
            compareAtPrice: p.compareAtPrice ?? '',
            unitPrice: p.unitPrice ?? '',
            chargeTax: p.chargeTax ?? false,
            costPerItem: p.costPerItem ?? '',
            trackInventory: p.trackInventory ?? false,
            quantity: p.quantity ?? '',
            sku: p.sku ?? '',
            barcode: p.barcode ?? '',
            continueSelling: p.continueSelling ?? false,
            isPhysical: p.isPhysical ?? true,
            weight: p.weight ?? '',
            weightUnit: p.weightUnit ?? 'kg',
            countryOrigin: p.countryOrigin ?? '',
            hsCode: p.hsCode ?? '',
            variants: p.variants ?? [],
            seoTitle: p.seoTitle ?? '',
            seoDescription: p.seoDescription ?? '',
            seoSlug: p.seoSlug ?? '',
            status: p.status ?? 'draft',
            productType: p.productType ?? '',
            vendor: p.vendor ?? '',
            collections: p.collections ?? [],
            tags: p.tags ?? [],
            themeTemplate: p.themeTemplate ?? 'default',
          });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#1F6B3B]" />
          <p className="text-sm font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={28} strokeWidth={1.75} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Product Not Found</h2>
            <p className="text-sm text-gray-500 mt-1">
              The product you are trying to edit does not exist or has been deleted.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} strokeWidth={1.75} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Edit Product</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[260px]">
              {form.title || 'Untitled Product'}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 size={16} strokeWidth={1.75} className="animate-spin" /> : <Save size={16} strokeWidth={1.75} />}
          {saving ? 'Saving...' : 'Update Product'}
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
