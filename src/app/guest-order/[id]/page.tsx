"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Loader2, Package, Calendar, Tag, CreditCard, User, Home, Phone, ShoppingBag, Lock } from "lucide-react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// PDF Invoice Styling (Identical to standard orders for consistent branding)
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#333333" },
  header: { display: "flex", flexDirection: "row", justifyContent: "space-between", borderBottom: "2px solid #2f9e24", paddingBottom: 15, marginBottom: 20 },
  brand: { display: "flex", flexDirection: "column" },
  brandName: { fontSize: 20, fontWeight: "bold", color: "#2f9e24" },
  brandSub: { fontSize: 8, color: "#666666", marginTop: 2 },
  invoiceTitle: { textAlign: "right" },
  title: { fontSize: 24, fontWeight: "bold", color: "#2f9e24" },
  meta: { fontSize: 9, color: "#666666", marginTop: 4 },
  
  addresses: { display: "flex", flexDirection: "row", gap: 20, marginBottom: 20 },
  addressBlock: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 12 },
  addressTitle: { fontSize: 8, color: "#666666", marginBottom: 6, textTransform: "uppercase", fontWeight: "bold" },
  addressText: { fontSize: 9, lineHeight: 1.4 },
  
  orderMetaRow: { display: "flex", flexDirection: "row", gap: 15, marginBottom: 20 },
  metaCard: { flex: 1, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: 8, alignItems: "center" },
  metaCardLabel: { fontSize: 7, color: "#666666", textTransform: "uppercase" },
  metaCardValue: { fontSize: 10, fontWeight: "bold", color: "#2f9e24", marginTop: 2 },

  table: { display: "flex", flexDirection: "column", marginBottom: 20 },
  tableHeader: { display: "flex", flexDirection: "row", backgroundColor: "#2f9e24", padding: 6 },
  tableHeaderCol: { flex: 1, fontSize: 8, textTransform: "uppercase", color: "white", fontWeight: "bold" },
  tableHeaderColRight: { fontSize: 8, textTransform: "uppercase", textAlign: "right", width: 80, color: "white", fontWeight: "bold" },
  tableHeaderColCenter: { fontSize: 8, textTransform: "uppercase", textAlign: "center", width: 50, color: "white", fontWeight: "bold" },
  
  tableRow: { display: "flex", flexDirection: "row", borderBottom: "1px solid #f0f0f0", padding: 6, alignItems: "center" },
  tableRowCol: { flex: 1, fontSize: 9 },
  tableRowColRight: { fontSize: 9, textAlign: "right", width: 80 },
  tableRowColCenter: { fontSize: 9, textAlign: "center", width: 50 },

  totals: { display: "flex", flexDirection: "row", justifyContent: "flex-end" },
  totalsBlock: { width: 200 },
  totalRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalRowLabel: { fontSize: 9, color: "#666666" },
  totalRowValue: { fontSize: 9, textAlign: "right" },
  grandTotalRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", backgroundColor: "#2f9e24", padding: 8, borderRadius: 4, marginTop: 4 },
  grandTotalLabel: { fontSize: 11, fontWeight: "bold", color: "white" },
  grandTotalValue: { fontSize: 11, fontWeight: "bold", textAlign: "right", color: "white" },
  
  footer: { marginTop: 40, borderTop: "1px solid #e5e7eb", paddingTop: 15, textAlign: "center", color: "#999999", fontSize: 8 },
  footerBrand: { color: "#2f9e24", fontWeight: "bold" }
});

