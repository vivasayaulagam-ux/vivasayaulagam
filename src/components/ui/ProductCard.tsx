"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Product } from "@/data/products";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, normalizeImageUrl } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

interface ProductCardProps {
  product: Product;
  urgency?: string;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = 
    product.is_out_of_stock === true || 
    product.stock_status === "Out of Stock" || 
    product.quantity === 0 || 
    product.stock_quantity === 0 ||
    (product.trackInventory && (product.quantity ?? 0) <= 0);

  const [qty, setQty] = useState(isOutOfStock ? 0 : 1);
  const [cartState, setCartState] = useState<"idle" | "loading" | "success">("idle");
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (cartState === "loading") return;
    setCartState("loading");
    window.setTimeout(() => {
      addItem({
        id: String(product.id),
        name: product.name,
        price: product.salePrice,
        quantity: qty,
        image: product.image || product.emoji,
        weight: product.weight || 0,
        weightUnit: product.weightUnit || "kg",
      });
      setCartState("success");
      window.setTimeout(() => setCartState("idle"), 1200);
    }, 300);
  };

  const buttonLabel = isOutOfStock
    ? "Out of Stock"
    : cartState === "loading"
    ? "Adding"
    : cartState === "success"
    ? "Added"
    : "Add to cart";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className="group product-card-premium relative flex h-full w-full min-w-0 select-none flex-col overflow-visible bg-white text-center"
    >
      <div className="relative overflow-visible md:overflow-hidden">
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        <div className="relative aspect-square w-full overflow-hidden bg-white">
          <Link href={`/product/${product.id}`} className="absolute inset-0 z-0 flex items-center justify-center">
            {product.image ? (
            <Image
              src={normalizeImageUrl(product.image)}
              alt={product.name}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={75}
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
              unoptimized={normalizeImageUrl(product.image).startsWith("data:")}
              className={`h-full w-full object-cover object-center transition-transform duration-[2000ms] ease-[cubic-bezier(0,0,0.44,1.18)] group-hover:scale-[1.09] ${isOutOfStock ? 'desaturate opacity-60' : ''}`}
            />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${product.bgColor} flex items-center justify-center ${isOutOfStock ? 'opacity-60' : ''}`}>
                <span className="relative text-5xl transition-transform duration-[2000ms] ease-[cubic-bezier(0,0,0.44,1.18)] group-hover:scale-[1.09] sm:text-6xl md:text-7xl">
                  {product.emoji}
                </span>
              </div>
            )}
          </Link>
        </div>

        <div className="z-10 flex h-9 w-full min-w-0 translate-y-0 items-center bg-primary text-white opacity-100 transition-all duration-500 md:absolute md:bottom-0 md:left-0 md:right-0 md:h-10 md:translate-y-full md:invisible md:opacity-0 md:group-hover:visible md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <div className="flex h-full shrink-0 items-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOutOfStock) return;
                setQty(Math.max(1, qty - 1));
              }}
              disabled={isOutOfStock}
              className="flex h-full w-6 min-[390px]:w-7 cursor-pointer items-center justify-center border-0 bg-transparent text-base font-normal text-white transition-colors hover:bg-black/10 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <div className="flex h-full w-5 min-[390px]:w-6 select-none items-center justify-center border-l border-r border-white/20 text-[12px] font-normal text-white">
              {qty}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOutOfStock) return;
                setQty(qty + 1);
              }}
              disabled={isOutOfStock}
              className="flex h-full w-6 min-[390px]:w-7 cursor-pointer items-center justify-center border-0 bg-transparent text-base font-normal text-white transition-colors hover:bg-black/10 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={cartState === "loading" || isOutOfStock}
            className={`flex h-full min-w-0 flex-grow items-center justify-center gap-1 border-l border-white/20 bg-transparent px-0 text-[12px] font-normal tracking-normal text-white transition-all focus:outline-none min-[390px]:gap-1.5 min-[390px]:text-[13px] md:px-[10px] ${
              isOutOfStock 
                ? 'bg-rose-750/90 cursor-not-allowed opacity-80' 
                : 'cursor-pointer hover:bg-primary-dark disabled:cursor-wait'
            }`}
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            {cartState === "loading" && <Loader2 size={13} className="animate-spin" />}
            {cartState === "success" && <Check size={14} strokeWidth={3} />}
            {buttonLabel}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-white px-0 pb-0 pt-[15px]">
        <h3 className="min-h-[39px] text-center text-[13px] font-semibold leading-[19px] text-[#222222] line-clamp-2 min-[390px]:text-[14px] min-[390px]:leading-[19.5px]">
          <Link href={`/product/${product.id}`} className="transition-colors duration-200 hover:text-primary">
            {product.name}
          </Link>
        </h3>

        <div className="flex min-h-[54px] flex-wrap items-start justify-center gap-x-1 text-center text-[15px] font-semibold leading-[26px] text-primary min-[390px]:text-[16px] min-[390px]:leading-[27.2px] sm:min-h-[27px]">
          {product.originalPrice > product.salePrice && (
            <span className="text-[#878787] line-through">{formatPrice(product.originalPrice)}</span>
          )}
          <span className="text-primary">{formatPrice(product.salePrice)}</span>
        </div>

        <p className="min-h-[24px] text-center text-[14px] font-normal leading-[23.8px] text-[#878787]">
          {product.reviewCount ? `${product.reviewCount} reviews` : "No reviews"}
        </p>
      </div>
    </motion.div>
  );
}
