"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { products as staticProducts, Product } from "@/data/products";
import { categories } from "@/data/categories";
import { Search, X, Loader2 } from "lucide-react";

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

type SearchApiProduct = {
  _id: string;
  title?: string;
  price?: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  category?: string;
  categories?: string[];
  collections?: string[];
  images?: string[];
  status?: string;
  weight?: number;
  weightUnit?: string;
  trackInventory?: boolean;
  quantity?: number;
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get("category") || null);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync category and query state with URL search params
  useEffect(() => {
    const catParam = searchParams.get("category");
    const qParam = searchParams.get("q") || "";
    const timer = setTimeout(() => {
      setSelectedCategory(prev => prev === catParam ? prev : catParam);
      setQuery(prev => prev === qParam ? prev : qParam);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success && data.categories?.length > 0) {
          setDbCategories(data.categories.filter((c: any) => c.isVisible !== false));
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchLiveProducts() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.products?.length > 0) {
          const activeDbProds = (data.products as SearchApiProduct[]).filter((p) => p.status === "active");
          const mapped = activeDbProds.map((p) => {
            const price = p.price ?? 0;
            const compareAtPrice = p.compareAtPrice ?? price * 1.25;
            const title = p.title || "Organic Product";
            const category = p.category || "Organic Goods";
            const aesthetics = getEmojiAndBg(title, category);
            const disc = compareAtPrice > price 
              ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
              : 0;

            return {
              id: p._id,
              name: title,
              originalPrice: compareAtPrice,
              salePrice: price,
              discount: disc || 20,
              rating: p.rating || 4.7,
              reviewCount: p.reviewCount || 10,
              category,
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
        console.error("Failed to load products for searching:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveProducts();
  }, []);

  const handleCategorySelect = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const allProducts = [...liveProducts, ...staticProducts];
  const activeCategoriesList = dbCategories.length > 0 ? dbCategories : categories;

  // Search and category filtering
  const searchResults = allProducts.filter((product) => {
    const matchesQuery = query
      ? product.name.toLowerCase().includes(query.toLowerCase()) || 
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.categories?.some(c => c.toLowerCase().includes(query.toLowerCase()))
      : true;

    let matchesCategory = true;
    if (selectedCategory) {
      // Find category by slug or name matching selected category
      const selectedCatDetails = activeCategoriesList.find(
        (c) => c.slug?.toLowerCase() === selectedCategory.toLowerCase() || c.name?.toLowerCase() === selectedCategory.toLowerCase()
      );
      
      if (selectedCatDetails) {
        const catName = selectedCatDetails.name.toLowerCase();
        const catSlug = (selectedCatDetails.slug || "").toLowerCase();
        
        matchesCategory = 
          product.category?.toLowerCase() === catName ||
          product.category?.toLowerCase() === catSlug ||
          !!product.categories?.some(c => c.toLowerCase() === catName || c.toLowerCase() === catSlug);
      } else {
        // Direct match with slug or name
        matchesCategory = 
          product.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          !!product.categories?.some(c => c.toLowerCase() === selectedCategory.toLowerCase());
      }
    }

    return matchesQuery && matchesCategory;
  });

  return (
    <>
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-[#faf9f6] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl mx-auto mb-16 relative">
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-center text-text-dark mb-8">
              What are you looking for?
            </h1>

            <div className="relative flex items-center">
              <div className="absolute left-6 text-gray-400">
                <Search size={24} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search for organic noodles, cold pressed oils, pure honey..."
                className="w-full bg-white border border-[#34a121]/20 rounded-full py-4 pl-16 pr-12 text-base sm:text-lg font-body outline-none focus:border-[#34a121] shadow-card transition-all"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="absolute right-6 text-gray-400 hover:text-text-dark"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Quick searches */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider mr-2 mt-2">Popular:</span>
              {["Millet Noodles", "Cold Pressed Oil", "Honey", "Jaggery"].map(term => (
                <button
                  key={term}
                  onClick={() => handleQueryChange(term)}
                  className="px-4 py-1.5 bg-white border border-[#34a121]/20 rounded-full text-xs font-body hover:border-[#34a121] hover:text-[#34a121] transition-colors shadow-sm cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 border-t border-[#34a121]/5 pt-4">
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wider mr-2 mt-2">Category:</span>
              <button
                onClick={() => handleCategorySelect(null)}
                className={`px-4 py-1.5 border rounded-full text-xs font-body transition-colors shadow-sm cursor-pointer ${
                  !selectedCategory
                    ? "bg-[#34a121] text-white border-[#34a121] font-bold"
                    : "bg-white border-[#34a121]/20 hover:border-[#34a121] hover:text-[#34a121]"
                }`}
              >
                All
              </button>
              {activeCategoriesList.map((cat: any) => {
                const slugVal = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                const isSelected = selectedCategory === slugVal;
                return (
                  <button
                    key={cat._id || cat.id || slugVal}
                    onClick={() => handleCategorySelect(slugVal)}
                    className={`px-4 py-1.5 border rounded-full text-xs font-body transition-colors shadow-sm cursor-pointer ${
                      isSelected
                        ? "bg-[#34a121] text-white border-[#34a121] font-bold"
                        : "bg-white border-[#34a121]/20 hover:border-[#34a121] hover:text-[#34a121]"
                    }`}
                  >
                    <span className="mr-1">{cat.emoji}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#34a121]/10 pt-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-heading font-bold text-xl text-text-dark">
                {query || selectedCategory 
                  ? `Filtered Results (${searchResults.length})` 
                  : "Popular Products"}
              </h2>
              {loading && <Loader2 size={16} className="animate-spin text-[#34a121]" />}
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {searchResults.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <span className="text-6xl mb-4 inline-block">🔍</span>
                <h3 className="font-heading font-bold text-xl text-text-dark mb-2">No products found</h3>
                <p className="text-text-muted font-body">
                  We couldn&apos;t find anything matching your search and category choices. Try another filter.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-[#faf9f6] min-h-screen flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-primary" />
          </main>
          <Footer />
        </>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