const InvoicePDFDocument = ({ order }: { order: any }) => {
  const calculatedSubtotal = (order.items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const subtotal = order.subtotalAmount || calculatedSubtotal;
  const deliveryFee = order.deliveryFee || (order.totalAmount - subtotal);
  const invoiceDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric"
  }) : "";

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.brand}>
            <Text style={pdfStyles.brandName}>Vivasaya Ulagam</Text>
            <Text style={pdfStyles.brandSub}>Agri Products · Tamil Nadu</Text>
            <Text style={{ fontSize: 8, color: "#666666", marginTop: 4 }}>Tamil Nadu, India</Text>
            <Text style={{ fontSize: 8, color: "#666666" }}>Email: vivasayaulagam@gmail.com</Text>
          </View>
          <View style={pdfStyles.invoiceTitle}>
            <Text style={pdfStyles.title}>INVOICE</Text>
            <Text style={pdfStyles.meta}>#{order._id ? order._id.slice(-8).toUpperCase() : "ORDER"}</Text>
            <Text style={pdfStyles.meta}>Date: {invoiceDate}</Text>
            <Text style={{ fontSize: 8, color: "#2f9e24", marginTop: 4, fontWeight: "bold" }}>
              {order.isPaid 
                ? "PAID" 
                : (order.razorpayOrderId ? "ONLINE PAYMENT PENDING" : "CASH ON DELIVERY")}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.addresses}>
          <View style={pdfStyles.addressBlock}>
            <Text style={pdfStyles.addressTitle}>Bill From</Text>
            <Text style={pdfStyles.addressText}>Vivasaya Ulagam</Text>
            <Text style={pdfStyles.addressText}>Agri Products</Text>
            <Text style={pdfStyles.addressText}>Tamil Nadu, India</Text>
          </View>
          <View style={pdfStyles.addressBlock}>
            <Text style={pdfStyles.addressTitle}>Ship To</Text>
            <Text style={pdfStyles.addressText}>{order.shippingAddress?.fullName || "Customer"}</Text>
            <Text style={pdfStyles.addressText}>{order.shippingAddress?.address || ""}</Text>
            <Text style={pdfStyles.addressText}>
              {order.shippingAddress?.city || ""} - {order.shippingAddress?.postalCode || ""}
            </Text>
            <Text style={pdfStyles.addressText}>Phone: {order.shippingAddress?.phone || ""}</Text>
          </View>
        </View>

        <View style={pdfStyles.orderMetaRow}>
          <View style={pdfStyles.metaCard}>
            <Text style={pdfStyles.metaCardLabel}>Order ID</Text>
            <Text style={pdfStyles.metaCardValue}>#{order._id ? order._id.slice(-8).toUpperCase() : "ORDER"}</Text>
          </View>
          <View style={pdfStyles.metaCard}>
            <Text style={pdfStyles.metaCardLabel}>Order Date</Text>
            <Text style={pdfStyles.metaCardValue}>{invoiceDate}</Text>
          </View>
          <View style={pdfStyles.metaCard}>
            <Text style={pdfStyles.metaCardLabel}>Status</Text>
            <Text style={pdfStyles.metaCardValue}>{(order.status || "").toUpperCase()}</Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.tableHeaderCol}>Product</Text>
            <Text style={pdfStyles.tableHeaderColCenter}>Qty</Text>
            <Text style={pdfStyles.tableHeaderColRight}>Unit Price</Text>
            <Text style={pdfStyles.tableHeaderColRight}>Total</Text>
          </View>
          {(order.items || []).map((item: any, idx: number) => (
            <View key={idx} style={pdfStyles.tableRow}>
              <Text style={pdfStyles.tableRowCol}>{item.name}</Text>
              <Text style={pdfStyles.tableRowColCenter}>{item.quantity}</Text>
              <Text style={pdfStyles.tableRowColRight}>₹{Number(item.price).toFixed(2)}</Text>
              <Text style={pdfStyles.tableRowColRight}>₹{Number(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totals}>
          <View style={pdfStyles.totalsBlock}>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalRowLabel}>Subtotal</Text>
              <Text style={pdfStyles.totalRowValue}>₹{Number(subtotal).toFixed(2)}</Text>
            </View>
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.totalRowLabel}>Delivery Fee</Text>
              <Text style={pdfStyles.totalRowValue}>₹{Number(Math.max(0, deliveryFee)).toFixed(2)}</Text>
            </View>
            <View style={pdfStyles.grandTotalRow}>
              <Text style={pdfStyles.grandTotalLabel}>TOTAL</Text>
              <Text style={pdfStyles.grandTotalValue}>₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>Thank you for shopping with Vivasaya Ulagam! 🌿</Text>
          <Text style={{ marginTop: 4 }}>For queries, contact us at vivasayaulagam@gmail.com</Text>
          <Text style={{ marginTop: 6, color: "#ccc" }}>This is a computer-generated invoice and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function GuestOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Verification UI state
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOrder = async (queryToken?: string | null, email?: string, phone?: string) => {
    try {
      setLoading(true);
      setErrorMsg("");

      let url = `/api/orders/guest?id=${orderId}`;
      if (queryToken) {
        url += `&token=${queryToken}`;
      } else if (email) {
        url += `&email=${encodeURIComponent(email)}`;
      } else if (phone) {
        url += `&phone=${encodeURIComponent(phone)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.order) {
        setOrder(data.order);
        setRequiresVerification(false);
        // Persist token in sessionStorage for browser session refresh
        if (queryToken) {
          sessionStorage.setItem(`guest_token_${orderId}`, queryToken);
        } else if (email) {
          sessionStorage.setItem(`guest_email_${orderId}`, email);
        } else if (phone) {
          sessionStorage.setItem(`guest_phone_${orderId}`, phone);
        }
      } else {
        if (res.status === 401) {
          setRequiresVerification(true);
        } else {
          console.error("Order load failed:", data.error);
        }
      }
    } catch (err) {
      console.error("Error loading order detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    // Check query params token first
    const token = searchParams.get("token");
    if (token) {
      fetchOrder(token);
      return;
    }

    // Check sessionStorage for cached token/email/phone
    const cachedToken = sessionStorage.getItem(`guest_token_${orderId}`);
    if (cachedToken) {
      fetchOrder(cachedToken);
      return;
    }

    const cachedEmail = sessionStorage.getItem(`guest_email_${orderId}`);
    if (cachedEmail) {
      fetchOrder(null, cachedEmail);
      return;
    }

    const cachedPhone = sessionStorage.getItem(`guest_phone_${orderId}`);
    if (cachedPhone) {
      fetchOrder(null, undefined, cachedPhone);
      return;
    }

    // Default: try fetching directly (which will prompt verification if not public)
    fetchOrder();
  }, [orderId, searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) {
      setErrorMsg("Please enter an email or phone number.");
      return;
    }

    try {
      setVerifying(true);
      setErrorMsg("");

      const isEmail = verificationInput.includes("@");
      if (isEmail) {
        await fetchOrder(null, verificationInput.trim());
      } else {
        await fetchOrder(null, undefined, verificationInput.trim());
      }
    } catch (err) {
      setErrorMsg("Failed to verify credentials. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setDownloading(true);
      const blob = await pdf(<InvoicePDFDocument order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order._id.slice(-8).toUpperCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF invoice:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-body text-xs font-bold text-black pt-[calc(var(--navbar-height)+2rem)]">
          <Loader2 className="animate-spin text-[#2f9e24] mr-2" size={20} /> Loading order details...
        </div>
        <Footer />
      </>
    );
  }

  if (requiresVerification) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center px-4 py-12 pt-[calc(var(--navbar-height)+3rem)]">
          <div className="w-full max-w-md bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-[0_4px_14px_rgba(0,0,0,0.06)] font-body">
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center text-[#2f9e24]">
                <Lock size={20} />
              </div>
            </div>
            <h2 className="text-center font-heading text-lg font-bold text-black mb-2">Verify Order Ownership</h2>
            <p className="text-center text-xs text-gray-500 leading-relaxed mb-6">
              For security, please enter the email address or phone number used when placing order #{orderId.slice(-8).toUpperCase()}.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. customer@example.com or 9876543210"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#2f9e24] transition-colors"
                />
              </div>

              {errorMsg && (
                <p className="text-red-500 text-xs font-semibold">{errorMsg || "Invalid credentials."}</p>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full h-11 bg-[#2f9e24] hover:bg-[#257d1c] text-white border-0 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Verifying...
                  </>
                ) : (
                  "Verify & View Order"
                )}
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center font-body text-center p-6 pt-[calc(var(--navbar-height)+2rem)] text-[#111111]">
          <Package className="text-gray-300 mb-4" size={56} />
          <h2 className="text-lg font-bold">Order Not Found</h2>
          <p className="text-xs text-gray-500 mt-1.5">We could not load details for this order.</p>
          <Link href="/shop" className="mt-6 px-6 py-2.5 bg-[#2f9e24] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#257d1c]">
            BACK TO SHOP
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const calculatedSubtotal = (order.items || []).reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const subtotal = order.subtotalAmount || calculatedSubtotal;
  const deliveryFee = order.deliveryFee || (order.totalAmount - subtotal);
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toLowerCase();
    if (s === "delivered") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-200 leading-none">
          Delivered
        </span>
      );
    }
    if (s === "shipped") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-200 leading-none">
          Shipped
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-200 leading-none">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200 leading-none">
        {statusStr}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="site-main min-h-screen bg-[#FAF9F5] px-4 sm:px-6 lg:px-8 py-4 lg:py-12 pb-[120px] lg:pb-16 font-body text-[#111111] pt-[calc(var(--navbar-height)+1.5rem)]">
        <div className="max-w-[1140px] mx-auto w-full flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/shop" 
                className="flex items-center justify-center w-9 h-9 bg-white border border-[#e5e5e5] rounded-xl text-gray-600 hover:text-black shadow-sm transition-colors"
                title="Back to Shop"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold font-heading text-black">Guest Order Details</h1>
                <p className="text-xs text-gray-500 mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {isMounted && (
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="hidden lg:flex h-11 items-center gap-2 bg-[#2f9e24] hover:bg-[#257d1c] text-white border-0 px-6 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download size={15} /> Download Invoice
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 flex flex-col gap-6 w-full">
              <div className="bg-white border border-[#e5e5e5] rounded-[14px] p-[16px] lg:p-6 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex flex-col gap-4">
                <h3 className="font-heading font-bold text-sm text-black border-b border-[#eeeeee] pb-3 flex items-center gap-2">
                  <Package size={16} className="text-[#2f9e24]" /> Order Overview
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Order ID</span>
                    <span className="text-[#111111] font-bold">#{order._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Order Date</span>
                    <span className="text-[#111111]">{orderDate}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Status</span>
                    <div className="mt-0.5">{getStatusBadge(order.status)}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Payment Method</span>
                    <span className="text-[#111111] font-bold uppercase">
                      {order.razorpayOrderId 
                        ? (order.isPaid ? "Paid Online" : "Online Payment (Pending)") 
                        : "Cash on Delivery"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e5e5e5] rounded-[14px] p-[16px] lg:p-6 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex flex-col gap-4">
                <h3 className="font-heading font-bold text-sm text-black border-b border-[#eeeeee] pb-3 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#2f9e24]" /> Items Ordered
                </h3>
                
                <div className="hidden lg:block overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#eeeeee]">
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Quantity</th>
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Unit Price</th>
                        <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eeeeee]">
                      {(order.items || []).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-4 text-xs font-bold text-[#111111] flex items-center gap-3">
                            <div className="w-12 h-14 relative overflow-hidden bg-gray-50 border border-[#e5e5e5] rounded flex items-center justify-center">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                              ) : (
                                <span className="text-base">🌿</span>
                              )}
                            </div>
                            <span>{item.name}</span>
                          </td>
                          <td className="py-4 text-xs text-[#111111] text-center font-bold">{item.quantity}</td>
                          <td className="py-4 text-xs text-[#111111] text-right">₹{Number(item.price).toFixed(2)}</td>
                          <td className="py-4 text-xs font-bold text-[#111111] text-right">₹{Number(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden flex flex-col gap-3">
                  {(order.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 border border-[#eeeeee] rounded-xl bg-[#fafafa]">
                      <div className="w-14 h-16 relative overflow-hidden bg-white border border-[#e5e5e5] rounded-lg flex items-center justify-center shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xl">🌿</span>
                        )}
                      </div>
                      
                      <div className="flex-grow min-w-0 flex flex-col justify-center text-xs">
                        <span className="font-bold text-[#111111] truncate">{item.name}</span>
                        <span className="text-gray-400 mt-0.5">Quantity: <strong className="text-[#111111]">{item.quantity}</strong></span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-400">Unit: ₹{Number(item.price).toFixed(2)}</span>
                          <span className="font-bold text-[#2f9e24]">₹{Number(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full">
              <div className="bg-white border border-[#e5e5e5] rounded-[14px] p-[16px] lg:p-6 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex flex-col gap-4">
                <h3 className="font-heading font-bold text-sm text-black border-b border-[#eeeeee] pb-3 flex items-center gap-2">
                  <User size={16} className="text-[#2f9e24]" /> Delivery Information
                </h3>
                
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Recipient Name</span>
                      <span className="text-[#111111] font-bold mt-0.5">{order.shippingAddress?.fullName || "Guest Customer"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 border-t border-[#f7f7f7] pt-2.5">
                    <Home size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Shipping Address</span>
                      <span className="text-[#555555] font-medium leading-relaxed mt-0.5">
                        {order.shippingAddress?.address || "Address details missing"}<br />
                        {order.shippingAddress?.city || ""} - {order.shippingAddress?.postalCode || ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-[#f7f7f7] pt-2.5">
                    <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Phone Contact</span>
                      <span className="text-[#111111] font-bold mt-0.5">{order.shippingAddress?.phone || "Phone number missing"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e5e5e5] rounded-[14px] p-[16px] lg:p-6 shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex flex-col gap-3">
                <h3 className="font-heading font-bold text-sm text-black border-b border-[#eeeeee] pb-3 flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-[#2f9e24]" /> Price Summary
                </h3>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-[#111111] font-bold">₹{Number(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Delivery Fee</span>
                  <span className="text-[#111111] font-bold">₹{Number(deliveryFee).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-[#eeeeee] pt-3 mt-1">
                  <span className="text-sm font-bold text-black">Total Paid</span>
                  <span className="text-base font-extrabold text-[#2f9e24]">₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {isMounted && (
                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="lg:hidden w-full h-11 bg-[#2f9e24] hover:bg-[#257d1c] text-white border-0 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Download Invoice PDF
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
