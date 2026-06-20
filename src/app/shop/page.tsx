import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { products as staticProducts, Product } from "@/data/products";
import dbConnect from "@/lib/db";
import ProductModel from "@/models/Product";
import SettingModel from "@/models/Setting";
import ShopPageClient from "./ShopPageClient";

export const revalidate = 0; // Ensure data is never cached

type SettingsDoc = {
  key: string;
  value: unknown;
};

type ProductDoc = {
  _id: { toString: () => string };
  title?: string;
  price?: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  category?: string;
  categories?: string[];
  collections?: string[];
  images?: string[];
  weight?: number;
  weightUnit?: string;
  trackInventory?: boolean;
  quantity?: number;
};

const getEmojiAndBg = (title: string, category: string) => {
  const cat = (category || "").toLowerCase();
  const t = (title || "").toLowerCase();
  
  if (cat.includes("noodle") || cat.includes("pasta") || t.includes("noodle")) {
    return { emoji: "🍜", bgColor: "from-emerald-100 to-green-200" };
  }
  if (cat.includes("honey") || t.includes("honey")) {
    return { emoji: "🍯", bgColor: "from-amber-100 to-yellow-200" };
  }
  if (cat.includes("sweet") || cat.includes("jaggery") || t.includes("jaggery") || t.includes("sugar")) {
    return { emoji: "🌿", bgColor: "from-orange-100 to-amber-200" };
  }
  if (cat.includes("millet") || cat.includes("grain") || cat.includes("rice") || t.includes("millet") || t.includes("rice") || cat.includes("seed")) {
    return { emoji: "🌾", bgColor: "from-lime-100 to-green-200" };
  }
  if (cat.includes("oil") || cat.includes("ghee") || t.includes("oil") || t.includes("ghee")) {
    return { emoji: "🥛", bgColor: "from-yellow-100 to-amber-200" };
  }
  if (cat.includes("tea") || cat.includes("herbal") || t.includes("tea")) {
    return { emoji: "🍵", bgColor: "from-green-100 to-emerald-200" };
  }
  return { emoji: "📦", bgColor: "from-gray-100 to-green-50" };
};

export default async function ShopPage() {
  let liveProducts: Product[] = [];
  let settingsMap: Record<string, unknown> = {};
  
  try {
    await dbConnect();
    
    // Fetch settings
    const settings = await SettingModel.find().lean<SettingsDoc[]>();
    settingsMap = settings.reduce<Record<string, unknown>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const dbProds = await ProductModel.find({ status: "active" }).sort({ createdAt: -1 }).lean<ProductDoc[]>();
    
    if (dbProds && dbProds.length > 0) {
      liveProducts = dbProds.map((p) => {
        const title = p.title || "Organic Product";
        const price = p.price ?? 0;
        const compareAtPrice = p.compareAtPrice ?? price * 1.25;
        const category = p.category || "Organic Goods";
        const aesthetics = getEmojiAndBg(title, category);
        const disc = compareAtPrice > price 
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0;

        return {
          id: p._id.toString(),
          name: title,
          originalPrice: compareAtPrice,
          salePrice: price,
          discount: disc || 20,
          rating: p.rating || 4.7,
          reviewCount: p.reviewCount || 8,
          category,
          categories: p.categories || [],
          emoji: aesthetics.emoji,
          bgColor: aesthetics.bgColor,
          isNew: true,
          isBestSeller: p.collections?.includes("Best Sellers") || false,
          image: p.images && p.images.length > 0 ? p.images[0] : undefined,
          weight: p.weight || 0,
          weightUnit: p.weightUnit || "kg",
          trackInventory: p.trackInventory ?? false,
          quantity: p.quantity ?? 0,
          stock_quantity: p.quantity ?? 0,
          stock_status: (p.trackInventory && (p.quantity ?? 0) <= 0) ? 'Out of Stock' : 'In Stock',
          is_out_of_stock: p.trackInventory && (p.quantity ?? 0) <= 0,
        };
      });
    }
  } catch (err) {
    console.error("Failed to fetch live shop products:", err);
  }

  // Combine database products with default static ones
  const combinedProducts = [...liveProducts, ...staticProducts];

  return (
    <>
      <Navbar />
      {/* Push content below standard fixed navbar */}
      <div className="pt-[var(--navbar-height)] bg-white min-h-screen flex flex-col justify-between">
        <ShopPageClient products={combinedProducts} settings={settingsMap} />
        <Footer />
      </div>
    </>
  );
}
