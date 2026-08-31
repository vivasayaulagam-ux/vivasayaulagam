"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Minus, Plus, X } from "lucide-react";
import type { Product } from "@/data/products";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";
import {
  getProductMeasurement,
  getVariantId,
  parseVariantMeasurement,
  sortVariantsDescending,
} from "@/lib/productVariants";
import { formatPrice, normalizeProductImage } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { getMetaCatalogId } from "@/lib/meta/catalogId";
import { trackAddToCart } from "@/lib/meta/pixel";

interface QuickAddModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function QuickAddModal({
  product,
  isOpen,
  onClose,
  triggerRef,
}: QuickAddModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [toastVisible, setToastVisible] = useState(false);
  const [imageSrc, setImageSrc] = useState(
    () => normalizeProductImage(product) || "/placeholder.svg"
  );

  const variants = useMemo(
    () => sortVariantsDescending(product.variants || []),
    [product.variants]
  );
  const selectedVariant =
    variants.find((variant) => getVariantId(variant) === selectedVariantId) ||
    variants[0] ||
    null;

  const measurement = selectedVariant
    ? parseVariantMeasurement(
        selectedVariant.value,
        selectedVariant.unit || product.unit || product.weightUnit || "g"
      )
    : getProductMeasurement(product);

  const salePrice = Number(
    selectedVariant?.sellingPrice ??
      selectedVariant?.price ??
      product.salePrice ??
      0
  );
  const regularPrice = Number(
    selectedVariant?.mrp ??
      selectedVariant?.compareAtPrice ??
      product.originalPrice ??
      salePrice
  );
  const sku = selectedVariant?.sku || product.sku || "";
  const availableStock = Number(
    selectedVariant?.stock ?? product.quantity ?? product.stock_quantity ?? 0
  );
  const isInStock =
    !product.trackInventory ||
    product.continueSelling === true ||
    availableStock > 0;
  const productImage = imageSrc || "/placeholder.svg";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setImageSrc(normalizeProductImage(product) || "/placeholder.svg");
  }, [product]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedVariantId(variants[0] ? getVariantId(variants[0]) : "");
    setQuantity(1);
  }, [isOpen, variants]);

  useEffect(() => {
    if (!isOpen || !product.trackInventory || product.continueSelling) return;
    if (availableStock > 0 && quantity > availableStock) {
      setQuantity(availableStock);
    }
  }, [
    availableStock,
    isOpen,
    product.continueSelling,
    product.trackInventory,
    quantity,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }, 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = window.setTimeout(() => setToastVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [toastVisible]);

  const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleAddToCart = () => {
    if (!isInStock) return;

    const productId = String(product.id);
    const variantId = selectedVariant
      ? getVariantId(selectedVariant)
      : undefined;
    const variantName = selectedVariant?.value;
    const lineId = variantName ? `${productId}-${variantName}` : productId;
    const isCombo = product.product_type === "combo";

    addItem({
      id: lineId,
      productId,
      variantId,
      variantName,
      name: product.name,
      price: salePrice,
      quantity,
      image: productImage,
      weight: measurement.weight,
      unit: measurement.unit,
      weightUnit: measurement.unit,
      weightKg: measurement.weightKg,
      sku,
      isOutOfStock: false,
      isCombo,
      comboWeight: isCombo ? measurement.weightKg : undefined,
      isFreeShipping: Boolean((product as any).isFreeShipping),
    });

    // Track Meta Pixel AddToCart
    const catalogId = getMetaCatalogId({
      productId,
      sku: product.sku,
      selectedVariant: selectedVariant ? { sku: selectedVariant.sku, value: selectedVariant.value } : null,
    });
    trackAddToCart({
      content_ids: [catalogId],
      content_type: 'product',
      content_name: variantName ? `${product.name} - ${variantName}` : product.name,
      value: Number(salePrice) * Number(quantity),
      currency: 'INR',
    });

    setToastVisible(true);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-white/70 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={handleBackdropClick}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`quick-add-title-${product.id}`}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[92dvh] w-[340px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[3px] bg-white px-5 pb-5 pt-5 shadow-[0_15px_45px_rgba(0,0,0,0.18)]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                data-autofocus
                type="button"
                onClick={onClose}
                aria-label="Close quick add"
                className="absolute right-[9px] top-[8px] z-30 flex h-8 w-8 items-center justify-center bg-transparent p-0 text-[#171717] transition hover:text-[#2aaa20] focus:outline-none focus:ring-2 focus:ring-[#34a121] focus:ring-offset-1"
              >
                <X size={25} strokeWidth={1.7} />
              </button>

              <div className="flex min-w-0 items-start gap-[11px] pr-7">
                <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden bg-[#f5f5f5]">
                  <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    sizes="90px"
                    quality={80}
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                    unoptimized={productImage.startsWith("data:")}
                    onError={() => setImageSrc("/placeholder.svg")}
                    className="object-cover object-center"
                  />
                </div>

                <div className="min-w-0 flex-1 pt-[14px]">
                  <h2
                    id={`quick-add-title-${product.id}`}
                    className="truncate text-[13px] font-semibold tracking-[0.12em] text-[#222222]"
                  >
                    {product.name}
                  </h2>
                  <div className="mt-[5px] flex flex-wrap items-center gap-x-2 gap-y-0.5 whitespace-nowrap">
                    {regularPrice > salePrice && (
                      <span className="text-[14px] font-medium text-[#888888] line-through">
                        {formatPrice(regularPrice)}
                      </span>
                    )}
                    <motion.span
                      key={`sale-${selectedVariantId}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[15px] font-medium text-[#ef1414]"
                    >
                      {formatPrice(salePrice)}
                    </motion.span>
                  </div>
                </div>
              </div>

              <div className="sr-only" aria-live="polite">
                {isInStock ? "In stock" : "Out of stock"}.
                {sku ? ` SKU ${sku}.` : ""}
              </div>

              <div className="mt-[28px]">
                <motion.p
                  key={`label-${selectedVariantId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[13px] font-extrabold uppercase leading-none text-[#222222]"
                >
                  Quantity: {measurement.label}
                </motion.p>

                {variants.length > 0 ? (
                  <div
                    className="mt-[17px] flex flex-wrap justify-center gap-[8px]"
                    role="radiogroup"
                    aria-label="Choose weight or volume"
                  >
                    {variants.map((variant) => {
                      const id = getVariantId(variant);
                      const selected = id === getVariantId(selectedVariant);
                      const outOfStock =
                        product.trackInventory &&
                        !product.continueSelling &&
                        Number(variant.stock || 0) <= 0;

                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={`${variant.value}${
                            outOfStock ? ", out of stock" : ""
                          }`}
                          onClick={() => setSelectedVariantId(id)}
                          className={`min-h-[30px] rounded-full border px-[10px] py-[4px] text-[13px] font-medium leading-5 transition focus:outline-none focus:ring-2 focus:ring-[#34a121] focus:ring-offset-2 ${
                            selected
                              ? "border-[#333333] bg-[#333333] text-white"
                              : "border-[#dfdfdf] bg-white text-[#999999] hover:border-[#999999] hover:text-[#555555]"
                          } ${outOfStock ? "opacity-50" : ""}`}
                        >
                          {variant.value}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-[17px] flex justify-center">
                    <span className="min-h-[30px] rounded-full border border-[#333333] bg-[#333333] px-[10px] py-[4px] text-[13px] font-medium leading-5 text-white">
                      {measurement.label}
                    </span>
                  </div>
                )}

                <div className="mt-[25px] flex justify-center">
                  <div className="flex h-[41px] w-[120px] items-center border border-[#333333] bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((value) => Math.max(1, value - 1))
                      }
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="flex h-full w-10 items-center justify-center bg-transparent text-[#222222] transition hover:bg-[#f4f4f4] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={17} strokeWidth={2.3} />
                    </button>
                    <motion.span
                      key={quantity}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full w-10 items-center justify-center text-[15px] font-medium text-[#222222]"
                      aria-live="polite"
                    >
                      {quantity}
                    </motion.span>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => value + 1)}
                      disabled={
                        !isInStock ||
                        (product.trackInventory &&
                          !product.continueSelling &&
                          quantity >= availableStock)
                      }
                      aria-label="Increase quantity"
                      className="flex h-full w-10 items-center justify-center bg-transparent text-[#222222] transition hover:bg-[#f4f4f4] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={18} strokeWidth={2.3} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  className="mt-5 flex h-[40px] w-full items-center justify-center bg-[#29a91f] px-4 text-[13px] font-extrabold uppercase text-white transition hover:bg-[#238f1b] focus:outline-none focus:ring-2 focus:ring-[#34a121] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isInStock ? "Add to cart" : "Out of stock"}
                </button>

                <Link
                  href={`/product/${product.id}`}
                  onClick={onClose}
                  className="mt-[17px] flex h-6 items-center justify-center gap-2 text-[13px] font-semibold text-[#333333] transition hover:text-[#29a91f] focus:outline-none focus:ring-2 focus:ring-[#34a121] focus:ring-offset-2"
                >
                  View full details
                  <ArrowRight size={17} strokeWidth={1.6} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-5 left-1/2 z-[10020] flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-sm bg-[#222222]/95 px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:bottom-8"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#29a91f]">
              <Check size={15} strokeWidth={3} />
            </span>
            Added to Cart Successfully
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
