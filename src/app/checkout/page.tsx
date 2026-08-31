"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, CircleAlert, RefreshCw, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  type CourierRates,
  formatWeightKg,
  getCartItemWeightKg,
} from "@/lib/shipping";
import { getMetaCatalogId } from "@/lib/meta/catalogId";
import { trackInitiateCheckout } from "@/lib/meta/pixel";


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

type PendingPaymentVerification = RazorpayPaymentResponse & {
  dbOrderId: string;
  displayOrderId: string;
  token: string;
};

type VerifyPaymentResponse = {
  success?: boolean;
  error?: string;
  orderId?: string;
  dbOrderId?: string;
  paymentId?: string;
};

const PAYMENT_PROCESSING_MESSAGES = [
  "Processing your payment...",
  "Verifying payment...",
  "Updating your order...",
  "Preparing confirmation...",
];

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
  const [processingStep, setProcessingStep] = useState(0);
  const [pendingVerification, setPendingVerification] = useState<PendingPaymentVerification | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const checkoutInFlightRef = useRef(false);
  const verificationInFlightRef = useRef(false);
  const paymentCompletedRef = useRef(false);

  const isCodEnabled = settings && Number((settings as any).cod_enabled) === 1;

  useEffect(() => {
    if (!isCodEnabled && paymentMethod === "COD") {
      setPaymentMethod("online");
    }
  }, [isCodEnabled, paymentMethod]);

  useEffect(() => {
    if (!isPaymentProcessing) return;
    const interval = window.setInterval(() => {
      setProcessingStep((current) => Math.min(current + 1, PAYMENT_PROCESSING_MESSAGES.length - 1));
    }, 1100);
    return () => window.clearInterval(interval);
  }, [isPaymentProcessing]);
  
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
  const totalWeight = items.reduce((sum, item) => {
    if (item.isFreeShipping) return sum;
    const itemWeight = getCartItemWeightKg(item);
    return sum + itemWeight * item.quantity;
  }, 0);

  // Fetch shipping fee dynamically when state or pincode changes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      try {
        const queryParams = new URLSearchParams({
          state: shippingAddress.state || "",
          pincode: shippingAddress.postalCode || "",
          subtotal: String(subtotal),
          weight: String(totalWeight),
          items: JSON.stringify(items.map(i => ({
            productId: i.productId || i.id.split("-")[0],
            quantity: i.quantity,
            price: i.price,
            weightKg: getCartItemWeightKg(i),
            isFreeShipping: Boolean(i.isFreeShipping),
          })))
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

  // Track Meta Pixel InitiateCheckout event
  const initiateCheckoutTrackedRef = useRef(false);
  useEffect(() => {
    if (!hasHydrated || items.length === 0 || initiateCheckoutTrackedRef.current) return;
    initiateCheckoutTrackedRef.current = true;

    const contentIds = items.map((item) =>
      getMetaCatalogId({
        productId: item.productId,
        id: item.id,
        sku: item.sku,
        variantName: item.variantName,
      })
    );

    const contents = items.map((item) => ({
      id: getMetaCatalogId({
        productId: item.productId,
        id: item.id,
        sku: item.sku,
        variantName: item.variantName,
      }),
      quantity: item.quantity,
      item_price: Number(item.price),
    }));

    const numItems = items.reduce((acc, it) => acc + it.quantity, 0);

    trackInitiateCheckout({
      content_ids: contentIds,
      contents,
      content_type: 'product',
      num_items: numItems,
      value: Number(subtotal),
      currency: 'INR',
    });
  }, [hasHydrated, items, subtotal]);

  const verifyAndCompletePayment = async (
    verification: PendingPaymentVerification
  ): Promise<boolean> => {
    if (paymentCompletedRef.current) return true;
    if (verificationInFlightRef.current) return false;

    verificationInFlightRef.current = true;
    setPendingVerification(verification);
    setVerificationError(null);
    setProcessingStep(0);
    setIsPaymentProcessing(true);

    try {
      const verifyRes = await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: verification.razorpay_order_id,
          razorpay_payment_id: verification.razorpay_payment_id,
          razorpay_signature: verification.razorpay_signature,
          dbOrderId: verification.dbOrderId,
        }),
      });

      const verifyData = (await verifyRes.json().catch(() => ({}))) as VerifyPaymentResponse;
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      const confirmedOrderId = verifyData.orderId || verification.displayOrderId;
      const confirmedDbOrderId = verifyData.dbOrderId || verification.dbOrderId;
      const confirmedPaymentId = verifyData.paymentId || verification.razorpay_payment_id;
      const query = new URLSearchParams({
        orderId: confirmedOrderId,
        dbOrderId: confirmedDbOrderId,
        paymentId: confirmedPaymentId,
      });
      if (verification.token) query.set("token", verification.token);

      console.info("Payment verified; redirecting customer", {
        orderId: confirmedOrderId,
        paymentId: confirmedPaymentId,
      });
      paymentCompletedRef.current = true;
      clearCart();
      router.replace(`/payment-success?${query.toString()}`);
      return true;
    } catch (error) {
      console.error("Payment verification error:", error);
      setVerificationError(error instanceof Error ? error.message : "Payment verification failed");
      setIsPaymentProcessing(false);
      return false;
    } finally {
      verificationInFlightRef.current = false;
    }
  };

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

    if (checkoutInFlightRef.current || verificationInFlightRef.current) return;
    checkoutInFlightRef.current = true;

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
        
        const completed = await verifyAndCompletePayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
          dbOrderId: String(orderData.dbOrderId),
          displayOrderId: orderData.viuOrderId || orderData.orderId,
          token: orderData.token || "",
        });
        if (!completed) {
          checkoutInFlightRef.current = false;
          setLoading(false);
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
          const completed = await verifyAndCompletePayment({
            ...response,
            dbOrderId: String(orderData.dbOrderId),
            displayOrderId: orderData.viuOrderId || response.razorpay_order_id,
            token: orderData.token || "",
          });
          if (!completed) {
            checkoutInFlightRef.current = false;
            setLoading(false);
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
        modal: {
          ondismiss: function () {
            if (!verificationInFlightRef.current) {
              checkoutInFlightRef.current = false;
              setLoading(false);
            }
          },
        },
      };

      if (!Razorpay) {
        alert("Payment gateway is unavailable. Please refresh and try again.");
        checkoutInFlightRef.current = false;
        setLoading(false);
        return;
      }

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        checkoutInFlightRef.current = false;
        setLoading(false);
        alert("Payment failed: " + (response.error?.description || "Please try again."));
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Please check your network connection";
      alert("Error initiating checkout: " + message);
      checkoutInFlightRef.current = false;
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
      <main
        className="fixed inset-0 z-[9999] flex min-h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4"
        aria-busy="true"
      >
        <div className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-7 text-center shadow-2xl sm:p-9" role="status" aria-live="polite">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-60" />
            <div className="absolute inset-1 animate-spin rounded-full border-4 border-green-100 border-t-[#34a121]" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <ShieldCheck className="text-[#2d8f27]" size={30} aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2d8f27]">Secure payment</p>
          <h2 className="mt-3 font-heading text-2xl font-bold text-gray-900">
            {PAYMENT_PROCESSING_MESSAGES[processingStep]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Please do not close, refresh, or go back from this page.</p>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2d8f27] to-[#64bc46] transition-[width] duration-700 ease-out"
              style={{ width: `${((processingStep + 1) / PAYMENT_PROCESSING_MESSAGES.length) * 100}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#34a121]" />
            Verification and order update in progress
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {verificationError && pendingVerification && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-8"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="payment-verification-failed-title"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/60">
              <CircleAlert className="text-red-600" size={44} aria-hidden="true" />
            </div>
            <h2 id="payment-verification-failed-title" className="mt-7 font-heading text-2xl font-bold text-gray-900">
              Payment Verification Failed
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Payment could not be verified. If your amount was deducted, please contact support.
            </p>
            <button
              type="button"
              onClick={() => void verifyAndCompletePayment(pendingVerification)}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <RefreshCw size={17} aria-hidden="true" />
              Retry Verification
            </button>
          </div>
        </div>
      )}
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
                          {item.variantName && (
                            <p className="text-[11px] font-bold text-primary">Variant: {item.variantName}</p>
                          )}
                          {item.sku && (
                            <p className="text-[10px] font-mono text-text-muted">SKU: {item.sku}</p>
                          )}
                          <p className="text-[11px] text-text-muted">Qty: {item.quantity}</p>
                          <p className="text-[11px] text-text-muted">
                            Shipping weight: {item.isFreeShipping ? '0 kg (Free Shipping)' : formatWeightKg(getCartItemWeightKg(item))}
                          </p>
                          {item.isFreeShipping && (
                            <span className="inline-block bg-emerald-100 text-[#34a121] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200 mt-0.5">
                              🚚 Free Shipping
                            </span>
                          )}
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
                  <div className="flex justify-between text-text-muted items-start gap-4">
                    <span>Courier Charge</span>
                    {courierFee !== null && courierFee !== undefined ? (
                      <span className="font-heading font-semibold text-text-dark">{formatPrice(courierFee)}</span>
                    ) : (
                      <span className="text-[11px] text-amber-600 font-semibold text-right max-w-[200px] leading-snug">
                        Enter your delivery address to calculate shipping.
                      </span>
                    )}
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
                  disabled={loading || isPaymentProcessing}
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
