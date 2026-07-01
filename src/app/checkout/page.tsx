"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  DEFAULT_COURIER_RATES,
  type CourierRates,
  formatWeightKg,
  getCourierBracketLabel,
  getCourierFee,
  parseWeightLabelToKg,
  toWeightKg,
} from "@/lib/shipping";


type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayPaymentFailure = {
  error?: {
    description?: string;
  };
};

type RazorpayCheckout = {
  on: (event: "payment.failed", handler: (response: RazorpayPaymentFailure) => void) => void;
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckout;

type CheckoutSettings = {
  courier_charges?: CourierRates;
};

type PaymentSuccess = { orderId: string };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const INDIAN_STATES = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UT", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" }
];

export default function CheckoutPage() {
  const { items, totalPrice, updateItemMetadata, clearCart, hasHydrated } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [settings, setSettings] = useState<CheckoutSettings>({});
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const isCodEnabled = settings && Number((settings as any).cod_enabled) === 1;

  useEffect(() => {
    if (!isCodEnabled && paymentMethod === "COD") {
      setPaymentMethod("online");
    }
  }, [isCodEnabled, paymentMethod]);
  
  // Custom API Courier Fee
  const [courierFee, setCourierFee] = useState<number | null>(null);
  const [appliedRate, setAppliedRate] = useState<number>(0);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.settings || {});
      })
      .catch(err => console.error("Failed to load settings in checkout", err));
  }, []);

  // Saved Address States
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [useSaved, setUseSaved] = useState<boolean>(false);
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Fetch Saved Default Address
  useEffect(() => {
    if (session?.user) {
      setLoadingAddress(true);
      fetch("/api/customer/default-address")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.defaultAddress && data.defaultAddress.fullName && data.defaultAddress.addressLine1) {
            setSavedAddress(data.defaultAddress);
            setUseSaved(true);
            setShippingAddress(prev => ({
              fullName: prev.fullName || data.defaultAddress.fullName || "",
              address: prev.address || data.defaultAddress.addressLine1 || "",
              city: prev.city || data.defaultAddress.city || "",
              state: prev.state || data.defaultAddress.state || "",
              postalCode: prev.postalCode || data.defaultAddress.pincode || "",
              phone: prev.phone || data.defaultAddress.phone || "",
              email: prev.email || data.defaultAddress.email || session.user?.email || "",
            }));
          } else {
            // Autofill email at least if no saved address is set
            setShippingAddress(prev => ({ ...prev, email: prev.email || session.user?.email || "" }));
          }
        })
        .catch((err) => console.error("Error loading default address", err))
        .finally(() => {
          setLoadingAddress(false);
        });
    }
  }, [session]);

  const handleUseSavedAddress = () => {
    setUseSaved(true);
    if (savedAddress) {
      setShippingAddress({
        fullName: savedAddress.fullName || "",
        address: savedAddress.addressLine1 || "",
        city: savedAddress.city || "",
        state: savedAddress.state || "",
        postalCode: savedAddress.pincode || "",
        phone: savedAddress.phone || "",
        email: savedAddress.email || session?.user?.email || "",
      });
    }
  };

  const handleAddNewAddress = () => {
    setUseSaved(false);
    setShippingAddress({
      fullName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      email: session?.user?.email || "",
    });
  };



  const subtotal = totalPrice();
  const totalWeight = items.reduce((sum, item) => sum + toWeightKg(item.weight, item.weightUnit || "kg", item.name) * item.quantity, 0);

  // Fetch shipping fee dynamically when state or pincode changes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({
          state: shippingAddress.state || "",
          pincode: shippingAddress.postalCode || "",
          subtotal: String(subtotal),
          weight: String(totalWeight),
          items: JSON.stringify(items.map(i => ({ productId: i.id.split("-")[0], quantity: i.quantity, price: i.price, weightKg: toWeightKg(i.weight, i.weightUnit || "kg", i.name) })))
        });
        const res = await fetch(`/api/shipping/calculate?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setCourierFee(data.courier_charge);
          setAppliedRate(data.rate_per_kg || 0);
        } else {
          setCourierFee(null);
          setAppliedRate(0);
        }
      } catch (err) {
        console.error("Failed to calculate shipping:", err);
        setCourierFee(null);
        setAppliedRate(0);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [shippingAddress.state, shippingAddress.postalCode, subtotal, totalWeight, items]);

  const resolvedDeliveryFee = courierFee !== null ? courierFee : 0;
  const hasMissingWeight = false;
  const total = subtotal + resolvedDeliveryFee;

  useEffect(() => {
    if (hasHydrated && !isPaymentProcessing) {
      if (items.length === 0) {
        router.replace("/cart");
        return;
      }
      const hasOutOfStock = items.some((item) => item.isOutOfStock);
      if (hasOutOfStock) {
        alert("Please remove out of stock items from your cart before checking out.");
        router.replace("/cart");
      }
    }
  }, [hasHydrated, items, isPaymentProcessing, router]);

  const handlePayment = async () => {
    // Validate optional email if entered
    if (shippingAddress.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.phone || !shippingAddress.state) {
      alert("Please fill all required shipping details including Town/City, State, and PIN Code.");
      return;
    }

    const Razorpay = window.Razorpay;
    if (paymentMethod === "online" && !Razorpay) {
      alert("Payment gateway is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create order on our backend (which creates razorpay order or handles COD)
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalAmount: total,
          shippingAddress,
          isCod: paymentMethod === "COD",
          paymentMethod,
          saveAsDefault: !useSaved && saveAsDefault
        }),
      });

      const orderData = await res.json();

      if (!res.ok) throw new Error(orderData.error);

      // Check if COD order
      if (orderData.isCod) {
        clearCart();
        router.replace(`/payment-success?orderId=${orderData.viuOrderId || orderData.orderId}&dbOrderId=${orderData.dbOrderId}&token=${orderData.token || ""}&isCod=true`);
        return;
      }


      // Check if simulated
      if (orderData.isSimulated) {
        const isLiveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_live_");
        if (isLiveKey) {
          alert("⚠️ Simulated Transaction: A live Razorpay Key ID was detected in development mode. To prevent accidental real money charges, we are completing a mock transaction automatically for you. To test with real payments, please use a Razorpay Test Key (rzp_test_...) or deploy to production.");
        } else {
          alert("⚠️ Simulated Transaction: Since you are using placeholder Razorpay keys in your .env.local file, we are completing a mock transaction automatically for you so you aren't blocked!");
        }
        
        const verifyRes = await fetch("/api/orders/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_signature",
            dbOrderId: orderData.dbOrderId
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          clearCart();
          router.replace(`/payment-success?orderId=${orderData.viuOrderId || orderData.orderId}&dbOrderId=${orderData.dbOrderId}&token=${orderData.token || ""}`);
        } else {
          alert("Failed to verify simulated payment: " + (verifyData.error || "Unknown error"));
        }
        return;
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
        amount: orderData.amount,
        currency: "INR",
        name: "Vivasaya Ulagam",
        description: "Organic Purchase",
        order_id: orderData.orderId,
        handler: async function (response: RazorpayPaymentResponse) {
          if (isPaymentProcessing) return;
          setIsPaymentProcessing(true);
          try {
            // 3. Verify payment
            const verifyRes = await fetch("/api/orders/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: orderData.dbOrderId
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              router.replace(`/payment-success?orderId=${orderData.viuOrderId || response.razorpay_order_id}&dbOrderId=${orderData.dbOrderId}&token=${orderData.token || ""}`);
            } else {
              alert("Payment verification failed");
              setIsPaymentProcessing(false);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support if amount was deducted.");
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          email: session?.user?.email || shippingAddress.email || "",
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#34a121",
        },
      };

      if (!Razorpay) {
        alert("Payment gateway is unavailable. Please refresh and try again.");
        return;
      }

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment failed: " + (response.error?.description || "Please try again."));
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Please check your network connection";
      alert("Error initiating checkout: " + message);
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <>
        <Navbar />
        <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-[#f9fafb] min-h-screen flex items-center justify-center">
          <div className="text-sm font-semibold text-text-muted">Loading checkout...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (isPaymentProcessing) {
    return (
      <main className="fixed inset-0 z-[9999] flex min-h-[100dvh] w-full items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#34a121]"></div>
          <h2 className="text-xl font-bold text-gray-900">Verifying Payment...</h2>
          <p className="mt-2 text-sm text-gray-500">Please do not close or refresh this page.</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-[#f9fafb] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Checkout Form */}
            <div className="flex-[2] space-y-8">
              
              {/* Checkout Progress */}
              <div className="flex items-center gap-4 text-sm font-heading font-bold mb-8">
                <div className="flex items-center gap-1 text-primary">
                  <CheckCircle2 size={16} /> <span className="underline">Cart</span>
                </div>
                <span className="text-gray-300">-----</span>
                <div className="flex items-center gap-1 text-text-dark">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">2</span> <span>Details</span>
                </div>
                <span className="text-gray-300">-----</span>
                <div className="flex items-center gap-1 text-gray-400">
                  <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">3</span> <span>Payment</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="font-heading font-bold text-xl text-text-dark">Shipping Information</h2>
                  {loadingAddress && (
                    <span className="text-xs text-[#34a121] flex items-center gap-1.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34a121] animate-pulse"></span>
                      Loading saved address...
                    </span>
                  )}
                </div>

                {session?.user && savedAddress && (
                  <div className="mb-6 p-4 rounded-xl border border-[#34a121]/20 bg-[#34a121]/5 space-y-4 font-body">
                    <h3 className="text-sm font-bold text-text-dark flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#34a121] inline-block"></span>
                      Saved Shipping Address
                    </h3>
                    <div className="text-xs text-text-muted bg-white p-3.5 rounded border border-gray-100 shadow-xs space-y-1">
                      <p className="font-semibold text-text-dark">{savedAddress.fullName}</p>
                      <p>{savedAddress.phone}</p>
                      {savedAddress.email && <p>{savedAddress.email}</p>}
                      <p>{savedAddress.addressLine1}</p>
                      {savedAddress.addressLine2 && <p>{savedAddress.addressLine2}</p>}
                      <p>{savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleUseSavedAddress}
                        className={`flex-1 py-2.5 px-4 rounded text-xs font-bold transition-all border ${
                          useSaved
                            ? "bg-black text-white border-black shadow-sm"
                            : "bg-white text-text-dark border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Use Saved Address
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className={`flex-1 py-2.5 px-4 rounded text-xs font-bold transition-all border ${
                          !useSaved
                            ? "bg-black text-white border-black shadow-sm"
                            : "bg-white text-text-dark border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Add New Address
                      </button>
                    </div>
                  </div>
                )}
                
                <form className="space-y-5 font-body">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Full Name *</label>
                    <input 
                      type="text" 
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                      required
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] bg-white" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Phone Number *</label>
                    <input 
                      type="tel" 
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      required
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] bg-white" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Email Address (Optional)</label>
                    <input 
                      type="email" 
                      value={shippingAddress.email}
                      onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                      placeholder="Enter your email address"
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] bg-white" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-dark">Street Address *</label>
                    <input 
                      type="text" 
                      placeholder="House number and street name" 
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                      required
                      className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] mb-2 bg-white" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-dark">Town / City *</label>
                      <input 
                        type="text" 
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        required
                        className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] bg-white" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-dark">State *</label>
                      <select
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        required
                        className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] h-[42px] bg-white"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.name}>{st.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-dark">PIN Code *</label>
                      <input 
                        type="text" 
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                        required
                        className="w-full border border-gray-200 rounded-sm px-3 py-2.5 text-sm outline-none focus:border-[#34a121] bg-white" 
                      />
                    </div>
                  </div>

                  {session?.user && !useSaved && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <input
                        type="checkbox"
                        id="saveAsDefault"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="w-4 h-4 rounded text-[#34a121] focus:ring-[#34a121] border-gray-300 cursor-pointer"
                      />
                      <label htmlFor="saveAsDefault" className="text-xs font-semibold text-text-dark cursor-pointer select-none">
                        Save this as default address
                      </label>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-[calc(var(--navbar-height)+1rem)]">
                <h2 className="font-heading font-bold text-lg text-text-dark mb-6 border-b pb-4">Your Order</h2>
                
                <div className="space-y-3 font-body text-sm mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xl overflow-hidden shrink-0">
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
                        <div>
                          <p className="font-semibold text-text-dark text-xs">{item.name}</p>
                          <p className="text-[11px] text-text-muted">Qty: {item.quantity}</p>
                          <p className="text-[11px] text-text-muted">
                            Weight: {formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg", item.name))}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-text-dark text-xs">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between text-text-muted pt-2">
                    <span>Subtotal</span>
                    <span className="font-heading font-semibold text-text-dark">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Total Weight</span>
                    <span className="font-heading font-semibold text-text-dark">{formatWeightKg(totalWeight)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Courier Charges</span>
                    <span className="font-heading font-semibold text-text-dark">{formatPrice(resolvedDeliveryFee)}</span>
                  </div>
                  {hasMissingWeight && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-700">
                      Some product weights are missing. Admin product weights are required for exact courier charges.
                    </p>
                  )}
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-bold text-text-dark text-base">Total</span>
                    <span className="font-heading font-extrabold text-2xl text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-xs font-bold text-text-dark">Select Payment Method</h3>
                  
                  <div className="space-y-3">
                    {/* Online Payment Option */}
                    <label className={`block border p-4 rounded-sm cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-[#34a121] bg-[#34a121]/5' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === 'online'}
                          onChange={() => setPaymentMethod('online')}
                          className="w-4 h-4 text-[#34a121] focus:ring-[#34a121] border-gray-300 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-text-dark block">Online Payment / Razorpay</span>
                          <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">Pay securely using Cards, UPI, NetBanking or Wallets through Razorpay.</span>
                        </div>
                      </div>
                    </label>

                    {/* Cash on Delivery Option (Only if enabled) */}
                    {isCodEnabled && (
                      <label className={`block border p-4 rounded-sm cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-[#34a121] bg-[#34a121]/5' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="COD"
                            checked={paymentMethod === 'COD'}
                            onChange={() => setPaymentMethod('COD')}
                            className="w-4 h-4 text-[#34a121] focus:ring-[#34a121] border-gray-300 mt-0.5 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-text-dark block">Cash on Delivery (COD)</span>
                            <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">Pay with cash upon delivery of your order.</span>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-black text-white py-3.5 rounded-sm font-bold tracking-wider text-sm hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50"
                >
                  {loading ? "PROCESSING..." : "PLACE ORDER"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
