import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ShieldCheck, Mail, Phone, Lock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Vivasaya Ulagam",
  description: "Read the Privacy Policy for Vivasaya Ulagam to understand how we collect, process, and protect your personal information.",
  alternates: {
    canonical: "https://vivasayaulagam.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-height)+2rem)] pb-16 px-4 md:px-8">
        <div className="max-w-[900px] mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2 pl-1 font-medium">
            <Link href="/" className="hover:text-[#34a121] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700">Privacy Policy</span>
          </nav>

          {/* White Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-12">
            <div className="border-b border-gray-100 pb-6 mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <ShieldCheck className="text-[#34a121] w-8 h-8" />
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-500 mt-2 pl-1">
                How we collect, use, protect, and handle your data.
              </p>
            </div>

            <div className="text-sm md:text-base text-gray-700 leading-relaxed space-y-8">
              <p>
                At <strong>Vivasaya Ulagam</strong>, accessible from <Link href="/" className="text-[#34a121] hover:underline font-medium">vivasayaulagam.com</Link>, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and protect your data when you visit our website or make a purchase.
              </p>

              {/* Section 1 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  1. Information We Collect
                </h2>
                <p className="mb-3">We may collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Personal Information</strong>: Name, email address, shipping and billing addresses, phone number (when placing an order or contacting us).
                  </li>
                  <li>
                    <strong>Payment Information</strong>: Payment details are securely processed by third-party gateways (e.g., Razorpay, Stripe, PayPal) and not stored on our servers.
                  </li>
                  <li>
                    <strong>Cookies and Usage Data</strong>: We use cookies and similar tracking technologies to improve user experience and analyze website traffic.
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="mb-3">We use the collected data to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process orders and send order confirmations.</li>
                  <li>Provide customer support.</li>
                  <li>Improve our website and services.</li>
                  <li>Send occasional promotional emails (only if you opt in).</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  3. Sharing Your Information
                </h2>
                <p className="mb-3">We do not sell, trade, or rent your personal data. We may share information only with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment processors (for secure transactions).</li>
                  <li>Delivery partners (to fulfill orders).</li>
                  <li>Legal authorities if required by law.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  4. Cookies
                </h2>
                <p className="mb-3">Our site uses cookies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Enable essential site functions (e.g., shopping cart).</li>
                  <li>Analyze usage patterns to improve functionality.</li>
                </ul>
                <p className="mt-3">You can manage cookie preferences via your browser settings.</p>
              </div>

              {/* Section 5 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  5. Guest Checkout
                </h2>
                <p>
                  We allow <strong>guest checkout</strong>, meaning you can place an order without creating an account. However, we still collect necessary information to process and ship your order securely.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  6. Your Rights
                </h2>
                <p className="mb-3">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access or correct your personal data.</li>
                  <li>Request data deletion (subject to legal obligations).</li>
                  <li>Withdraw consent at any time.</li>
                </ul>
                <p className="mt-3">
                  To exercise any of these rights, contact us at{" "}
                  <a href="mailto:vivasayaulagam@gmail.com" className="text-[#34a121] hover:underline font-medium">
                    vivasayaulagam@gmail.com
                  </a>.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  7. Data Security
                </h2>
                <p>
                  We implement security measures to safeguard your information against unauthorized access, alteration, or destruction.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  8. Changes to This Policy
                </h2>
                <p>
                  We reserve the right to update this Privacy Policy. Changes will be posted on this page with an updated effective date.
                </p>
              </div>

              {/* Section 9 */}
              <div className="pt-4 border-t border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-4">
                  9. Contact Us
                </h2>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact:
                </p>
                
                <div className="bg-[#FAF9F5] p-6 rounded-xl border border-gray-150 space-y-3 max-w-md">
                  <div className="font-bold text-gray-900">Vivasaya Ulagam</div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Mail size={16} className="text-[#34a121]" />
                    <a href="mailto:vivasayaulagam@gmail.com" className="hover:underline">
                      vivasayaulagam@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Phone size={16} className="text-[#34a121]" />
                    <a href="tel:+917708631801" className="hover:underline">
                      +91 7708631801
                    </a>
                  </div>
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
