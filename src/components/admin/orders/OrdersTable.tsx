"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, Printer, ArrowUpDown,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import OrderEmptyState from "./OrderEmptyState";
import type { OrderFilters } from "./OrdersToolbar";

// ─── Types ───────────────────────────────────────────────────────────────────
interface OrderItem { name: string; price: number; quantity: number; image?: string; }
interface Order {
  _id: string; orderId: string; user: { name: string; email: string } | null;
  items: OrderItem[]; totalAmount: number; status: string; isPaid: boolean;
  createdAt: string; updatedAt: string; paidAt?: string | null;
  shippingAddress?: { fullName?: string; address?: string; city?: string; postalCode?: string; phone?: string; email?: string; };
  subtotalAmount?: number;
  deliveryFee?: number;
  totalWeightKg?: number;
  courierRate?: number;
}
type OrderSortColumn = "orderId" | "user" | "createdAt" | "status" | "totalAmount";

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  delivered:  { pill: "bg-emerald-50 text-emerald-700 border-emerald-200",  dot: "bg-emerald-500" },
  processing: { pill: "bg-blue-50 text-blue-700 border-blue-200",           dot: "bg-blue-500" },
  shipped:    { pill: "bg-violet-50 text-violet-700 border-violet-200",     dot: "bg-violet-500" },
  cancelled:  { pill: "bg-red-50 text-red-600 border-red-200",              dot: "bg-red-500" },
  pending:    { pill: "bg-amber-50 text-amber-700 border-amber-200",        dot: "bg-amber-500" },
};

