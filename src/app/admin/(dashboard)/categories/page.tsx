'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Folder, CornerDownRight, Loader2, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface CategoryItem {
  _id: string;
  name: string;
  emoji: string;
  slug: string;
  bgColor: string;
  isVisible: boolean;
  order: number;
  parentId: string | null;
  image: string;
  redirectUrl?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [slug, setSlug] = useState('');
  const [bgColor, setBgColor] = useState('from-green-50 to-green-100');
  const [isVisible, setIsVisible] = useState(true);
  const [order, setOrder] = useState(0);
  const [parentId, setParentId] = useState<string>('');
  const [image, setImage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImage(data.url);
      } else {
        showToast('error', data.error || 'Failed to upload image');
      }
    } catch (err) {
      showToast('error', 'Error uploading image');
    } finally {
      setImageUploading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { credentials: 'include' });
      const data = (await res.json()) as { success?: boolean; categories?: CategoryItem[] };
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/categories')
      .then((res) => res.json() as Promise<{ success?: boolean; categories?: CategoryItem[] }>)
      .then((data) => {
        if (isMounted && data.success) {
          setCategories(data.categories || []);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      // Auto-generate slug
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    setSaving(true);

    const payload = {
      name,
      emoji,
      slug,
      bgColor,
      isVisible,
      order: Number(order),
      parentId: parentId || null,
      image,
      redirectUrl,
    };

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
        showToast('success', editingId ? 'Category updated successfully' : 'Category created successfully');
        void fetchCategories();
      } else {
        showToast('error', data.error || 'Failed to save category');
      }
    } catch (err) {
      showToast('error', 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: CategoryItem) => {
    setEditingId(cat._id);
    setName(cat.name);
    setEmoji(cat.emoji);
    setSlug(cat.slug);
    setBgColor(cat.bgColor);
    setIsVisible(cat.isVisible);
    setOrder(cat.order);
    setParentId(cat.parentId || '');
    setImage(cat.image || '');
    setRedirectUrl(cat.redirectUrl || '');
    setShowForm(true);
  };

  const handleDeleteRequest = (cat: CategoryItem) => {
    setConfirmDeleteId(cat._id);
    setConfirmDeleteName(cat.name);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically remove from list immediately
        setCategories(prev => prev.filter(c => c._id !== id));
        showToast('success', 'Category deleted successfully');
        void fetchCategories();
      } else {
        showToast('error', data.error || 'Failed to delete category');
      }
    } catch (err) {
      showToast('error', 'Error deleting category. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmoji('📦');
    setSlug('');
    setBgColor('from-green-50 to-green-100');
    setIsVisible(true);
    setOrder(0);
    setParentId('');
    setImage('');
    setRedirectUrl('');
  };

  // Build tree structure for parent-child render
  const rootCategories = categories.filter(c => !c.parentId);
  const getSubCategories = (pId: string) => categories.filter(c => c.parentId === pId);

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold ${toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
              }`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={18} />
              : <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[9001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Delete Category</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to delete <span className="font-semibold text-gray-800">&ldquo;{confirmDeleteName}&rdquo;</span>? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 text-sm border border-gray-200 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 flex items-center justify-center gap-2 text-sm bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage your product categories, subcategories, and hierarchy</p>
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
          Add Category
        </motion.button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List (Left & Center) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">Category Hierarchy</span>
            <span className="text-xs text-gray-500 font-medium">{categories.length} total categories</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Folder className="mx-auto text-gray-300 mb-3" size={40} />
              No categories found. Click &ldquo;Add Category&rdquo; to create your first one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rootCategories.map(cat => {
                const subCats = getSubCategories(cat._id);
                return (
                  <div key={cat._id} className="p-4 space-y-2">
                    {/* Parent Row */}
                    <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-10 h-10 object-cover rounded-xl border border-gray-150 shrink-0"
                          />
                        ) : (
                          <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 shrink-0 select-none">
                            {cat.emoji || '📦'}
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                            {!cat.isVisible && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Hidden</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">/{cat.slug}</span>
                            {cat.redirectUrl && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Redirects to: {cat.redirectUrl}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(cat)}
                          disabled={deletingId === cat._id}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          title="Delete category"
                        >
                          {deletingId === cat._id
                            ? <Loader2 size={15} className="animate-spin text-red-400" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Row */}
                    {subCats.length > 0 && (
                      <div className="pl-8 space-y-1.5">
                        {subCats.map(sub => (
                          <div key={sub._id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg pl-3 border-l-2 border-dashed border-gray-200 transition-all">
                            <div className="flex items-center gap-2.5">
                              <CornerDownRight size={14} className="text-gray-400 shrink-0" />
                              {sub.image ? (
                                <img
                                  src={sub.image}
                                  alt={sub.name}
                                  className="w-7 h-7 object-cover rounded-md border border-gray-150 shrink-0"
                                />
                              ) : (
                                <span className="text-xl w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 shrink-0 select-none">
                                  {sub.emoji || '📦'}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-700">{sub.name}</span>
                                <span className="text-[10px] text-gray-400">/{sub.slug}</span>
                                {sub.redirectUrl && (
                                  <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                                    → {sub.redirectUrl}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEdit(sub)}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-all"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(sub)}
                                disabled={deletingId === sub._id}
                                className="p-1 hover:bg-red-50 rounded-lg text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                title="Delete subcategory"
                              >
                                {deletingId === sub._id
                                  ? <Loader2 size={13} className="animate-spin text-red-400" />
                                  : <Trash2 size={13} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 text-base">
                  {editingId ? 'Edit Category' : 'New Category'}
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Millet Cereals"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="millet-cereals"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={e => setOrder(Number(e.target.value))}
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Visibility</label>
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 border rounded-xl font-medium transition-colors ${isVisible
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye size={15} /> Visible
                        </>
                      ) : (
                        <>
                          <EyeOff size={15} /> Hidden
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {!image ? (
                    <button
                      type="button"
                      disabled={imageUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 hover:border-[#34a121] hover:bg-green-50/10 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#34a121]/20"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#34a121]/10 group-hover:text-[#34a121] transition-all">
                        {imageUploading ? (
                          <Loader2 size={20} className="animate-spin text-[#34a121]" />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-gray-600 group-hover:text-gray-800">
                        {imageUploading ? 'Uploading image...' : 'Upload category image'}
                      </div>
                      <div className="text-[10px] text-gray-400">JPG, PNG, WEBP or SVG</div>
                    </button>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-gray-150 bg-gray-50 shadow-sm aspect-video max-h-[180px] flex items-center justify-center">
                      <img
                        src={image}
                        alt="Category preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-white text-gray-700 hover:text-gray-900 rounded-xl shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
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
