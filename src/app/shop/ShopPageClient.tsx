"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/data/products";

// categoryTabs will be dynamically constructed inside the component from props

interface ShopPageClientProps {
  initialProducts: Product[];
  categories: { id: string; name: string; slug: string; emoji: string; bgColor: string }[];
  pagination: {
    totalProducts: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  maxProductPriceLimit: number;
  settings: Record<string, unknown>;
}

export default function ShopPageClient({
  initialProducts,
  categories,
  pagination,
  maxProductPriceLimit,
  settings,
}: ShopPageClientProps) {
  const categoryTabs = [
    { name: "All Products", slug: "all" },
    ...(categories || [])
  ];
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement>(null);
  const skeletonTimer = useRef<number | null>(null);
  const [, startTransition] = useTransition();
  const isLoadingRef = useRef(false);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Active Category Sync
  const activeSlug = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "Featured";

  // Filter and Sorting States
  const [showFilters, setShowFilters] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Current price slider value (read from URL or defaults to maxProductPriceLimit)
  const maxPriceParam = searchParams.get("maxPrice");
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : maxProductPriceLimit;

  // Local state for smooth slider dragging before mouse release
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sync local slider position when maxPrice (from URL) changes
  useEffect(() => {
    setLocalMaxPrice(maxPrice);
  }, [maxPrice]);

  // Loaded Products list (for pagination appending)
  const [loadedProducts, setLoadedProducts] = useState<Product[]>(initialProducts);
  const [currentPage, setCurrentPage] = useState(pagination.currentPage);
  const [totalPages, setTotalPages] = useState(pagination.totalPages);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync loaded products when server re-renders initialProducts (on category/sort/price change)
  useEffect(() => {
    setLoadedProducts(initialProducts);
    setCurrentPage(pagination.currentPage);
    setTotalPages(pagination.totalPages);
  }, [initialProducts, pagination]);

  // Mobile Bottom Sheet States
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);

  // Sync tempMaxPrice with maxPrice when filter sheet opens
  useEffect(() => {
    if (isFilterSheetOpen) {
      setTempMaxPrice(maxPrice);
    }
  }, [isFilterSheetOpen, maxPrice]);

  // Lock body scroll when mobile sheets are open
  useEffect(() => {
    if (isFilterSheetOpen || isSortSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterSheetOpen, isSortSheetOpen]);

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

  // Update URL search parameters
  const updateUrlParam = (key: string, value: string | null, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    if (resetPage) {
      params.delete("page");
    }
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  // Handle category change via URL query parameter update
  const handleCategoryChange = (slug: string) => {
    flashSkeleton();
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      params.delete("maxPrice"); // reset price range when swapping categories to view full catalog
      if (slug === "all") {
        params.delete("category");
      } else {
        params.set("category", slug);
      }
      router.push(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  const handlePriceFilterChange = (priceVal: number) => {
    flashSkeleton();
    startTransition(() => {
      updateUrlParam("maxPrice", priceVal >= maxProductPriceLimit ? null : String(priceVal));
    });
  };

  const handleSortChange = (sortOption: string) => {
    flashSkeleton();
    startTransition(() => {
      updateUrlParam("sort", sortOption);
    });
  };

  const loadMoreProducts = async () => {
    if (isLoadingRef.current || loadingMore || currentPage >= totalPages) return;
    isLoadingRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", "24");
      params.set("category", activeSlug);
      params.set("sort", sortBy);
      if (maxPrice < maxProductPriceLimit) {
        params.set("maxPrice", String(maxPrice));
      }
      params.set("view", "card");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.products)) {
        setLoadedProducts((prev) => {
          const existingIds = new Set(prev.map(p => String(p.id)));
          const uniqueNew = data.products.filter((p: any) => !existingIds.has(String(p.id || p._id)));
          return [...prev, ...uniqueNew];
        });
        setCurrentPage(nextPage);
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
        }
      }
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      isLoadingRef.current = false;
      setLoadingMore(false);
    }
  };

  const updateScrollArrows = () => {
    const el = tabsRef.current;
    if (el) {
      const canScrollLeft = el.scrollLeft > 2;
      const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
      setShowLeftArrow(canScrollLeft);
      setShowRightArrow(canScrollRight);
    }
  };

