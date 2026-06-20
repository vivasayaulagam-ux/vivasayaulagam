"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/data/products";

const categoryTabs = [
  { name: "All Products", slug: "all" },
  { name: "Combo Offers", slug: "combo" },
  { name: "Hair & Skin Care", slug: "hair-skin-care" },
  { name: "Rice Powders", slug: "rice-powders" },
  { name: "Thokku & Pickles", slug: "thokku-pickles" },
  { name: "Masala & Spice Powders", slug: "masala-spice-powders" },
  { name: "Sweets & Snacks", slug: "sweets-snacks" },
  { name: "Health & Dairy", slug: "health-dairy" },
];

const getSlugForCategory = (categoryName: string): string => {
  const cat = (categoryName || "").toLowerCase().trim();
  if (cat.includes("combo") || cat.includes("bundle") || cat.includes("offer")) {
    return "combo";
  }
  if (
    cat === "hair & skin care" ||
    cat === "hair-skin-care" ||
    cat.includes("skincare") ||
    cat.includes("hair") ||
    cat.includes("ayurvedic") ||
    cat.includes("supplements")
  ) {
    return "hair-skin-care";
  }
  if (
    cat === "rice powders (சோறு பொடி)" ||
    cat === "rice powders" ||
    cat === "rice-powders" ||
    cat.includes("grain") ||
    cat.includes("rice")
  ) {
    return "rice-powders";
  }
  if (
    cat === "thokku & pickles" ||
    cat === "thokku-pickles" ||
    cat.includes("thokku") ||
    cat.includes("pickle")
  ) {
    return "thokku-pickles";
  }
  if (
    cat === "masala & spice powders" ||
    cat === "masala-spice-powders" ||
    cat.includes("masala") ||
    cat.includes("spice")
  ) {
    return "masala-spice-powders";
  }
  if (
    cat === "sweets & snacks" ||
    cat === "sweets-snacks" ||
    cat.includes("sweet") ||
    cat.includes("snack") ||
    cat.includes("chips") ||
    cat.includes("urundai") ||
    cat.includes("laddu")
  ) {
    return "sweets-snacks";
  }
  if (
    cat === "health & dairy" ||
    cat === "health-dairy" ||
    cat.includes("dairy") ||
    cat.includes("ghee") ||
    cat.includes("oil") ||
    cat.includes("tea") ||
    cat.includes("honey")
  ) {
    return "health-dairy";
  }
  return "other";
};


interface ShopPageClientProps {
  products: Product[];
  settings: Record<string, unknown>;
}

