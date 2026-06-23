"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import OrdersStatsBar from "./OrdersStatsBar";
import OrdersToolbar, { type OrderFilters } from "./OrdersToolbar";
import OrdersTable from "./OrdersTable";

interface Props { orders: any[]; }

const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "all",
  payment: "all",
  sort: "date_desc",
  startDate: "",
  endDate: "",
};

// CSV export helper
function exportToCSV(orders: any[], selectedIds: Set<string>) {
  const targets = selectedIds.size > 0 ? orders.filter((o) => selectedIds.has(o._id)) : orders;
  const rows = [
    ["Order ID", "Customer", "Email", "Date", "Payment", "Status", "Total (₹)"],
    ...targets.map((o) => [
      o.orderId || "—",
      o.user?.name || "Guest",
      o.user?.email || "—",
      new Date(o.createdAt).toLocaleDateString("en-IN"),
      o.isPaid ? "Paid" : (o.razorpayOrderId ? "Online" : "COD"),
      o.status,
      Number(o.totalAmount || 0).toFixed(2),
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `orders-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersClient({ orders }: Props) {
  const [localOrders, setLocalOrders] = useState<any[]>(orders);
  const [filters, setFilters]       = useState<OrderFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const handleOrderUpdate = useCallback((dbId: string, updatedFields: any) => {
    setLocalOrders((prev) =>
      prev.map((o) => (o._id === dbId ? { ...o, ...updatedFields } : o))
    );
  }, []);

  const handleExport = useCallback(() => exportToCSV(localOrders, selectedIds), [localOrders, selectedIds]);
  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  return (
    <div>
      {/* Stats bar */}
      <OrdersStatsBar orders={localOrders} />

      {/* Card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="bg-white border border-[#e5e5e5] rounded-[14px] p-5"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        {/* Toolbar */}
        <div className="mb-4">
          <OrdersToolbar
            filters={filters}
            onFiltersChange={setFilters}
            selectedCount={selectedIds.size}
            totalCount={localOrders.length}
            onBulkExport={handleExport}
            onClearSelection={handleClearSelection}
          />
        </div>

        {/* Table */}
        <OrdersTable
          orders={localOrders}
          filters={filters}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onOrderUpdate={handleOrderUpdate}
        />
      </motion.div>
    </div>
  );
}