  // Horizontal scroll tabs function
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = tabsRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollArrows);
    }

    const timer = setTimeout(updateScrollArrows, 100);
    window.addEventListener("resize", updateScrollArrows);

    return () => {
      if (el) {
        el.removeEventListener("scroll", updateScrollArrows);
      }
      window.removeEventListener("resize", updateScrollArrows);
      clearTimeout(timer);
    };
  }, [initialProducts]);

  // Category Title resolution
  const activeTab = categoryTabs.find((t) => t.slug === activeSlug);
  const pageTitle = activeTab ? activeTab.name : "All Products";

  // Products filtering (fallback/redundancy checks for local state rendering)
  const filteredProducts = loadedProducts.filter((product) => {
    // Price Filter
    if (product.salePrice > maxPrice) return false;
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-secondary">
      {/* ── TOP SECTION: Category navigation bar ── */}
      <div style={{ top: 0 }} className="border-b border-gray-100 bg-white sticky z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center relative py-2">
          {/* Left Arrow Button */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="absolute left-1 z-20 p-1.5 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all cursor-pointer active:scale-95 hover:bg-gray-50 flex items-center justify-center lg:left-4 pointer-events-auto"
              aria-label="Scroll categories left"
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
          )}

          {/* Categories Tab Scroll Container */}
          <div
            ref={tabsRef}
            className="flex w-full overflow-x-auto flex-nowrap items-center gap-2.5 py-3 px-4 hide-scrollbar scroll-smooth md:flex-1 md:flex-nowrap md:justify-start md:gap-5 md:overflow-x-auto md:px-8 md:scroll-smooth md:hide-scrollbar md:py-1 lg:gap-8"
          >
            {categoryTabs.map((tab) => {
              const isActive = activeSlug === tab.slug;
              return (
                <button
                  key={tab.slug}
                  onClick={() => handleCategoryChange(tab.slug)}
                  className={`whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-200 outline-none cursor-pointer select-none rounded-full px-3.5 py-1.5 border flex-shrink-0 md:rounded-none md:border-0 md:border-b-2 md:px-0 md:py-2 md:flex-shrink md:text-xs sm:text-sm ${
                    isActive
                      ? "bg-primary text-white border-transparent md:bg-transparent md:text-primary md:border-primary scale-100 md:scale-105"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-800 md:bg-transparent md:text-gray-500 md:border-transparent md:hover:text-gray-800"
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          {showRightArrow && (
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="absolute right-1 z-20 p-1.5 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all cursor-pointer active:scale-95 hover:bg-gray-50 flex items-center justify-center lg:right-4 pointer-events-auto"
              aria-label="Scroll categories right"
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          )}
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

        {/* Desktop Toolbar: Filters toggle & Sort Dropdown */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between items-stretch gap-3 border-b border-gray-100 pb-5 text-xs font-semibold text-gray-800 md:mb-8 mb-7">
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

          {/* Center: Products Found Count */}
          <div className="text-xs font-bold text-gray-400 flex items-center justify-center">
            {pagination.totalProducts} Products Found
          </div>

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
                          handleSortChange(option);
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

        {/* Mobile Toolbar: Single rounded segmented pill bar */}
        <div className="md:hidden flex flex-col items-stretch mb-5">
          <div className="w-full border border-gray-200 rounded-full bg-white flex items-center p-0.5 shadow-sm">
            {/* Filter Segment */}
            <button
              onClick={() => {
                setIsFilterSheetOpen(true);
                setIsSortSheetOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isFilterSheetOpen
                  ? "bg-green-50 text-[#2f9e24]"
                  : "bg-white text-gray-800 active:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={14} className={isFilterSheetOpen ? "text-[#2f9e24]" : "text-gray-500"} />
              <span>Filter</span>
            </button>

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 bg-gray-200"></div>

            {/* Sort Segment */}
            <button
              onClick={() => {
                setIsSortSheetOpen(true);
                setIsFilterSheetOpen(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isSortSheetOpen
                  ? "bg-green-50 text-[#2f9e24]"
                  : "bg-white text-gray-800 active:bg-gray-50"
              }`}
            >
              <span>Sort: {sortBy}</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  isSortSheetOpen ? "rotate-180 text-[#2f9e24]" : "text-gray-500"
                }`}
              />
            </button>
          </div>

          {/* Products Found count centered below the segmented bar */}
          <div className="text-center text-[11px] text-gray-400 font-bold mt-3.5 mb-1.5">
            {pagination.totalProducts} Products Found
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
                      ₹{localMaxPrice}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={maxProductPriceLimit}
                    value={localMaxPrice}
                    onChange={(e) => {
                      setLocalMaxPrice(Number(e.target.value));
                    }}
                    onMouseUp={() => handlePriceFilterChange(localMaxPrice)}
                    onTouchEnd={() => handlePriceFilterChange(localMaxPrice)}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>₹50</span>
                    <span>₹{maxProductPriceLimit}</span>
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <span className="text-6xl mb-4 block select-none">🌾</span>
            <h3 className="font-heading font-extrabold text-xl text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-400 text-xs font-body max-w-md mx-auto leading-relaxed">
              We currently don&apos;t have stock for items matching these filters. Try adjusting your category choice or price range!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-4">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 4} />
            ))}
          </div>
        )}

        {currentPage < totalPages && (
          <div className="flex flex-col items-center justify-center mt-10 md:mt-14 gap-4">
            {loadingMore ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-xs text-gray-400 font-bold">Loading more products...</span>
              </div>
            ) : (
              <button
                onClick={loadMoreProducts}
                disabled={loadingMore}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 shadow-md hover:shadow-lg transition-all rounded-sm cursor-pointer border-0 disabled:cursor-not-allowed"
              >
                Load More Products
              </button>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Sheets & Overlay */}
      <AnimatePresence>
        {/* Backdrop Overlay for Filter or Sort Sheets */}
        {(isFilterSheetOpen || isSortSheetOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsFilterSheetOpen(false);
              setIsSortSheetOpen(false);
            }}
            className="fixed inset-0 bg-black/40 z-[9990] md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Filter Bottom Sheet */}
        {isFilterSheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-[9995] max-w-full pb-safe flex flex-col md:hidden max-h-[85vh] font-body"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center px-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="font-heading font-bold text-sm text-gray-900">Filter Products</h3>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="px-6 py-6 overflow-y-auto flex-grow max-h-[50vh]">
              {/* Price Range Filter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                  <span>Price Range</span>
                  <span className="text-[#2f9e24] bg-green-50 px-2 py-0.5 rounded-full font-mono font-bold">
                    ₹50 - ₹{tempMaxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max={maxProductPriceLimit}
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2f9e24]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>₹50</span>
                  <span>₹{maxProductPriceLimit}</span>
                </div>
              </div>
            </div>

            {/* Footer row fixed at bottom */}
            <div className="border-t border-gray-100 p-4 flex gap-4 bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTempMaxPrice(maxProductPriceLimit);
                  handlePriceFilterChange(maxProductPriceLimit);
                  setIsFilterSheetOpen(false);
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 bg-white cursor-pointer select-none"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePriceFilterChange(tempMaxPrice);
                  setIsFilterSheetOpen(false);
                }}
                className="flex-[2] py-3 bg-[#2f9e24] hover:bg-[#257d1c] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer select-none"
              >
                Apply Filter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Sort Bottom Sheet */}
        {isSortSheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-[9995] max-w-full pb-safe flex flex-col md:hidden max-h-[85vh] font-body"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center px-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="font-heading font-bold text-sm text-gray-900">Sort By</h3>
              <button
                onClick={() => setIsSortSheetOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body (Options List) */}
            <div className="px-4 py-4 overflow-y-auto flex-grow flex flex-col gap-1.5 max-h-[55vh]">
              {["Featured", "Best Selling", "Price: Low to High", "Price: High to Low", "Newest Arrivals"].map((option) => {
                const isSelected = sortBy === option;
                return (
                  <button
                    key={option}
                    onClick={() => {
                      handleSortChange(option);
                      setIsSortSheetOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-green-50 text-[#2f9e24]"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={14} className="text-[#2f9e24]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
