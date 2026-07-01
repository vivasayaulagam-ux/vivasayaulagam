"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/data/products";
import Link from "next/link";

const DEAL_TARGET = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

function useCountdown() {
  const [time, setTime] = useState({ days: 2, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = DEAL_TARGET.getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTime({ days, hours, mins, secs });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

type LimitedDealsSettings = {
  section_limited_deals_title?: string;
  section_limited_deals_subtitle?: string;
};

type ProductApiItem = {
  _id: string;
  title: string;
  category?: string;
  categories?: string[];
  compareAtPrice?: number;
  price: number;
  rating?: number;
  reviewCount?: number;
  collections?: string[];
  images?: string[];
  status?: string;
  weight?: number;
  weightUnit?: string;
  trackInventory?: boolean;
  quantity?: number;
};

function getEmojiAndBg(title: string, category: string) {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();
  if (cat.includes("noodle") || t.includes("noodle")) return { emoji: "🍜", bgColor: "from-emerald-100 to-green-200" };
  if (cat.includes("honey") || t.includes("honey")) return { emoji: "🍯", bgColor: "from-amber-100 to-yellow-200" };
  if (cat.includes("sweet") || cat.includes("jaggery") || t.includes("jaggery") || t.includes("sugar")) return { emoji: "🌿", bgColor: "from-orange-100 to-amber-200" };
  if (cat.includes("millet") || cat.includes("grain") || cat.includes("rice") || t.includes("millet") || t.includes("rice") || cat.includes("seed")) return { emoji: "🌾", bgColor: "from-lime-100 to-green-200" };
  if (cat.includes("oil") || cat.includes("ghee") || t.includes("oil") || t.includes("ghee")) return { emoji: "🥛", bgColor: "from-yellow-100 to-amber-200" };
  if (cat.includes("tea") || cat.includes("herbal") || t.includes("tea")) return { emoji: "🍵", bgColor: "from-green-100 to-emerald-200" };
  return { emoji: "📦", bgColor: "from-gray-100 to-green-50" };
}

export default function LimitedDeals({ settings }: { settings?: LimitedDealsSettings }) {
  const { days, hours, mins, secs } = useCountdown();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      try {
        const res = await fetch("/api/products?view=card&limit=24");
        const data = (await res.json()) as { success?: boolean; products?: ProductApiItem[] };
        const apiProducts = data.products ?? [];
        if (data.success && apiProducts.length > 0) {
          const activeProds = apiProducts.filter((p) => p.status === "active");
          // Prefer products tagged as deals, otherwise use any active products
          const dealsTagged = activeProds.filter(
            (p) =>
              p.collections?.includes("Deals") ||
              p.collections?.includes("Limited Deals") ||
              p.collections?.includes("Flash Sale")
          );
          const source = dealsTagged.length > 0 ? dealsTagged : activeProds;

          const mapped: Product[] = source.slice(0, 4).map((p) => {
            const compareAtPrice = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : p.price * 1.25;
            const aesthetics = getEmojiAndBg(p.title, p.category || "");
            const disc = Math.round(((compareAtPrice - p.price) / compareAtPrice) * 100);
            return {
              id: p._id,
              name: p.title,
              originalPrice: compareAtPrice,
              salePrice: p.price,
              discount: disc || 20,
              rating: p.rating || 4.7,
              reviewCount: p.reviewCount || 12,
              category: p.category || "Organic Goods",
              categories: p.categories || [],
              emoji: aesthetics.emoji,
              bgColor: aesthetics.bgColor,
              isNew: false,
              isBestSeller: p.collections?.includes("Best Sellers") || false,
              image: p.images && p.images.length > 0 ? p.images[0] : undefined,
              trackInventory: p.trackInventory ?? false,
              quantity: p.quantity ?? 0,
              stock_quantity: p.quantity ?? 0,
              stock_status: (p.trackInventory && (p.quantity ?? 0) <= 0) ? 'Out of Stock' : 'In Stock',
              is_out_of_stock: p.trackInventory && (p.quantity ?? 0) <= 0,
            };
          });
          setDeals(mapped);
        }
      } catch (err) {
        console.error("Failed to load deals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  return (
    <section id="limited-deals" className="bg-white py-[44px]">
      <div className="vivasaya-product-container">
        <div className="mb-[32px] flex flex-col items-center justify-between gap-5 text-center md:flex-row md:items-end md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
              <Clock size={15} className="text-primary" />
              <span className="text-[12px] font-semibold uppercase tracking-normal text-primary">
                {settings?.section_limited_deals_subtitle || "Flash Sale"}
              </span>
            </div>
            <h2 className="font-heading text-[22px] font-bold leading-[1.35] text-[#222222] sm:text-[24px]">
              {settings?.section_limited_deals_title || "Limited Time Deals! Grab now"}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {[
              { label: "Days", val: pad(days) },
              { label: "Hours", val: pad(hours) },
              { label: "Mins", val: pad(mins) },
              { label: "Secs", val: pad(secs) },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center border border-[#dddddd] bg-white sm:h-14 sm:w-14">
                    <span className="font-heading text-lg font-bold text-primary sm:text-xl">{item.val}</span>
                  </div>
                  <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-normal text-[#777777]">
                    {item.label}
                  </span>
                </div>
                {i < 3 && <span className="-mt-4 text-xl font-bold text-[#dddddd]">:</span>}
              </div>
            ))}
          </motion.div>
        </div>

        {loading ? (
          /* Skeleton loader */
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-6 md:-mt-[30px] md:grid-cols-4 md:gap-x-0 md:gap-y-0 md:pt-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-0 md:px-[15px] md:pt-[30px]">
                <div className="animate-pulse">
                  <div className="aspect-square w-full rounded bg-gray-100" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-gray-100 mx-auto" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-100 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-6 md:-mt-[30px] md:grid-cols-4 md:gap-x-0 md:gap-y-0 md:pt-0">
            {deals.map((product) => (
              <div key={product.id} className="min-w-0 md:px-[15px] md:pt-[30px]">
                <ProductCard product={product} urgency="Ends in 2 Days" />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 btn-outline px-7" aria-label="View all deals">
            View All Deals <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
