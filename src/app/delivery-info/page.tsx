import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Truck, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delivery Info | Vivasaya Ulagam",
  description: "Learn about Vivasaya Ulagam's shipping processing times, delivery guidelines, and shipping within India.",
  alternates: {
    canonical: "https://vivasayaulagam.com/delivery-info",
  },
};

export default function DeliveryInfoPage() {
  const deliveryPoints = [
    "Orders are usually processed and shipped within 2–3 business days.",
    "Delivery time may vary based on customer location, but typically takes 4–7 business days.",
    "Currently, shipping is available only within India.",
    "Once the order is shipped, the customer should receive tracking details through email or SMS.",
    "If the product arrives damaged, the customer must contact support within 24 hours of delivery.",
    "Valid damage claims may be eligible for replacement, delivered within 4–5 working days.",
    "No returns and no refunds are accepted after delivery."
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-height)+2rem)] pb-16 px-4 md:px-8">
        <div className="max-w-[900px] mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2 pl-1 font-medium">
            <Link href="/" className="hover:text-[#34a121] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700">Delivery Info</span>
          </nav>

          {/* White Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-12">
            <div className="border-b border-gray-100 pb-6 mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <Truck className="text-[#34a121] w-8 h-8" />
                Delivery Information
              </h1>
              <p className="text-sm text-gray-500 mt-2 pl-1">
                Our shipping policies, processing schedules, and delivery guidelines.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50/50 rounded-xl p-4 border border-green-100/60 flex gap-3 text-sm text-[#234229] leading-relaxed">
                <Info className="text-[#34a121] shrink-0 mt-0.5" size={18} />
                <span>
                  At <strong>Vivasaya Ulagam</strong>, we are committed to delivering the freshest native foods and organic products safely to your doorstep. Below are our standard transit policies.
                </span>
              </div>

              <ul className="space-y-4 pt-2">
                {deliveryPoints.map((point, index) => (
                  <li key={index} className="flex gap-4 items-start text-sm md:text-base text-gray-700 leading-relaxed">
                    <span className="w-6 h-6 rounded-full bg-green-50 text-[#34a121] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-green-100/55">
                      {index + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-12 p-5 bg-amber-50/30 rounded-xl border border-amber-100 flex gap-4 text-xs md:text-sm text-gray-600 leading-relaxed">
                <ShieldCheck className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Secure Shipping & Freshness Guarantee</h4>
                  <p>
                    Each batch is meticulously packed to ensure native freshness is preserved. If you have any inquiries regarding your package status, feel free to contact us via the help channels in the footer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
