"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("orderId");
    if (id) {
      setOrderId(id);
    }
  }, [searchParams]);

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/60">
          <CheckCircle2 className="text-[#34a121]" size={48} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <h1 className="mt-7 font-heading text-2xl font-bold text-[#183b20] sm:text-3xl">Payment Successful</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600 sm:text-base">
          Thank you! Your order has been placed successfully.
        </p>
        {orderId && (
          <div className="mt-6 rounded-xl border border-green-100 bg-green-50/70 px-4 py-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Order ID</span>
            <span className="mt-1 block break-all font-heading text-base font-bold text-[#236b2c]">{orderId}</span>
          </div>
        )}
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="w-full min-h-[48px] rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
          >
            View My Orders
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
