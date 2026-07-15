"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, Package, CheckCircle, Clock } from "lucide-react";
import { formatWeightKg } from "@/lib/shipping";

type TrackedOrderItem = {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  weightKg?: number;
};

type TrackedOrder = {
  orderId: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items?: TrackedOrderItem[];
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId.trim())}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setError("Order not found. Please check your Order ID and try again.");
      }
    } catch (err) {
      console.error("Order tracking failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ["pending", "processing", "shipped", "delivered"];
  const getStepIndex = (status: string) => statusSteps.indexOf(status);
  const activeStepIndex = order ? Math.max(0, getStepIndex(order.status)) : 0;

  return (
    <>
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 min-h-screen bg-[#f9fafb]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <Package size={48} className="text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-heading font-extrabold text-gray-800">Track Your Order</h1>
            <p className="text-gray-500 mt-2">Enter your Order ID (e.g. VIU001) to see the current status</p>
          </div>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g. VIU001)"
              className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary font-heading font-semibold uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Search size={18} />
              {loading ? "Searching..." : "Track"}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm font-semibold text-center">
              {error}
            </div>
          )}

          {order && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-primary font-heading">{order.orderId}</h2>
                  <p className="text-sm text-gray-500 mt-1">Ordered: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  order.status === "delivered" ? "bg-green-100 text-green-700" :
                  order.status === "shipped" ? "bg-purple-100 text-purple-700" :
                  order.status === "processing" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>{order.status}</span>
              </div>

              {/* Progress Bar */}
              {order.status !== "cancelled" && (
                <div className="mb-8">
                  <div className="flex justify-between items-center relative">
                    <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 -z-0" />
                    <div
                      className="absolute left-0 top-4 h-1 bg-primary transition-all -z-0"
                      style={{ width: `${(activeStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    />
                    {statusSteps.map((step, i) => {
                      const done = i <= activeStepIndex;
                      return (
                        <div key={step} className="flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${done ? "bg-primary border-primary" : "bg-white border-gray-300"}`}>
                            {done ? <CheckCircle size={16} className="text-white" /> : <Clock size={14} className="text-gray-400" />}
                          </div>
                          <p className={`text-[10px] mt-2 font-bold capitalize ${done ? "text-primary" : "text-gray-400"}`}>{step}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Items</h3>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item._id || item.name} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity}
                        {item.weightKg !== undefined && item.weightKg > 0 && (
                          <span className="ml-1 text-gray-400">({formatWeightKg(item.weightKg)})</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-bold text-sm">
                  <span>Total</span>
                  <span className="text-primary text-base">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