const STATUS_NEXT: Record<string, { label: string; next: string; cls: string }[]> = {
  pending:    [{ label: "Accept → Processing", next: "processing", cls: "bg-blue-600 hover:bg-blue-700 text-white" }],
  processing: [
    { label: "Mark Shipped",   next: "shipped",   cls: "bg-violet-600 hover:bg-violet-700 text-white" },
    { label: "Cancel Order",   next: "cancelled", cls: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200" },
  ],
  shipped:    [{ label: "Mark Delivered", next: "delivered", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" }],
  delivered:  [],
  cancelled:  [],
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function getOrderSortValue(order: Order, column: OrderSortColumn): string | number {
  if (column === "user") {
    return (order.user?.name || order.user?.email || "").toLowerCase();
  }
  const value = order[column];
  return typeof value === "string" ? value.toLowerCase() : value;
}

function ColumnHeader({
  label,
  col,
  className = "",
  onSort,
}: {
  label: string;
  col?: OrderSortColumn;
  className?: string;
  onSort: (col: OrderSortColumn) => void;
}) {
  return (
    <th
      onClick={() => col && onSort(col)}
      className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap select-none ${col ? "cursor-pointer hover:text-gray-600 transition-colors" : ""} ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {col && <ArrowUpDown size={11} className="text-gray-300" />}
      </div>
    </th>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#f0f0f0]">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${[40,80,50,55,60,45,24][i]}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { pill: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Expanded Detail Panel ────────────────────────────────────────────────────
function OrderDetailPanel({
  order,
  onUpdateStatus,
  updatingId,
  successId,
}: {
  order: Order;
  onUpdateStatus: (orderId: string, dbId: string, next: string) => void;
  updatingId: string | null;
  successId: string | null;
}) {
  const actions = STATUS_NEXT[order.status] ?? [];
  const allStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <td colSpan={8} className="p-0 bg-[#fafafa] border-b border-[#f0f0f0]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Column 1 — Customer & Address */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Customer & Shipping</p>
            <div className="bg-white border border-[#e5e5e5] rounded-[12px] p-4 space-y-2.5 text-sm">
              {[
                ["Name", order.shippingAddress?.fullName || order.user?.name || "—"],
                ["Email", order.shippingAddress?.email || order.user?.email || "—"],
                ["Phone", order.shippingAddress?.phone || "—"],
                ["Address", [order.shippingAddress?.address, order.shippingAddress?.city, order.shippingAddress?.postalCode].filter(Boolean).join(", ") || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
                  <p className="text-gray-700 font-medium leading-tight mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 — Status Controls */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Update Status</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">Current:</span>
                <StatusBadge status={order.status} />
                {successId === order.orderId && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                    <CheckCircle size={13} /> Updated!
                  </span>
                )}
              </div>

              {/* Primary action buttons */}
              {actions.map((a) => (
                <button
                  key={a.next}
                  onClick={() => onUpdateStatus(order.orderId, order._id, a.next)}
                  disabled={updatingId === order.orderId}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all disabled:opacity-50 ${a.cls}`}
                >
                  {updatingId === order.orderId ? <><Loader2 size={13} className="animate-spin" /> Updating...</> : a.label}
                </button>
              ))}

              {/* Manual override */}
              <details className="mt-1 group">
                <summary className="cursor-pointer text-[11px] text-gray-400 hover:text-gray-600 select-none list-none flex items-center gap-1">
                  <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
                  Manual override
                </summary>
                <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                  {allStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateStatus(order.orderId, order._id, s)}
                      disabled={order.status === s || updatingId === order.orderId}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border capitalize transition-all ${
                        order.status === s
                          ? "bg-gray-100 text-gray-300 cursor-default border-gray-100"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </details>

              {/* Invoice */}
              <button
                onClick={() => {
                  const w = window.open(`/api/orders/invoice?orderId=${order._id}`, "_blank");
                  if (w) setTimeout(() => w.print(), 1500);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-[10px] transition-colors"
              >
                <Printer size={13} /> Print / Download Invoice
              </button>
            </div>
          </div>

          {/* Column 3 — Order Items */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Order Items</p>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-[10px] p-2.5">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-lg shrink-0 overflow-hidden">
                    {(item.image?.startsWith("data:") || item.image?.startsWith("/") || item.image?.startsWith("http")) ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{item.image || "🌿"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-800">{item.name}</p>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <span className="text-sm font-bold text-[#34a121] shrink-0">{formatPrice(item.quantity * item.price)}</span>
                </div>
              ))}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-500 px-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-700">{formatPrice(order.subtotalAmount || (order.totalAmount - (order.deliveryFee || 0)))}</span>
                </div>
                {order.totalWeightKg !== undefined && order.totalWeightKg > 0 && (
                  <div className="flex justify-between">
                    <span>Total Weight:</span>
                    <span className="font-semibold text-gray-700">{order.totalWeightKg.toFixed(2)} kg</span>
                  </div>
                )}
                {order.courierRate !== undefined && order.courierRate > 0 && (
                  <div className="flex justify-between">
                    <span>Courier Rate:</span>
                    <span className="font-semibold text-gray-700">₹{order.courierRate} / kg</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Courier Charges:</span>
                  <span className="font-semibold text-gray-700">{formatPrice(order.deliveryFee || 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-gray-200 text-sm font-extrabold text-[#34a121]">
                  <span>Total:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  orders: Order[];
  filters: OrderFilters;
  loading?: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onOrderUpdate: (dbId: string, updatedFields: any) => void;
}

export default function OrdersTable({ orders, filters, loading, selectedIds, onSelectionChange, onOrderUpdate }: Props) {
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [successId, setSuccessId]     = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(10);
  const [sortCol, setSortCol]         = useState<OrderSortColumn | null>(null);
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...orders];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((o) =>
        o.orderId?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q)
      );
    }
    if (filters.status !== "all") list = list.filter((o) => o.status === filters.status);
    if (filters.payment === "paid") list = list.filter((o) => o.isPaid);
    if (filters.payment === "cod")  list = list.filter((o) => !o.isPaid);
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter((o) => new Date(o.createdAt).getTime() >= start.getTime());
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdAt).getTime() <= end.getTime());
    }

    // Sort
    const sortKey = filters.sort || "date_desc";
    list.sort((a, b) => {
      if (sortKey === "date_desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortKey === "date_asc")  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === "amount_desc") return b.totalAmount - a.totalAmount;
      if (sortKey === "amount_asc")  return a.totalAmount - b.totalAmount;
      return 0;
    });

    // Column sort override
    if (sortCol) {
      list.sort((a, b) => {
        const av = getOrderSortValue(a, sortCol);
        const bv = getOrderSortValue(b, sortCol);
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [orders, filters, sortCol, sortDir]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Selection helpers ───────────────────────────────────────────────────────
  const pageIds    = paginated.map((o) => o._id);
  const allOnPage  = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPage = pageIds.some((id) => selectedIds.has(id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allOnPage) pageIds.forEach((id) => next.delete(id));
    else           pageIds.forEach((id) => next.add(id));
    onSelectionChange(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  // ── Column sort toggle ──────────────────────────────────────────────────────
  const handleColSort = (col: OrderSortColumn) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── Status update ───────────────────────────────────────────────────────────
  const updateStatus = useCallback(async (orderId: string, dbId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: dbId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onOrderUpdate(dbId, { status: data.status, isPaid: data.isPaid });
        setSuccessId(orderId);
        setTimeout(() => setSuccessId(null), 2500);
      } else alert("Failed: " + (data.error || "Unknown error"));
    } catch { alert("Network error. Please try again."); }
    finally  { setUpdatingId(null); }
  }, [onOrderUpdate]);

  // ── Column header helper ────────────────────────────────────────────────────
  // ── Empty / Loading ─────────────────────────────────────────────────────────
  if (!loading && filtered.length === 0 && orders.length === 0) {
    return (
      <div className="bg-white border border-[#e5e5e5] rounded-[14px] overflow-hidden">
        <OrderEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-[14px] overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      {/* Table wrapper with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f9f9f9] border-b border-[#f0f0f0]">
            <tr>
              {/* Checkbox column */}
              <th className="pl-4 pr-2 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  ref={(el) => { if (el) el.indeterminate = someOnPage && !allOnPage; }}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-[#34a121] cursor-pointer rounded"
                />
              </th>
              <ColumnHeader label="Order ID"    col="orderId" onSort={handleColSort} />
              <ColumnHeader label="Customer"    col="user" onSort={handleColSort} />
              <ColumnHeader label="Date"        col="createdAt" onSort={handleColSort} />
              <ColumnHeader label="Payment" onSort={handleColSort} />
              <ColumnHeader label="Status"      col="status" onSort={handleColSort} />
              <ColumnHeader label="Total"       col="totalAmount" onSort={handleColSort} />
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f5f5f5]">
            {loading
              ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              : paginated.map((order) => (
                  <React.Fragment key={order._id}>
                    {/* Main row */}
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setExpandedId((prev) => prev === order._id ? null : order._id)}
                      className={`group cursor-pointer transition-colors duration-100 ${
                        expandedId === order._id ? "bg-[#fafffe]" : "hover:bg-[#fafafa]"
                      } ${selectedIds.has(order._id) ? "bg-[#f0fdf4]" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="pl-4 pr-2 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order._id)}
                          onChange={() => toggleOne(order._id)}
                          className="w-3.5 h-3.5 accent-[#34a121] cursor-pointer rounded"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-[#34a121] text-[13px]">
                          {order.orderId || "—"}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-800 text-[13px]">{order.user?.name || "Guest"}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{order.user?.email || "—"}</p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-gray-500 text-[12px] whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          order.isPaid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {order.isPaid ? "✓ Paid" : "COD"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-bold text-gray-800 text-[13px] whitespace-nowrap">
                        {formatPrice(order.totalAmount)}
                      </td>

                      {/* Expand chevron */}
                      <td className="px-4 py-3.5">
                        <motion.div
                          animate={{ rotate: expandedId === order._id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-300 group-hover:text-gray-500"
                        >
                          <ChevronDown size={15} />
                        </motion.div>
                      </td>
                    </motion.tr>

                    {/* Expanded row */}
                    <AnimatePresence>
                      {expandedId === order._id && (
                        <OrderDetailPanel
                          order={order}
                          onUpdateStatus={updateStatus}
                          updatingId={updatingId}
                          successId={successId}
                        />
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}

            {/* No results (when filters applied) */}
            {!loading && filtered.length === 0 && orders.length > 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <p className="text-gray-400 text-sm">No orders match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0] bg-[#fafafa]">
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-[#e5e5e5] rounded-lg text-[12px] bg-white outline-none focus:border-[#34a121] transition-colors"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>of {filtered.length} orders</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pg = i + 1;
              if (totalPages > 5) {
                if (page <= 3) pg = i + 1;
                else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                else pg = page - 2 + i;
              }
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-all ${
                    pg === safePage
                      ? "bg-[#34a121] text-white border border-[#34a121]"
                      : "border border-[#e5e5e5] bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {pg}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e5e5] bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
