'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Package, ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Edit2, Trash2, Eye, TrendingUp, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { Product } from './ProductsClient';
import { format } from 'date-fns';
import { getFullImageUrl } from '@/lib/utils';

type Props = {
  products: Product[];
  selected: Set<string>;
  deleting: string | null;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  toggleSort: (k: any) => void;
  toggleSelect: (id: string) => void;
  toggleAll: () => void;
  onDelete: (id: string) => void;
  allSelected: boolean;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  totalFiltered: number;
};

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ChevronsUpDown size={13} className="text-gray-400 opacity-50" />;
  return sortDir === 'asc' ? <ChevronUp size={13} className="text-gray-700" /> : <ChevronDown size={13} className="text-gray-700" />;
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of stock</span>;
  if (qty <= 5) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{qty} low</span>;
  return <span className="text-sm text-gray-700">{qty} in stock</span>;
}

function ActionsMenu({ product, onDelete, deleting }: { product: Product; onDelete: (id: string) => void; deleting: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
        {deleting === product._id ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
            <Link href={`/admin/products/${product._id}/edit`} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Edit2 size={14} /> Edit product
            </Link>
            <Link href={`/product/${product._id}`} target="_blank" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Eye size={14} /> View on store
            </Link>
            <Link href={`/admin/products/${product._id}/analytics`} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <TrendingUp size={14} /> Analytics
            </Link>
            <div className="border-t border-gray-100" />
            <button onClick={() => { setOpen(false); onDelete(product._id); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const COL_HEADS = [
  { label: 'Image', key: null, sortable: false, cls: 'w-[90px]' },
  { label: 'Product Name', key: 'title' as const, sortable: true, cls: 'w-[260px]' },
  { label: 'Category', key: null, sortable: false, cls: 'w-[140px]' },
  { label: 'Price', key: 'price' as const, sortable: true, cls: 'w-[100px]' },
  { label: 'Stock', key: 'quantity' as const, sortable: true, cls: 'w-[120px]' },
  { label: 'Status', key: null, sortable: false, cls: 'w-[100px]' },
  { label: 'Edit', key: null, sortable: false, cls: 'w-[80px]' },
  { label: 'Delete', key: null, sortable: false, cls: 'w-[80px]' },
];

export default function ProductsTable({
  products, selected, deleting, sortKey, sortDir,
  toggleSort, toggleSelect, toggleAll, onDelete,
  allSelected, page, totalPages, setPage, totalFiltered
}: Props) {
  const PAGE_SIZE = 10;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalFiltered);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {/* Checkbox */}
              <th className="w-10 pl-4 pr-2 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer" />
              </th>
              {COL_HEADS.map(col => (
                <th key={col.label} className={`text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.cls}`}>
                  {col.sortable ? (
                    <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
                      {col.label} <SortIcon col={col.key!} sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {products.map((p, i) => (
                <motion.tr key={p._id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50/70 ${selected.has(p._id) ? 'bg-blue-50/40' : ''}`}>
                  {/* Checkbox */}
                  <td className="pl-4 pr-2 py-3.5">
                    <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)}
                      className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer" />
                  </td>

                  {/* Product Image */}
                  <td className="px-3 py-3.5">
                    <div className="relative group flex-shrink-0">
                      {p.images && p.images[0]
                        ? <img src={getFullImageUrl(p.images[0])} alt={p.title}
                            className="w-11 h-11 object-cover rounded-lg border border-gray-200 group-hover:scale-105 transition-transform duration-200" />
                        : <div className="w-11 h-11 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                      }
                    </div>
                  </td>

                  {/* Product Name */}
                  <td className="px-3 py-3.5">
                    <div className="min-w-0">
                      <Link href={`/admin/products/${p._id}/edit`}
                        className="font-semibold text-gray-900 hover:text-[#34a121] transition-colors truncate block max-w-[240px]">
                        {p.title}
                      </Link>
                      {p.sku && <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {p.sku}</p>}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {p.categories && p.categories.length > 0 ? (
                        p.categories.map((cat) => (
                          <span key={cat} className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-gray-700 rounded-full border border-gray-150 whitespace-nowrap">
                            {cat}
                          </span>
                        ))
                      ) : p.category ? (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-50 text-gray-700 rounded-full border border-gray-150">
                          {p.category}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3.5">
                    <p className="font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                    {p.compareAtPrice > 0 && (
                      <p className="text-xs text-gray-400 line-through">₹{p.compareAtPrice.toLocaleString()}</p>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-3 py-3.5"><StockBadge qty={p.quantity} /></td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      p.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-150'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>

                  {/* Edit */}
                  <td className="px-3 py-3.5">
                    <Link href={`/admin/products/${p._id}/edit`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-[#34a121] transition-all cursor-pointer"
                      aria-label="Edit Product"
                    >
                      <Edit2 size={14} />
                    </Link>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-3.5">
                    <button 
                      onClick={() => onDelete(p._id)}
                      disabled={deleting === p._id}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-300 text-red-600 hover:text-red-700 transition-all cursor-pointer disabled:opacity-50"
                      aria-label="Delete Product"
                    >
                      {deleting === p._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">{from}–{to} of {totalFiltered} products</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-white'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
