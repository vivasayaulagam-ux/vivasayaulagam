'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Globe, Eye, EyeOff, Save, X, Sparkles, Layout } from 'lucide-react';
import Link from 'next/link';

type PageSection = Record<string, unknown>;

interface PageItem {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  sections: PageSection[];
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/pages')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success) {
          setPages(data.pages);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
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
    if (!title || !slug) return;
    setSaving(true);

    const payload = {
      title,
      slug,
      status,
      seoTitle,
      seoDescription,
    };

    try {
      const url = editingId ? `/api/pages/${editingId}` : '/api/pages';
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
        void fetchPages();
      } else {
        alert(data.error || 'Failed to save page');
      }
    } catch (err) {
      alert('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: PageItem) => {
    setEditingId(p._id);
    setTitle(p.title);
    setSlug(p.slug);
    setStatus(p.status);
    setSeoTitle(p.seoTitle || '');
    setSeoDescription(p.seoDescription || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page permanently?')) return;
    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        void fetchPages();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting page');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setStatus('draft');
    setSeoTitle('');
    setSeoDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Pages</h1>
          <p className="text-sm text-gray-500">Create, edit, and organize custom landing pages with visual builders</p>
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
          Create Page
        </motion.button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">Site Pages</span>
            <span className="text-xs text-gray-500 font-medium">{pages.length} total pages</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading pages...</div>
          ) : pages.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Globe className="mx-auto text-gray-300 mb-3" size={40} />
              No custom pages yet. Click &ldquo;Create Page&rdquo; to start!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pages.map(p => (
                <div key={p._id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                      <Layout size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">{p.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          p.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span>Slug: /{p.slug}</span>
                        <span>•</span>
                        <Link href={`/pages/${p.slug}`} target="_blank" className="text-[#1F6B3B] hover:underline">
                          View Live
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Visual builder entry */}
                    <Link
                      href={`/admin/pages/builder/${p._id}`}
                      className="flex items-center gap-1.5 bg-green-50 text-[#1F6B3B] hover:bg-[#1F6B3B] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border border-green-200"
                    >
                      <Sparkles size={13} />
                      Visual Builder
                    </Link>

                    <button
                      onClick={() => handleEdit(p)}
                      className="p-2 hover:bg-gray-150 rounded-xl text-gray-500 hover:text-gray-800 transition-all border border-transparent hover:border-gray-200"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Creation Form (Right) */}
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
                  {editingId ? 'Edit Page Meta' : 'New Custom Page'}
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Page Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="e.g. Organic Millet Festival"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="e.g. organic-millet-festival"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Publish Status</label>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'published' ? 'draft' : 'published')}
                    className={`w-full flex items-center justify-center gap-2 text-sm py-2.5 border rounded-xl font-medium transition-colors ${
                      status === 'published'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {status === 'published' ? (
                      <>
                        <Eye size={15} /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff size={15} /> Draft
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800">SEO Fields (Optional)</h4>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      placeholder="e.g. Custom Meta Title"
                      className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      placeholder="Enter description for Google Search"
                      className="w-full text-xs px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors resize-none"
                    />
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
