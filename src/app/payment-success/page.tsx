"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2 } from "lucide-react";
import { getMetaCatalogId } from "@/lib/meta/catalogId";
import { trackPurchase } from "@/lib/meta/pixel";

const purchasedOrdersSet = new Set<string>();

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isCod, setIsCod] = useState(false);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    const id = searchParams.get("orderId");
    const dbId = searchParams.get("dbOrderId");
    const payId = searchParams.get("paymentId");
    const tok = searchParams.get("token");
    const cod = searchParams.get("isCod") === "true";
    if (id) {
      setOrderId(id);
    }
    if (dbId) {
      setDbOrderId(dbId);
    }
    if (payId) {
      setPaymentId(payId);
    }
    if (tok) {
      setToken(tok);
    }
    setIsCod(cod);

    // Track Meta Pixel Purchase event ONLY on verified Razorpay payments (never for COD)
    const targetOrderId = dbId || id;
    if (!targetOrderId || cod || purchaseTrackedRef.current) return;

    async function trackConfirmedPurchase() {
      try {
        const queryParams = new URLSearchParams({ id: targetOrderId! });
        if (tok) queryParams.set("token", tok);

        const res = await fetch(`/api/orders/guest?${queryParams.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.success || !data.order) return;

        const order = data.order;

        // Strict Requirement: Fire Purchase ONLY for verified, paid Razorpay payments (never for COD or unpaid)
        const isVerifiedRazorpayPaid = Boolean(
          order.isPaid === true &&
          order.paymentMethod !== "COD" &&
          !order.isCod &&
          (order.razorpayPaymentId || payId)
        );

        if (!isVerifiedRazorpayPaid) return;

        const uniqueId = String(order.orderId || order._id || targetOrderId);

        // Deduplication: prevent firing again on refresh, re-mount, or browser back
        if (purchasedOrdersSet.has(uniqueId)) return;
        const storageKey = `meta_pixel_purchased_${uniqueId}`;
        if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
          return;
        }

        purchaseTrackedRef.current = true;
        purchasedOrdersSet.add(uniqueId);
        try {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(storageKey, "true");
          }
        } catch {
          // Ignore storage quota/disabled sessionStorage
        }

        const contentIds = (order.items || []).map((item: any) =>
          getMetaCatalogId({
            productId: item.productId,
            sku: item.sku,
            variantName: item.variantName,
          })
        );

        const contents = (order.items || []).map((item: any) => ({
          id: getMetaCatalogId({
            productId: item.productId,
            sku: item.sku,
            variantName: item.variantName,
          }),
          quantity: item.quantity || 1,
          item_price: Number(item.price) || 0,
        }));

        const numItems = (order.items || []).reduce(
          (acc: number, it: any) => acc + (it.quantity || 1),
          0
        );
        const orderValue = Number(order.totalAmount ?? order.subtotalAmount ?? 0);

        trackPurchase({
          content_ids: contentIds,
          contents,
          content_type: 'product',
          num_items: numItems,
          value: orderValue,
          currency: 'INR',
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[MetaPixel] Purchase tracking error:", err);
        }
      }
    }

    void trackConfirmedPurchase();
  }, [searchParams]);

  const handleViewOrder = () => {
    const targetOrderId = dbOrderId || orderId;
    if (!targetOrderId) return;

    if (session && session.user) {
      router.push(`/orders/${targetOrderId}`);
    } else {
      let url = `/guest-order/${targetOrderId}`;
      if (token) {
        url += `?token=${token}`;
      }
      router.push(url);
    }
  };

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/60">
          <CheckCircle2 className="text-[#34a121]" size={48} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <h1 className="mt-7 font-heading text-2xl font-bold text-[#183b20] sm:text-3xl">
          {isCod ? "Order Successful" : "Payment Successful"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600 sm:text-base">
          {isCod
            ? "Thank you! Your Cash on Delivery order has been placed successfully."
            : "Your payment has been received successfully."}
        </p>
        {(orderId || paymentId) && (
          <div className="mt-6 space-y-3">
            {orderId && (
              <div className="rounded-xl border border-green-100 bg-green-50/70 px-4 py-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Order ID</span>
                <span className="mt-1 block break-all font-heading text-base font-bold text-[#236b2c]">{orderId}</span>
              </div>
            )}
            {!isCod && paymentId && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Payment ID</span>
                <span className="mt-1 block break-all font-heading text-sm font-bold text-gray-800">{paymentId}</span>
              </div>
            )}
          </div>
        )}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleViewOrder}
            className="w-full min-h-[48px] rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
          >
            View Order
          </button>
          <button
            type="button"
            onClick={() => router.push("/shop")}
            className="w-full min-h-[48px] rounded-xl border border-green-700 bg-white px-5 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] w-full items-center justify-center bg-white px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#34a121]"></div>
            <h2 className="text-xl font-bold text-gray-900">Loading...</h2>
          </div>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
