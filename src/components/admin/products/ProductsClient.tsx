'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Upload, Download, Package } from 'lucide-react';
import ProductsToolbar from './ProductsToolbar';
import ProductsTable from './ProductsTable';

export type Product = {
  _id: string;
  title: string;
  category: string;
  categories?: string[];
  price: number;
  compareAtPrice: number;
  quantity: number;
  status: 'active' | 'draft';
  images: string[];
  sku: string;
  vendor: string;
  productType: string;
  createdAt: string;
};

type Props = { products: Product[] };

const PAGE_SIZE = 10;

export default function ProductsClient({ products }: Props) {
  const [localProducts, setLocalProducts] = useState(products);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'createdAt' | 'title' | 'price' | 'quantity'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  // Extract unique categories dynamically from products list
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    localProducts.forEach(p => {
      if (p.category) set.add(p.category);
      if (p.categories && Array.isArray(p.categories)) {
        p.categories.forEach(c => {
          if (c) set.add(c);
        });
      }
    });
    return Array.from(set).sort();
  }, [localProducts]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...localProducts];
    if (search) list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (categoryFilter !== 'all') {
      list = list.filter(p => 
        p.category === categoryFilter || 
        (p.categories && p.categories.includes(categoryFilter))
      );
    }
    list.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [localProducts, search, statusFilter, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => setSelected(prev => {
    const s = new Set(prev);
    if (s.has(id)) {
      s.delete(id);
    } else {
      s.add(id);
    }
    return s;
  });

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(p => p._id)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLocalProducts(prev => prev.filter(product => product._id !== id));
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} product(s)?`)) return;
    const ids = [...selected];
    await Promise.all(ids.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })));
    setLocalProducts(prev => prev.filter(product => !selected.has(product._id)));
    setSelected(new Set());
  };

  const handleBulkStatus = async (status: 'active' | 'draft') => {
    const ids = [...selected];
    await Promise.all(ids.map(id =>
      fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    ));
    setLocalProducts(prev => prev.map(product => selected.has(product._id) ? { ...product, status } : product));
    setSelected(new Set());
  };

  const handleExport = () => {
    const headers = ['Title', 'SKU', 'Category', 'Price', 'Quantity', 'Status'];
    const rows = localProducts.map(product => [
      product.title,
      product.sku,
      product.category,
      String(product.price),
      String(product.quantity),
      product.status,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.csv';
    link.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{localProducts.length} total · {localProducts.filter(p => p.status === 'active').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={15} /> Export
          </button>
          <Link href="/admin/products/add"
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors shadow-sm">
            <Plus size={15} /> Add product
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <ProductsToolbar
        search={search} setSearch={v => { setSearch(v); setPage(1); }}
        statusFilter={statusFilter} setStatusFilter={v => { setStatusFilter(v); setPage(1); }}
        categoryFilter={categoryFilter} setCategoryFilter={v => { setCategoryFilter(v); setPage(1); }}
        uniqueCategories={uniqueCategories}
        sortKey={sortKey} setSortKey={v => { setSortKey(v); setPage(1); }}
        sortDir={sortDir}
        selected={selected}
        onBulkDelete={handleBulkDelete}
        onBulkStatus={handleBulkStatus}
        totalFiltered={filtered.length}
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <Package size={40} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-base font-semibold text-gray-700 mb-1">No products found</h2>
          <p className="text-sm text-gray-400 mb-5">Start adding products to your store</p>
          <Link href="/admin/products/add"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            <Plus size={15} /> Add product
          </Link>
        </motion.div>
      ) : (
        <ProductsTable
          products={paginated}
          selected={selected}
          deleting={deleting}
          sortKey={sortKey}
          sortDir={sortDir}
          toggleSort={toggleSort}
          toggleSelect={toggleSelect}
          toggleAll={toggleAll}
          onDelete={handleDelete}
          allSelected={selected.size === paginated.length && paginated.length > 0}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          totalFiltered={filtered.length}
        />
      )}
    </div>
  );
}
