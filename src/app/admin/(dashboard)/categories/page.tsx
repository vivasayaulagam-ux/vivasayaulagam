'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Folder, CornerDownRight } from 'lucide-react';

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

  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
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
    };

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
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
        void fetchCategories();
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch (err) {
      alert('Error saving category');
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
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        void fetchCategories();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting category');
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
  };

  // Build tree structure for parent-child render
  const rootCategories = categories.filter(c => !c.parentId);
  const getSubCategories = (pId: string) => categories.filter(c => c.parentId === pId);

  return (
    <div className="space-y-6">
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
          className="flex items-center gap-2 bg-[#1F6B3B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-[#154a28] transition-all"
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
                        <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100">
                          {cat.emoji}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                            {!cat.isVisible && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Hidden</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">/{cat.slug}</span>
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
                          onClick={() => handleDelete(cat._id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Row */}
                    {subCats.length > 0 && (
                      <div className="pl-8 space-y-1.5">
                        {subCats.map(sub => (
                          <div key={sub._id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg pl-3 border-l-2 border-dashed border-gray-200 transition-all">
                            <div className="flex items-center gap-2.5">
                              <CornerDownRight size={14} className="text-gray-400" />
                              <span className="text-xl w-7 h-7 flex items-center justify-center rounded-md bg-gray-100">
                                {sub.emoji}
                              </span>
                              <div>
                                <span className="text-xs font-semibold text-gray-700">{sub.name}</span>
                                <span className="text-[10px] text-gray-400 ml-1.5">/{sub.slug}</span>
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
                                onClick={() => handleDelete(sub._id)}
                                className="p-1 hover:bg-red-50 rounded-lg text-gray-400 transition-all"
                              >
                                <Trash2 size={13} />
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
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Emoji / Icon</label>
                    <input
                      type="text"
                      required
                      value={emoji}
                      onChange={e => setEmoji(e.target.value)}
                      placeholder="e.g. 🌾"
                      className="w-full text-center text-lg py-2 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
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
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Parent Category (Optional)</label>
                  <select
                    value={parentId}
                    onChange={e => setParentId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none bg-white transition-colors"
                  >
                    <option value="">None (Root Category)</option>
                    {categories
                      .filter(c => !c.parentId && c._id !== editingId)
                      .map(c => (
                        <option key={c._id} value={c._id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order</label>
                    <input
                      type="number"
                      value={order}
                      onChange={e => setOrder(Number(e.target.value))}
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Visibility</label>
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 border rounded-xl font-medium transition-colors ${
                        isVisible
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Background Gradient (Tailwind Class)</label>
                  <input
                    type="text"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    placeholder="from-green-50 to-green-100"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category Image URL (Optional)</label>
                  <input
                    type="text"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="e.g. /images/rice.jpg"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                  />
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
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-[#1F6B3B] text-white py-2.5 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors"
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
