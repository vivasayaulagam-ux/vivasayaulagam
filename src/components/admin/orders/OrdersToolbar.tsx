"use client";

import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, Download, ChevronDown, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_OPTIONS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_OPTIONS = ["all", "paid", "cod"];
const SORT_OPTIONS = [
  { label: "Newest first", value: "date_desc" },
  { label: "Oldest first", value: "date_asc" },
  { label: "Highest total", value: "amount_desc" },
  { label: "Lowest total", value: "amount_asc" },
];

export interface OrderFilters {
  search: string;
  status: string;
  payment: string;
  sort: string;
  startDate: string;
  endDate: string;
}

interface Props {
  filters: OrderFilters;
  onFiltersChange: (f: OrderFilters) => void;
  selectedCount: number;
  totalCount: number;
  onBulkExport: () => void;
  onClearSelection: () => void;
  onRefresh?: () => void;
}

export default function OrdersToolbar({
  filters,
  onFiltersChange,
  selectedCount,
  totalCount,
  onBulkExport,
  onClearSelection,
  onRefresh,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<OrderFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.payment !== "all" ||
    filters.search ||
    filters.startDate ||
    filters.endDate;

  const clearAll = () =>
    onFiltersChange({
      search: "",
      status: "all",
      payment: "all",
      sort: "date_desc",
      startDate: "",
      endDate: "",
    });

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="space-y-3">
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#e5e5e5] rounded-[10px] outline-none focus:ring-2 focus:ring-[#34a121]/20 focus:border-[#34a121] transition-all placeholder:text-gray-400"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-[10px] transition-all ${
            showFilters || hasActiveFilters
              ? "bg-[#34a121] text-white border-[#34a121]"
              : "bg-white text-gray-600 border-[#e5e5e5] hover:border-gray-300"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 bg-white/30 rounded-full text-[10px] flex items-center justify-center font-bold">
              !
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-[#e5e5e5] rounded-[10px] text-gray-600 outline-none focus:ring-2 focus:ring-[#34a121]/20 focus:border-[#34a121] cursor-pointer transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        <div className="flex-1" />

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 bg-white border border-[#e5e5e5] rounded-[10px] hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        )}

        {/* More actions */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setShowMoreActions((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white border border-[#e5e5e5] rounded-[10px] text-gray-600 hover:bg-gray-50 transition-all"
          >
            More actions
            <ChevronDown size={13} />
          </button>
          <AnimatePresence>
            {showMoreActions && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-[#e5e5e5] rounded-[12px] shadow-lg z-20 overflow-hidden"
              >
                <button
                  onClick={() => { onBulkExport(); setShowMoreActions(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={14} />
                  Export orders (CSV)
                </button>
                <div className="h-px bg-gray-100 mx-3" />
                <button
                  onClick={() => { clearAll(); setShowMoreActions(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter row */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 py-2">
              {/* Status filter */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
                  Status:
                </span>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ status: s })}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                      filters.status === s
                        ? "bg-[#34a121] text-white"
                        : "bg-white border border-[#e5e5e5] text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-gray-200 self-center mx-1 hidden sm:block" />
              {/* Payment filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
                  Payment:
                </span>
                {PAYMENT_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => update({ payment: p })}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                      filters.payment === p
                        ? "bg-[#34a121] text-white"
                        : "bg-white border border-[#e5e5e5] text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {p === "cod" ? "COD" : p}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-gray-200 self-center mx-1 hidden lg:block" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date:
                </span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#e5e5e5] rounded-[10px] text-gray-600 outline-none focus:ring-2 focus:ring-[#34a121]/20 focus:border-[#34a121] transition-all"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => update({ endDate: e.target.value })}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#e5e5e5] rounded-[10px] text-gray-600 outline-none focus:ring-2 focus:ring-[#34a121]/20 focus:border-[#34a121] transition-all"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 ml-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-[#34a121]/8 border border-[#34a121]/20 rounded-[10px]"
          >
            <span className="text-sm font-semibold text-[#34a121]">
              {selectedCount} of {totalCount} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={onBulkExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#34a121] text-white rounded-lg hover:bg-[#124A26] transition-colors"
            >
              <Download size={13} /> Export
            </button>
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={13} /> Deselect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