export default function ShopPageClient({ products }: ShopPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement>(null);
  const skeletonTimer = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  // Active Category Sync
  const activeSlug = searchParams.get("category") || "all";

  // Filter and Sorting States
  const [showFilters, setShowFilters] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const maxProductPrice = products.reduce((max, p) => (p.salePrice > max ? p.salePrice : max), 1000);
  const [maxPrice, setMaxPrice] = useState(maxProductPrice);
  const [manualSort, setManualSort] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const sortBy = manualSort ?? (searchParams.get("sort") === "bestselling" ? "Best Selling" : "Featured");

  const flashSkeleton = () => {
    if (skeletonTimer.current) {
      window.clearTimeout(skeletonTimer.current);
    }
    setShowSkeleton(true);
    skeletonTimer.current = window.setTimeout(() => setShowSkeleton(false), 350);
  };

  useEffect(() => () => {
    if (skeletonTimer.current) {
      window.clearTimeout(skeletonTimer.current);
    }
  }, []);

  // Handle category change via URL query parameter update
  const handleCategoryChange = (slug: string) => {
    flashSkeleton();
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug === "all") {
        params.delete("category");
      } else {
        params.set("category", slug);
      }
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  // Horizontal scroll tabs function
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Category Title resolution
  const activeTab = categoryTabs.find((t) => t.slug === activeSlug);
  const pageTitle = activeTab ? activeTab.name : "All Products";

  // Products filtering
  const filteredProducts = products.filter((product) => {
    // 1. Category Filter
    if (activeSlug !== "all") {
      const mainSlug = getSlugForCategory(product.category);
      const isMatch = mainSlug === activeSlug || 
        product.categories?.some(cat => getSlugForCategory(cat) === activeSlug);
      if (!isMatch) return false;
    }

    // 2. Price Filter
    if (product.salePrice > maxPrice) return false;

    return true;
  });

  // Products sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "Price: Low to High") {
      return a.salePrice - b.salePrice;
    }
    if (sortBy === "Price: High to Low") {
      return b.salePrice - a.salePrice;
    }
    if (sortBy === "Newest Arrivals") {
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    }
    if (sortBy === "Best Selling") {
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    }
    // "Featured" / Default sorting
    return 0;
  });

  return (
    <div className="w-full min-h-screen bg-secondary">
      {/* ── TOP SECTION: Category navigation bar ── */}
      <div style={{ top: 0 }} className="border-b border-gray-100 bg-white sticky z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center relative py-2">
          {/* Left Arrow Button */}
          <button
            onClick={() => scrollTabs("left")}
            className="absolute left-1 z-10 hidden p-1.5 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all cursor-pointer active:scale-95 hover:bg-gray-50 md:flex md:items-center md:justify-center lg:left-4"
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={15} strokeWidth={2.5} />
          </button>

          {/* Categories Tab Scroll Container */}
          <div
            ref={tabsRef}
            className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 py-1 md:flex-1 md:flex-nowrap md:justify-start md:gap-5 md:overflow-x-auto md:px-8 md:scroll-smooth md:hide-scrollbar lg:gap-8"
          >
            {categoryTabs.map((tab) => {
              const isActive = activeSlug === tab.slug;
              return (
                <button
                  key={tab.slug}
                  onClick={() => handleCategoryChange(tab.slug)}
                    className={`whitespace-nowrap border-b-2 py-2 text-xs font-semibold tracking-wider transition-all duration-200 outline-none cursor-pointer sm:text-sm ${
                      isActive
                        ? "border-primary text-primary scale-105"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => scrollTabs("right")}
            className="absolute right-1 z-10 hidden p-1.5 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all cursor-pointer active:scale-95 hover:bg-gray-50 md:flex md:items-center md:justify-center lg:right-4"
            aria-label="Scroll categories right"
          >
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Centered Collection Title */}
        <div className="mb-7 text-center md:mb-10">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            {pageTitle}
          </h1>
          <div className="w-12 h-[2px] bg-primary mx-auto mt-3"></div>
        </div>

        {/* Toolbar: Filters toggle & Sort Dropdown */}
        <div className="mb-7 flex flex-col items-stretch gap-3 border-b border-gray-100 pb-5 text-xs font-semibold text-gray-800 sm:flex-row sm:items-center sm:justify-between md:mb-8">
          {/* Left: Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border transition-all cursor-pointer hover:bg-gray-50 hover:border-gray-400 select-none sm:justify-start ${
              showFilters ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-800 bg-white"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>

          {/* Right: Sort Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-gray-800 transition-all hover:bg-gray-50 cursor-pointer select-none sm:w-auto"
            >
              <span>Sort by: {sortBy}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50 flex flex-col font-medium"
                  >
                    {["Featured", "Best Selling", "Price: Low to High", "Price: High to Low", "Newest Arrivals"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          flashSkeleton();
                          setManualSort(option);
                          setSortOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-xl text-xs hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-black cursor-pointer transition-colors"
                      >
                        <span>{option}</span>
                        {sortBy === option && <Check size={12} className="text-primary" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row gap-8 items-start md:items-center">
                {/* Price Slider */}
                <div className="w-full md:w-80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                    <span>Max Price</span>
                    <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono font-bold">
                      ₹{maxPrice}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={maxProductPrice}
                    value={maxPrice}
                    onChange={(e) => {
                      flashSkeleton();
                      setMaxPrice(Number(e.target.value));
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>₹50</span>
                    <span>₹{maxProductPrice}</span>
                  </div>
                </div>

                {/* Filter info text */}
                <div className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-sm md:ml-auto">
                  Showing products within selected price range. Drag the slider to filter by budget.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 4-COLUMN RESPONSIVE PRODUCT GRID ── */}
        {showSkeleton ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="rounded-[18px] border border-primary/10 bg-white p-3 shadow-card">
                <div className="skeleton-shimmer aspect-square rounded-[14px]" />
                <div className="mt-4 h-4 rounded-full skeleton-shimmer" />
                <div className="mx-auto mt-3 h-3 w-2/3 rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <span className="text-6xl mb-4 block select-none">🌾</span>
            <h3 className="font-heading font-extrabold text-xl text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-400 text-xs font-body max-w-md mx-auto leading-relaxed">
              We currently don&apos;t have stock for items matching these filters. Try adjusting your category choice or price range!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
