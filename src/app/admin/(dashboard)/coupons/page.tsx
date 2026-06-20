'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Tag, Percent, Search, Eye, EyeOff, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CouponItem {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [minOrderValue, setMinOrderValue] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || discountValue === '') return;
    setSaving(true);

    const payload = {
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      isActive,
    };

    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
        fetchCoupons();
      } else {
        alert(data.error || 'Failed to save coupon');
      }
    } catch (err) {
      alert('Error saving coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: CouponItem) => {
    setEditingId(c._id);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderValue(c.minOrderValue);
    setIsActive(c.isActive);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCoupons();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting coupon');
    }
  };

  const handleToggleActive = async (c: CouponItem) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(prev => prev.map(item => item._id === c._id ? { ...item, isActive: !c.isActive } : item));
      } else {
        alert(data.error || 'Failed to update coupon status');
      }
    } catch (err) {
      alert('Error updating coupon status');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('');
    setIsActive(true);
  };

  const filtered = coupons.filter(
    c => c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Offers</h1>
          <p className="text-sm text-gray-500">Create, manage and distribute promotional discount codes for your customers</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#34a121] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-[#154a28] transition-all"
        >
          <Plus size={16} />
          Create Coupon
        </motion.button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coupon List (Left & Center) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search coupons by code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
              />
            </div>
            <span className="text-xs text-gray-500 font-semibold">{coupons.length} total coupons</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin text-[#34a121]" />
              Loading coupon lists...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Tag className="mx-auto text-gray-300 mb-3" size={40} />
              No coupons found. Click &ldquo;Create Coupon&rdquo; to configure discounts.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                    <th className="p-4 pl-6">Coupon Code</th>
                    <th className="p-4">Discount Value</th>
                    <th className="p-4">Min Order Threshold</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filtered.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-gray-900 text-[13px] flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                          <Percent size={13} />
                        </span>
                        {c.code}
                      </td>
                      <td className="p-4 font-semibold">
                        {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `${formatPrice(c.discountValue)} Off`}
                      </td>
                      <td className="p-4 font-medium text-gray-500">
                        {c.minOrderValue > 0 ? `Above ${formatPrice(c.minOrderValue)}` : 'No Minimum'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                            c.isActive 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-300' 
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {c.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-all inline-block"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-650 transition-all inline-block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Creation/Editing Form (Right) */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base">
                  {editingId ? 'Edit Coupon' : 'Create Coupon'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().trim())}
                    placeholder="e.g. WELCOME10"
                    className="w-full font-mono text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none bg-white transition-colors"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={discountType === 'percentage' ? 100 : undefined}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={discountType === 'percentage' ? '10' : '150'}
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Order Threshold (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderValue}
                      onChange={e => setMinOrderValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 border rounded-xl font-medium transition-colors ${
                        isActive
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-650'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Eye size={15} /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={15} /> Inactive
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="flex-1 text-sm border border-gray-200 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-[#34a121] text-white py-2.5 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors"
                  >
                    <Save size={15} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
