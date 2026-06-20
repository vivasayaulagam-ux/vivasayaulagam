"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { AnimatePresence, motion } from "framer-motion";
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
              ? parseWeightLabelToKg(variantValue, product.weight, product.weightUnit || "kg")
              : toWeightKg(product.weight, product.weightUnit || "kg");

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
  const totalWeight = items.reduce((sum, item) => sum + toWeightKg(item.weight, item.weightUnit || "kg") * item.quantity, 0);
  const hasMissingWeight = items.some((item) => toWeightKg(item.weight, item.weightUnit || "kg") <= 0);
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
      items: JSON.stringify(items.map(i => ({ productId: i.id.split("-")[0], quantity: i.quantity, price: i.price, weightKg: toWeightKg(i.weight, i.weightUnit || "kg") })))
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
                            Weight: {formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg"))}
                            {toWeightKg(item.weight, item.weightUnit || "kg") > 0 && item.quantity > 1
                              ? ` x ${item.quantity} = ${formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg") * item.quantity)}`
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
                          Weight: <span className="font-heading font-bold text-text-dark">{formatWeightKg(toWeightKg(item.weight, item.weightUnit || "kg"))}</span>
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
                    {appliedRate > 0 && (
                      <div className="flex justify-between text-text-muted">
                        <span>Courier Rate</span>
                        <span className="font-heading font-semibold text-text-dark">₹{appliedRate} / kg</span>
                      </div>
                    )}
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
                    <Link
                      href="/checkout"
                      className="w-full bg-black text-white py-3.5 rounded-none flex items-center justify-center gap-2 font-bold tracking-wider text-sm hover:bg-gray-800 transition-colors shadow-md"
                    >
                      PROCEED TO CHECKOUT <ArrowRight size={16} />
                    </Link>
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
    </>
  );
}
