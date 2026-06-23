"use client";

import React from "react";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { ChevronDown, ChevronUp, Loader2, CheckCircle, Copy } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending:     [{ label: 'Accept → Processing', next: 'processing', color: 'bg-blue-600 text-white' }],
  processing:  [{ label: 'Mark Shipped', next: 'shipped', color: 'bg-purple-600 text-white' }, { label: 'Cancel', next: 'cancelled', color: 'bg-red-100 text-red-700' }],
  shipped:     [{ label: 'Mark Delivered', next: 'delivered', color: 'bg-green-600 text-white' }],
  delivered:   [],
  cancelled:   [],
};

export default function OrderTable({ orders: initialOrders }: { orders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (order: any) => {
    const orderNumber = order.orderId || "—";
    const customerName = order.shippingAddress?.fullName || order.user?.name || "Not provided";
    const phone = order.shippingAddress?.phone || "Not provided";
    const email = order.shippingAddress?.email || order.user?.email || "Not provided";
    const addressLine1 = order.shippingAddress?.address || "Not provided";
    const city = order.shippingAddress?.city || "Not provided";
    const state = order.shippingAddress?.state || "Not provided";
    const pincode = order.shippingAddress?.postalCode || "Not provided";
    const totalAmount = Number(order.totalAmount || 0).toFixed(2);
    const paymentStatus = order.isPaid ? "Paid" : (order.razorpayOrderId ? "Online Pending" : "COD");

    const copiedText = `Order No: ${orderNumber}
Customer Name: ${customerName}
Phone: ${phone}
Email: ${email}
Address: ${addressLine1}
City: ${city}
State: ${state}
Pincode: ${pincode}
Total Amount: ₹${totalAmount}
Payment Status: ${paymentStatus}`;

    navigator.clipboard.writeText(copiedText)
      .then(() => {
        setCopiedId(order._id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        const textArea = document.createElement("textarea");
        textArea.value = copiedText;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          setCopiedId(order._id);
          setTimeout(() => setCopiedId(null), 2000);
        } catch (e) {
          console.error("Fallback copy failed", e);
        }
        document.body.removeChild(textArea);
      });
  };

  const toggleOrder = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const updateStatus = async (orderId: string, dbId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: dbId, status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        // Optimistically update UI without page reload
        setOrders(prev => prev.map(o => 
          o._id === dbId 
            ? { ...o, status: data.status, isPaid: data.isPaid } 
            : o
        ));
        setSuccessId(orderId);
        setTimeout(() => setSuccessId(null), 2000);
      } else {
        alert('Failed to update: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
            <th className="p-4 font-semibold">Order ID</th>
            <th className="p-4 font-semibold">Customer</th>
            <th className="p-4 font-semibold">Amount</th>
            <th className="p-4 font-semibold">Payment</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold">Date</th>
            <th className="p-4 font-semibold">Actions</th>
            <th className="p-4 font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
          {orders.map((order) => (
            <React.Fragment key={order._id}>
              {/* Main Row */}
              <tr 
                onClick={() => toggleOrder(order._id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="p-4">
                  <span className="font-mono font-bold text-primary">{order.orderId || '—'}</span>
                </td>
                <td className="p-4">
                  <p className="font-semibold">{order.user?.name || 'Guest'}</p>
                  <p className="text-xs text-gray-400">{order.user?.email}</p>
                </td>
                <td className="p-4 font-bold">{formatPrice(order.totalAmount)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    order.isPaid 
                      ? 'bg-green-100 text-green-700' 
                      : (order.razorpayOrderId ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')
                  }`}>
                    {order.isPaid 
                      ? '✓ PAID' 
                      : (order.razorpayOrderId ? '💳 ONLINE PENDING' : '💵 COD')}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleCopy(order)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-gray-50 border border-gray-250 hover:border-gray-400 hover:bg-gray-150 rounded-lg text-gray-600 transition-all cursor-pointer whitespace-nowrap border-0"
                  >
                    <Copy size={11} />
                    {copiedId === order._id ? "Copied" : "Copy Details"}
                  </button>
                </td>
                <td className="p-4">
                  {expandedOrderId === order._id
                    ? <ChevronUp size={16} className="text-gray-400" />
                    : <ChevronDown size={16} className="text-gray-400" />
                  }
                </td>
              </tr>
              
              {/* Expanded Details Row */}
              {expandedOrderId === order._id && (
                <tr className="bg-gradient-to-b from-gray-50/80 to-white">
                  <td colSpan={8} className="p-0">
                    <div className="p-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                      
                      {/* Column 1: Customer & Status Update */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer & Shipping</h4>
                        <div className="space-y-1.5 text-sm bg-white border border-gray-100 rounded-lg p-3">
                          <p><span className="text-gray-400 text-xs">Name</span><br/><strong>{order.shippingAddress?.fullName || order.user?.name || '—'}</strong></p>
                          <p><span className="text-gray-400 text-xs">Email</span><br/>{order.shippingAddress?.email || order.user?.email || '—'}</p>
                          <p><span className="text-gray-400 text-xs">Phone</span><br/>{order.shippingAddress?.phone || '—'}</p>
                          <p><span className="text-gray-400 text-xs">Address</span><br/>
                            {[order.shippingAddress?.address, order.shippingAddress?.city, order.shippingAddress?.postalCode].filter(Boolean).join(', ') || '—'}
                          </p>
                          <button
                            onClick={() => handleCopy(order)}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-250 hover:border-gray-400 hover:bg-gray-150 text-gray-700 text-xs font-bold rounded-lg transition-all cursor-pointer border-0"
                          >
                            <Copy size={13} />
                            {copiedId === order._id ? "✓ Copied Details" : "Copy Customer Details"}
                          </button>
                        </div>
                      </div>

                      {/* Column 2: Status Update */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Order Status</h4>
                        
                        {/* Current Status Display */}
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-sm text-gray-500">Current:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[order.status]}`}>
                            {order.status}
                          </span>
                          {successId === order.orderId && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                              <CheckCircle size={14} /> Updated!
                            </span>
                          )}
                        </div>

                        {/* Status Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {(STATUS_TRANSITIONS[order.status] || []).map((action) => (
                            <button
                              key={action.next}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order.orderId, order._id, action.next);
                              }}
                              disabled={updatingId === order.orderId}
                              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 ${action.color}`}
                            >
                              {updatingId === order.orderId ? (
                                <><Loader2 size={14} className="animate-spin" /> Updating...</>
                              ) : action.label}
                            </button>
                          ))}
                          
                          {/* All statuses dropdown for manual override */}
                          <details className="mt-1">
                            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 select-none">
                              Manual override ▾
                            </summary>
                            <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                              {['pending','processing','shipped','delivered','cancelled'].map(s => (
                                <button
                                  key={s}
                                  onClick={(e) => { e.stopPropagation(); updateStatus(order.orderId, order._id, s); }}
                                  disabled={order.status === s || updatingId === order.orderId}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded border capitalize ${
                                    order.status === s 
                                      ? 'bg-gray-100 text-gray-400 cursor-default' 
                                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </details>
                        </div>

                        {/* Invoice Button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const w = window.open(`/api/orders/invoice?orderId=${order._id}`, '_blank');
                              if (w) setTimeout(() => w.print(), 1500);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                          >
                            🖨️ Print / Download Invoice
                          </button>
                        </div>
                      </div>

                      {/* Column 3: Order Items */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-white p-2.5 border border-gray-100 rounded-lg">
                              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl shrink-0 overflow-hidden">
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
                                <p className="text-sm font-semibold truncate">{item.name}</p>
                                <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                              </div>
                              <div className="font-bold text-sm text-primary shrink-0">
                                {formatPrice(item.quantity * item.price)}
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-sm font-bold text-gray-600">Total</span>
                            <span className="text-base font-extrabold text-primary">{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📦</p>
                <p className="font-semibold">No orders found.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
