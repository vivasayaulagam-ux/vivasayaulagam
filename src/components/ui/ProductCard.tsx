"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/data/products";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, normalizeProductImage } from "@/lib/utils";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";
import QuickAddModal from "@/components/ui/QuickAddModal";
import { hasPurchasableStock } from "@/lib/productVariants";

interface ProductCardProps {
  product: Product;
  urgency?: string;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    const resolved = normalizeProductImage(product);
    return resolved && resolved.trim() !== "" ? resolved : "/placeholder.svg";
  });

  useEffect(() => {
    const resolved = normalizeProductImage(product);
    setImgSrc(resolved && resolved.trim() !== "" ? resolved : "/placeholder.svg");
  }, [product]);

  const hasImage = !!(
    (product.image && typeof product.image === 'string' && product.image.trim() !== "") ||
    (product.images && product.images.length > 0 && product.images[0] && typeof product.images[0] === 'string' && product.images[0].trim() !== "") ||
    ((product as any).imageUrl && typeof (product as any).imageUrl === 'string' && (product as any).imageUrl.trim() !== "") ||
    ((product as any).thumbnail && typeof (product as any).thumbnail === 'string' && (product as any).thumbnail.trim() !== "")
  );

  const isOutOfStock = !hasPurchasableStock(product);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const quickAddTriggerRef = useRef<HTMLButtonElement>(null);

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

        {/* Free Shipping Badge */}
        {(product as any).isFreeShipping && !isOutOfStock && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className="bg-[#34a121] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Free Shipping
            </span>
          </div>
        )}

        <div className="relative aspect-square w-full overflow-hidden bg-white">
          <Link href={`/product/${product.id}`} className="absolute inset-0 z-0 flex items-center justify-center">
            {hasImage ? (
            <Image
              src={imgSrc || "/placeholder.svg"}
              alt={product.name}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={75}
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
              unoptimized={imgSrc.startsWith("data:")}
              onError={() => setImgSrc('/placeholder.svg')}
              className={`h-full w-full object-cover object-center transition-transform duration-[2000ms] ease-[cubic-bezier(0,0,0.44,1.18)] group-hover:scale-[1.09] ${isOutOfStock ? 'desaturate opacity-60' : ''}`}
            />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${product.bgColor || 'from-gray-100 to-green-50'} flex items-center justify-center ${isOutOfStock ? 'opacity-60' : ''}`}>
                <span className="relative text-5xl transition-transform duration-[2000ms] ease-[cubic-bezier(0,0,0.44,1.18)] group-hover:scale-[1.09] sm:text-6xl md:text-7xl">
                  {product.emoji || "🌾"}
                </span>
              </div>
            )}
          </Link>
        </div>

        <div className="z-10 flex h-9 w-full min-w-0 translate-y-0 items-center bg-primary text-white opacity-100 transition-all duration-500 md:absolute md:bottom-0 md:left-0 md:right-0 md:h-10 md:translate-y-full md:invisible md:opacity-0 md:group-hover:visible md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            ref={quickAddTriggerRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isOutOfStock) setQuickAddOpen(true);
            }}
            disabled={isOutOfStock}
            className={`flex h-full min-w-0 flex-grow items-center justify-center gap-2 bg-transparent px-2 text-[12px] font-semibold tracking-wide text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 min-[390px]:text-[13px] md:px-[10px] ${
              isOutOfStock 
                ? 'bg-rose-750/90 cursor-not-allowed opacity-80' 
                : 'cursor-pointer hover:bg-primary-dark'
            }`}
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            <ShoppingBag size={14} />
            {isOutOfStock ? "Out of Stock" : "Quick add"}
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

      <QuickAddModal
        product={product}
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        triggerRef={quickAddTriggerRef}
      />
    </motion.div>
  );
}
