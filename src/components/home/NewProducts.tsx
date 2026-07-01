"use client";

import { useState, useEffect } from "react";
import ProductGrid from "@/components/home/ProductGrid";
import { Product } from "@/data/products";

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

type NewProductsSettings = {
  section_new_products_title?: string;
  section_new_products_subtitle?: string;
};

const getEmojiAndBg = (title: string, category: string) => {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();
  if (cat.includes("noodle") || t.includes("noodle")) return { emoji: "🍜", bgColor: "from-emerald-100 to-green-200" };
  if (cat.includes("honey") || t.includes("honey")) return { emoji: "🍯", bgColor: "from-amber-100 to-yellow-200" };
  if (cat.includes("sweet") || cat.includes("jaggery") || t.includes("jaggery") || t.includes("sugar")) return { emoji: "🌿", bgColor: "from-orange-100 to-amber-200" };
  if (cat.includes("millet") || cat.includes("grain") || cat.includes("rice") || t.includes("millet") || t.includes("rice") || cat.includes("seed")) return { emoji: "🌾", bgColor: "from-lime-100 to-green-200" };
  if (cat.includes("oil") || cat.includes("ghee") || t.includes("oil") || t.includes("ghee")) return { emoji: "🥛", bgColor: "from-yellow-100 to-amber-200" };
  if (cat.includes("tea") || cat.includes("herbal") || t.includes("tea")) return { emoji: "🍵", bgColor: "from-green-100 to-emerald-200" };
  return { emoji: "📦", bgColor: "from-gray-100 to-green-50" };
};

export default function NewProducts({ settings }: { settings?: NewProductsSettings }) {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveProducts() {
      try {
        const res = await fetch(`/api/products?view=card&limit=12&t=${Date.now()}`, { cache: "no-store" });
        const data = (await res.json()) as { success?: boolean; products?: ProductApiItem[] };
        const apiProducts = data.products ?? [];
        if (data.success && apiProducts.length > 0) {
          const activeDbProds = apiProducts.filter((p) => p.status === "active");
          const mapped: Product[] = activeDbProds.map((p) => {
            const compareAtPrice =
              p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : p.price * 1.25;
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
              isNew: true,
              isBestSeller: p.collections?.includes("Best Sellers") || false,
              image: p.images && p.images.length > 0 ? p.images[0] : undefined,
              trackInventory: p.trackInventory ?? false,
              quantity: p.quantity ?? 0,
              stock_quantity: p.quantity ?? 0,
              stock_status: (p.trackInventory && (p.quantity ?? 0) <= 0) ? 'Out of Stock' : 'In Stock',
              is_out_of_stock: p.trackInventory && (p.quantity ?? 0) <= 0,
            };
          });
          setLiveProducts(mapped);
        }
      } catch (err) {
        console.error("Failed to load live database products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLiveProducts();
  }, []);

  const combinedProducts = liveProducts.slice(0, 8);

  return (
    <div className="bg-white pt-[42px] pb-0">
      <div className="text-center mb-0 px-4">
        <h2 className="vivasaya-section-title">
          {settings?.section_new_products_title || "New Products"}
        </h2>
        <p className="vivasaya-section-copy max-w-2xl mx-auto mt-2">
          {settings?.section_new_products_subtitle ||
            "Elevate your health with our organic delights - Shop now and experience the natural difference!"}
        </p>
      </div>

      {loading ? (
        /* Skeleton grid while products load */
        <div className="vivasaya-product-container py-[34px]">
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 pt-6 md:-mt-[30px] md:grid-cols-4 md:gap-x-0 md:gap-y-0 md:pt-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="min-w-0 md:px-[15px] md:pt-[30px]">
                <div className="animate-pulse">
                  <div className="aspect-square w-full rounded bg-gray-100" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-gray-100 mx-auto" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-100 mx-auto" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-gray-100 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : combinedProducts.length > 0 ? (
        <ProductGrid
          id="new-products"
          title=""
          subtitle=""
          products={combinedProducts}
        />
      ) : null}
    </div>
  );
}
