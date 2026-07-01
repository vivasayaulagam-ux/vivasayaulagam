"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ArrowRight, X, Mail, Lock, Loader2, Key, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_COURIER_RATES,
  formatWeightKg,
  getCourierBracketLabel,
  getCourierFee,
  parseWeightLabelToKg,
  toWeightKg,
  type CourierRates,
} from "@/lib/shipping";


type CartSettings = {
  cart_banner_enabled?: boolean;
  cart_banner_image?: string;
  cart_banner_title?: string;
  cart_banner_subtitle?: string;
  courier_charges?: CourierRates;
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateItemMetadata, clearCart, totalPrice, hasHydrated } = useCartStore();
  const [settings, setSettings] = useState<CartSettings>({});
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [appliedRate, setAppliedRate] = useState(0);

  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Modal forms state
  const [modalView, setModalView] = useState<"login" | "register" | "forgot_password">("login");

  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalConfirmPassword, setModalConfirmPassword] = useState("");
  const [modalOtp, setModalOtp] = useState("");
  const [modalOtpSent, setModalOtpSent] = useState(false);
  const [modalOtpTimer, setModalOtpTimer] = useState(0);
  const [resolvedEmail, setResolvedEmail] = useState("");

  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalOtpSending, setModalOtpSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    if (!modalOtpSent || modalOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setModalOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [modalOtpTimer, modalOtpSent]);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (authStatus === "authenticated") {
      router.push("/checkout");
    } else {
      setShowLoginModal(true);
    }
  };

  const resetModalState = () => {
    setModalView("login");
    setModalName("");
    setModalEmail("");
    setModalPassword("");
    setModalConfirmPassword("");
    setModalOtp("");
    setModalOtpSent(false);
    setModalOtpTimer(0);
    setResolvedEmail("");
    setModalError("");
    setModalSuccess("");
    setModalLoading(false);
    setModalOtpSending(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleModalSendForgotOtp = async () => {
    if (!modalEmail) {
      setModalError("Please enter your email address first");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalEmail)) {
      setModalError("Please enter a valid email address");
      return;
    }
    setModalError("");
    setModalSuccess("");
    setModalOtpSending(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: modalEmail.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModalOtpSent(true);
        setModalOtpTimer(300); // 5 minutes expiry for password reset
        setResolvedEmail(modalEmail.toLowerCase().trim());
        setModalSuccess("Verification code sent successfully. Please check your email.");
      } else {
        setModalError(data.error || "Failed to send reset code");
      }
    } catch {
      setModalError("Failed to connect to reset service");
    } finally {
      setModalOtpSending(false);
    }
  };

  const handleModalSendOtp = async () => {
    setModalError("");
    setModalSuccess("");

    if (!modalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalEmail)) {
      setModalError("Please enter a valid email address");
      return;
    }

    const emailPayload = modalEmail.toLowerCase().trim();

    if (!modalName || !modalName.trim()) {
      setModalError("Please enter your full name");
      return;
    }
    if (!modalPassword || modalPassword.length < 6) {
      setModalError("Password must be at least 6 characters");
      return;
    }
    if (modalPassword !== modalConfirmPassword) {
      setModalError("Passwords do not match");
      return;
    }

    setModalOtpSending(true);
    try {
      const res = await fetch("/api/auth/register-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modalName.trim(),
          email: emailPayload,
          password: modalPassword,
          confirmPassword: modalConfirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModalOtpSent(true);
        setModalOtpTimer(60);
        setResolvedEmail(emailPayload);
        setModalSuccess("Verification code sent successfully. Please check your email.");
      } else {
        setModalError(data.error || data.message || "Failed to send verification code");
      }
    } catch (err) {
      setModalError("Connection error. Please try again.");
    } finally {
      setModalOtpSending(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (modalView === "forgot_password") {
      if (!modalOtpSent) {
        await handleModalSendForgotOtp();
        return;
      }

      if (!modalOtp) {
        setModalError("Please enter the verification code");
        return;
      }

      if (!modalPassword || modalPassword.length < 6) {
        setModalError("Password must be at least 6 characters");
        return;
      }

      if (modalPassword !== modalConfirmPassword) {
        setModalError("Passwords do not match");
        return;
      }

      setModalLoading(true);
      try {
        const res = await fetch("/api/auth/forgot-password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resolvedEmail,
            otp: modalOtp.trim(),
            password: modalPassword,
            confirmPassword: modalConfirmPassword
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setModalSuccess(data.message || "Password reset successfully!");
          setModalView("login");
          setModalOtpSent(false);
          setModalOtp("");
          setModalPassword("");
          setModalConfirmPassword("");
        } else {
          setModalError(data.error || "Failed to reset password");
        }
      } catch {
        setModalError("Connection error. Please try again.");
      } finally {
        setModalLoading(false);
      }
      return;
    }

    setModalLoading(true);
    try {
      if (modalView === "register") {
        if (!modalOtp) {
          setModalError("Please enter the verification code");
          setModalLoading(false);
          return;
        }

        // 1. Call Register verification endpoint
        const regRes = await fetch("/api/auth/register-email/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resolvedEmail,
            otp: modalOtp.trim(),
          }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          setModalError(regData.error || regData.message || "Registration failed");
          setModalLoading(false);
          return;
        }

        // 2. Auto-login after registration success
        const res = await signIn("credentials", {
          redirect: false,
          email: resolvedEmail,
          password: modalPassword,
        });

        if (res?.error) {
          setModalError(`Registration succeeded, but auto-login failed: ${res.error}. Please sign in manually.`);
          setModalLoading(false);
        } else {
          setShowLoginModal(false);
          resetModalState();
          router.push("/checkout");
          router.refresh();
        }
      } else {
        // LOGIN VIEW: Email & Password
        if (!modalEmail || !modalPassword) {
          setModalError("Please enter your email and password");
          setModalLoading(false);
          return;
        }

        const res = await signIn("credentials", {
          redirect: false,
          email: modalEmail.toLowerCase().trim(),
          password: modalPassword,
        });

        if (res?.error) {
          setModalError(res.error);
          setModalLoading(false);
        } else {
          setShowLoginModal(false);
          resetModalState();
          router.push("/checkout");
          router.refresh();
        }
      }
    } catch (err) {
      setModalError("Authentication failed. Please try again.");
      setModalLoading(false);
    }
  };


  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = (await res.json()) as { success?: boolean; settings?: CartSettings };
        if (data.success) {
          setSettings(data.settings || {});
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);



  const fetchedOnMountRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || items.length === 0) return;
    if (fetchedOnMountRef.current) return;
    fetchedOnMountRef.current = true;

    let cancelled = false;

    async function checkCartStockAndWeight() {
      await Promise.all(
        items.map(async (item) => {
          const [productId, ...variantParts] = item.id.split("-");
          if (!productId || productId === "video") return;

          try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();
            if (cancelled || !data.success || !data.product) return;

            const product = data.product;
            const variantValue = variantParts.join("-");

            // Check if variant or product is out of stock
            let resolvedOutOfStock = false;
            if (variantValue) {
              const variant = product.variants?.find((v: any) => v.value === variantValue);
              if (variant) {
                resolvedOutOfStock = product.trackInventory && (variant.stock <= 0);
              }
            } else {
              resolvedOutOfStock =
                product.is_out_of_stock === true ||
                product.stock_status === "Out of Stock" ||
                product.quantity === 0 ||
                product.stock_quantity === 0 ||
                (product.trackInventory && (product.quantity ?? 0) <= 0);
            }

            const resolvedWeight = variantValue
              ? parseWeightLabelToKg(variantValue, 0, "kg")
              : toWeightKg(undefined, "kg", product.title);

            updateItemMetadata(item.id, {
              isOutOfStock: resolvedOutOfStock,
              weight: resolvedWeight > 0 ? resolvedWeight : item.weight,
              weightUnit: "kg",
            });
          } catch (err) {
            console.error("Failed to load cart item info:", err);
          }
        })
      );
    }

    checkCartStockAndWeight();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  const subtotal = totalPrice();
  const totalWeight = items.reduce((sum, item) => sum + toWeightKg(item.weight, item.weightUnit || "kg", item.name) * item.quantity, 0);
  const hasMissingWeight = false;
  const anyOutOfStock = items.some((item) => item.isOutOfStock);

  useEffect(() => {
    if (!hasHydrated || items.length === 0) {
      const timer = setTimeout(() => {
        setDeliveryFee(prev => prev === 0 ? prev : 0);
      }, 0);
      return () => clearTimeout(timer);
    }
    const queryParams = new URLSearchParams({
      subtotal: String(subtotal),
      weight: String(totalWeight),
      items: JSON.stringify(items.map(i => ({ productId: i.id.split("-")[0], quantity: i.quantity, price: i.price, weightKg: toWeightKg(i.weight, i.weightUnit || "kg", i.name) })))
    });
    fetch(`/api/shipping/calculate?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDeliveryFee(data.courier_charge);
          setAppliedRate(data.rate_per_kg || 0);
        }
      })
      .catch(err => console.error("Failed to calculate shipping in cart:", err));
  }, [items, subtotal, totalWeight, hasHydrated]);

  const total = subtotal + deliveryFee;

  const handleApplyCoupon = () => {
    const code = couponCode.trim();
    setCouponMessage(code ? "This coupon code is not active for the current cart." : "Enter a coupon code to apply.");
  };

  return (
    <>
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-[#f9fafb] min-h-screen">
        {settings.cart_banner_enabled !== false && !loading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="relative w-full h-[160px] md:h-[220px] bg-gradient-to-r from-green-800 to-[#34a121] overflow-hidden flex items-center justify-center text-center px-4 shadow-inner rounded-3xl border border-primary/10">
              {settings.cart_banner_image ? (
                <>
                  <Image
                    src={settings.cart_banner_image}
                    alt="Cart Banner"
                    fill
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0,transparent_100%)] pointer-events-none" />
              )}
              <div className="relative z-10 max-w-3xl space-y-2">
                <h1 className="font-heading font-extrabold text-white text-2xl md:text-3xl leading-tight drop-shadow-sm">
                  {settings.cart_banner_title || "Your Shopping Cart"}
                </h1>
                <p className="font-body text-[11px] md:text-xs text-green-100 max-w-xl mx-auto leading-relaxed drop-shadow-sm">
                  {settings.cart_banner_subtitle || "Review your selected items and proceed to a secure checkout."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(settings.cart_banner_enabled === false || loading) && (
            <h1 className="font-heading font-extrabold text-3xl text-text-dark mb-8 text-center md:text-left">
              Shopping Cart
            </h1>
          )}

          {!hasHydrated ? (
            <div className="text-center py-20">
              <h2 className="text-xl font-heading font-bold text-gray-500">Loading cart...</h2>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-heading font-bold text-gray-500 mb-4">Your cart is empty</h2>
              <Link href="/shop" className="inline-block bg-primary text-white px-8 py-3 rounded-none font-bold hover:bg-primary-dark transition-colors">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Cart Items */}
              <div className="flex-[2] space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hidden md:grid grid-cols-12 gap-4 p-4 bg-[#f3f4f6] text-xs font-heading font-bold text-text-muted uppercase tracking-wider">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -32, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center overflow-hidden"
                    >

                      {/* Desktop View Tabular Columns */}
                      <div className="hidden md:contents">
                        <div className="col-span-6 flex items-center gap-4 w-full">
                          <div className="relative w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                            {(item.image?.startsWith("data:") || item.image?.startsWith("/") || item.image?.startsWith("http")) ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                unoptimized={item.image?.startsWith("http")}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl">{item.image || "🌿"}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-body font-semibold text-text-dark text-sm leading-tight mb-1">{item.name}</h3>
                            <p className="text-[11px] font-semibold text-text-muted">
                              Weight: {formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg", item.name))}
                              {toWeightKg(item.weight, item.weightUnit || "kg", item.name) > 0 && item.quantity > 1
                                ? ` x ${item.quantity} = ${formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg", item.name) * item.quantity)}`
                                : ""}
                            </p>
                            {item.isOutOfStock && (
                              <span className="inline-block bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mt-1.5 border border-rose-200">
                                Out of Stock
                              </span>
                            )}
                            <button onClick={() => removeItem(item.id)} className="text-alert-red text-xs flex items-center gap-1 mt-2 hover:underline bg-transparent border-0 p-0 cursor-pointer">
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 font-heading font-bold text-sm text-center w-full">
                          {formatPrice(item.price)}
                        </div>

                        <div className="col-span-2 flex justify-center w-full">
                          <div className="flex items-center border border-gray-200 rounded-none h-9 bg-[#f9fafb]">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="w-8 flex justify-center items-center text-text-dark hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
                            >
                              <Minus size={14} />
                            </button>
                            <motion.span
                              key={item.quantity}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="font-heading font-bold text-xs w-8 text-center"
                            >
                              {item.quantity}
                            </motion.span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 flex justify-center items-center text-text-dark hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 font-heading font-bold text-sm text-primary text-right w-full">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>

                      {/* Mobile View Responsive Split Layout */}
                      <div className="md:hidden flex gap-4 w-full items-start">
                        {/* Left: Product Thumbnail */}
                        <div className="relative w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-150">
                          {(item.image?.startsWith("data:") || item.image?.startsWith("/") || item.image?.startsWith("http")) ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              unoptimized={item.image?.startsWith("http")}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">{item.image || "🌿"}</span>
                          )}
                        </div>

                        {/* Right: Info and Control Area */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Title and delete */}
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-body font-semibold text-text-dark text-xs sm:text-sm leading-snug line-clamp-2">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-alert-red p-1 bg-transparent border-0 cursor-pointer shrink-0"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {item.isOutOfStock && (
                            <span className="inline-block bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-rose-200">
                              Out of Stock
                            </span>
                          )}

                          {/* Price block */}
                          <div className="text-xs font-semibold text-text-muted">
                            Unit Price: <span className="font-heading font-bold text-text-dark">{formatPrice(item.price)}</span>
                          </div>
                          <div className="text-xs font-semibold text-text-muted">
                            Weight: <span className="font-heading font-bold text-text-dark">{formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg", item.name))}</span>
                          </div>


                          {/* Quantity and subtotal row */}
                          <div className="flex items-center justify-between pt-1 gap-2">
                            {/* Quantity selector */}
                            <div className="flex items-center border border-gray-200 rounded-none h-8 bg-[#f9fafb]">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-full flex justify-center items-center text-text-dark hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <motion.span
                                key={item.quantity}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-heading font-bold text-xs w-6 text-center select-none"
                              >
                                {item.quantity}
                              </motion.span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-full flex justify-center items-center text-text-dark hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Line total price */}
                            <div className="font-heading font-bold text-xs sm:text-sm text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>

                        </div>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex justify-between items-center mt-6">
                  <Link href="/shop" className="text-sm font-body font-semibold text-text-dark hover:text-primary border-b border-text-dark hover:border-primary pb-0.5 transition-colors">
                    ← Continue Shopping
                  </Link>
                  <button onClick={clearCart} className="text-sm font-body font-semibold text-alert-red hover:underline">
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-[calc(var(--navbar-height)+1rem)]">
                  <h2 className="font-heading font-bold text-lg text-text-dark mb-6 border-b pb-4">Order Summary</h2>

                  <div className="space-y-4 font-body text-sm mb-6">
                    <div className="flex justify-between text-text-muted">
                      <span>Subtotal</span>
                      <span className="font-heading font-semibold text-text-dark">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Total Weight</span>
                      <span className="font-heading font-semibold text-text-dark">{formatWeightKg(totalWeight)}</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Courier Charges</span>
                      <span className="font-heading font-semibold text-text-dark">{formatPrice(deliveryFee)}</span>
                    </div>
                    {hasMissingWeight && (
                      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-700">
                        One or more products do not have weight set. Add product weight in admin for exact courier charges.
                      </p>
                    )}
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="font-bold text-text-dark text-base">Total</span>
                      <span className="font-heading font-extrabold text-2xl text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {anyOutOfStock ? (
                    <div className="space-y-3">
                      <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs font-bold leading-relaxed text-rose-600 border border-rose-100 text-center">
                        Remove out of stock items to continue checkout.
                      </p>
                      <button
                        disabled
                        className="w-full bg-gray-400 text-white py-3.5 rounded-none flex items-center justify-center gap-2 font-bold tracking-wider text-sm cursor-not-allowed opacity-60 shadow-none border-0"
                      >
                        PROCEED TO CHECKOUT <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckoutClick}
                      className="w-full bg-black text-white py-3.5 rounded-none flex items-center justify-center gap-2 font-bold tracking-wider text-sm hover:bg-gray-800 transition-colors shadow-md border-0 cursor-pointer"
                    >
                      PROCEED TO CHECKOUT <ArrowRight size={16} />
                    </button>
                  )}

                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-text-dark mb-2">Have a coupon code?</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value);
                          setCouponMessage("");
                        }}
                        placeholder="Enter code"
                        className="flex-1 border border-gray-200 rounded-none px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-[#f3f4f6] px-4 rounded-none text-xs font-bold hover:bg-gray-200"
                      >
                        APPLY
                      </button>
                    </div>
                    {couponMessage && (
                      <p className="mt-2 text-xs font-medium text-text-muted">{couponMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Checkout Login Popup Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowLoginModal(false); resetModalState(); }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col font-body"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <h3 className="font-heading font-bold text-lg text-text-dark">
                  {modalView === "forgot_password"
                    ? "Reset Password"
                    : modalView === "register"
                      ? "Create New Account"
                      : "Checkout Verification"}
                </h3>
                <button
                  onClick={() => { setShowLoginModal(false); resetModalState(); }}
                  className="text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 transition-colors flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-semibold">
                    {modalError}
                  </div>
                )}
                {modalSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-semibold">
                    {modalSuccess}
                  </div>
                )}

                <form onSubmit={handleModalSubmit} className="space-y-4">
                  {modalView === "login" ? (
                    <div className="space-y-4">
                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type="email"
                            required
                            value={modalEmail}
                            onChange={(e) => setModalEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Password *</label>
                          <button
                            type="button"
                            onClick={() => {
                              setModalView("forgot_password");
                              setModalError("");
                              setModalSuccess("");
                              setModalOtpSent(false);
                              setModalOtp("");
                              setModalPassword("");
                              setModalConfirmPassword("");
                            }}
                            className="text-xs text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={modalPassword}
                            onChange={(e) => setModalPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center font-bold"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Login Button */}
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="w-full bg-black text-white py-3 rounded-lg font-bold tracking-wider text-xs hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                      >
                        {modalLoading ? <><Loader2 size={14} className="animate-spin" /> LOGGING IN...</> : "LOGIN & PROCEED"}
                      </button>

                      {/* Registration Toggle */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModalView("register");
                            setModalError("");
                            setModalSuccess("");
                            setModalOtpSent(false);
                            setModalOtp("");
                            setModalPassword("");
                            setModalConfirmPassword("");
                          }}
                          className="text-xs text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
                        >
                          New customer? Create New Account / Register with Email
                        </button>
                      </div>
                    </div>
                  ) : modalView === "register" ? (
                    /* REGISTER VIEW */
                    <div className="space-y-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type="text"
                            required
                            disabled={modalOtpSent}
                            value={modalName}
                            onChange={(e) => setModalName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary disabled:bg-gray-50"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type="email"
                            required
                            disabled={modalOtpSent}
                            value={modalEmail}
                            onChange={(e) => setModalEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary disabled:bg-gray-50"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={modalOtpSent}
                            value={modalPassword}
                            onChange={(e) => setModalPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary disabled:bg-gray-50"
                          />
                          <button
                            type="button"
                            disabled={modalOtpSent}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center disabled:opacity-50"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Confirm Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            disabled={modalOtpSent}
                            value={modalConfirmPassword}
                            onChange={(e) => setModalConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary disabled:bg-gray-50"
                          />
                          <button
                            type="button"
                            disabled={modalOtpSent}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center disabled:opacity-50"
                          >
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Register OTP */}
                      {modalOtpSent && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Verification Code (OTP) *</label>
                            {modalOtpTimer > 0 ? (
                              <span className="text-[10px] text-gray-400">Resend in {modalOtpTimer}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleModalSendOtp}
                                className="text-[10px] text-primary hover:underline bg-transparent border-0 cursor-pointer"
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={modalOtp}
                              onChange={(e) => setModalOtp(e.target.value)}
                              placeholder="Enter 6-digit code"
                              className="w-full pl-9 pr-4 py-2.5 text-sm text-center font-bold tracking-widest border border-gray-200 rounded-lg outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      )}

                      {/* Register Buttons */}
                      {!modalOtpSent ? (
                        <button
                          type="button"
                          onClick={handleModalSendOtp}
                          disabled={modalOtpSending}
                          className="w-full bg-[#34a121] hover:bg-[#28801a] text-white py-3 rounded-lg font-bold tracking-wider text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                        >
                          {modalOtpSending ? <><Loader2 size={14} className="animate-spin" /> SENDING OTP...</> : "REGISTER & SEND OTP"}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={modalLoading}
                          className="w-full bg-black text-white py-3 rounded-lg font-bold tracking-wider text-xs hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                        >
                          {modalLoading ? <><Loader2 size={14} className="animate-spin" /> REGISTERING...</> : "VERIFY & REGISTER"}
                        </button>
                      )}

                      {/* Sign In Toggle */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModalView("login");
                            setModalError("");
                            setModalSuccess("");
                            setModalOtpSent(false);
                            setModalOtp("");
                            setModalPassword("");
                            setModalConfirmPassword("");
                          }}
                          className="text-xs text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
                        >
                          Already have an account? Sign In
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* FORGOT PASSWORD VIEW */
                    <div className="space-y-4">
                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                          <input
                            type="email"
                            required
                            disabled={modalOtpSent}
                            value={modalEmail}
                            onChange={(e) => setModalEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary disabled:bg-gray-50"
                          />
                        </div>
                      </div>

                      {/* Forgot Password OTP & New Passwords */}
                      {modalOtpSent && (
                        <>
                          {/* OTP */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Reset OTP Code *</label>
                              {modalOtpTimer > 0 ? (
                                <span className="text-[10px] text-gray-400">Resend in {modalOtpTimer}s</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleModalSendForgotOtp}
                                  className="text-[10px] text-primary hover:underline bg-transparent border-0 cursor-pointer"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                              <input
                                type="text"
                                required
                                maxLength={6}
                                value={modalOtp}
                                onChange={(e) => setModalOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="w-full pl-9 pr-4 py-2.5 text-sm text-center font-bold tracking-widest border border-gray-200 rounded-lg outline-none focus:border-primary"
                              />
                            </div>
                          </div>

                          {/* New Password */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">New Password *</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                              <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={modalPassword}
                                onChange={(e) => setModalPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center"
                              >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          {/* Confirm New Password */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Confirm New Password *</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={modalConfirmPassword}
                                onChange={(e) => setModalConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center"
                              >
                                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Forgot Password Buttons */}
                      {!modalOtpSent ? (
                        <button
                          type="button"
                          onClick={handleModalSendForgotOtp}
                          disabled={modalOtpSending}
                          className="w-full bg-[#34a121] hover:bg-[#28801a] text-white py-3 rounded-lg font-bold tracking-wider text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                        >
                          {modalOtpSending ? <><Loader2 size={14} className="animate-spin" /> SENDING OTP...</> : "SEND RESET OTP"}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={modalLoading}
                          className="w-full bg-black text-white py-3 rounded-lg font-bold tracking-wider text-xs hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                        >
                          {modalLoading ? <><Loader2 size={14} className="animate-spin" /> RESETTING PASSWORD...</> : "RESET PASSWORD"}
                        </button>
                      )}

                      {/* Back to Login Toggle */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModalView("login");
                            setModalError("");
                            setModalSuccess("");
                            setModalOtpSent(false);
                            setModalOtp("");
                            setModalPassword("");
                            setModalConfirmPassword("");
                          }}
                          className="text-xs text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
                        >
                          Back to Login
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-150"></div>
                  <span className="flex-shrink mx-3 text-gray-400 text-xs font-semibold uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-gray-150"></div>
                </div>

                {/* Guest Checkout Option */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      resetModalState();
                      router.push("/checkout");
                    }}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-bold tracking-wider text-xs border border-gray-200 hover:border-gray-450 hover:text-black transition-colors cursor-pointer"
                  >
                    CHECKOUT AS GUEST
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    You can complete your purchase without creating an account.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
