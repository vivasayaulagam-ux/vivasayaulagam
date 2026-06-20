"use client";

import React, { useState, useEffect, useRef, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Check, Loader2, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { categories as staticCategories } from "@/data/categories";
import { products as staticProducts, Product } from "@/data/products";

interface DbCategory {
  id?: number | string;
  _id?: string;
  name: string;
  slug?: string;
  emoji?: string;
  bgColor?: string;
  isVisible?: boolean;
}

interface DbProduct {
  _id: string | { toString: () => string };
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
}

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

function CategoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement>(null);
  const skeletonTimer = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  // Categories list
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);

  // Filter & Sorting States
  const [showFilters, setShowFilters] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [manualSort, setManualSort] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  // Draft price for mobile filter sheet (applied only on "Apply Filter" tap)
  const [pendingMaxPrice, setPendingMaxPrice] = useState<number | null>(null);

  // Active Category Sync
  const activeSlug = searchParams.get("category") || "all";

  // Fetch db categories
  useEffect(() => {
    async function loadDbCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = (await res.json()) as { success?: boolean; categories?: DbCategory[] };
        const visibleCats = data.categories?.filter((category) => category.isVisible !== false) ?? [];
        if (data.success && visibleCats.length > 0) {
          setDbCategories(visibleCats);
        }
      } catch (err) {
        console.error("Failed to load DB categories:", err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadDbCategories();
  }, []);

  const activeCategories = dbCategories.length > 0 ? dbCategories : staticCategories;

  // Fetch db products
  useEffect(() => {
    async function loadLiveProducts() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = (await res.json()) as { success?: boolean; products?: DbProduct[] };
        const apiProducts = data.products ?? [];
        if (data.success && apiProducts.length > 0) {
          const activeDbProds = apiProducts
            .filter((p) => p.status === "active")
            .map((p) => {
              const compareAtPrice = p.compareAtPrice ?? p.price * 1.25;
              const aesthetics = getEmojiAndBg(p.title, p.category || "");
              const disc = compareAtPrice > p.price
                ? Math.round(((compareAtPrice - p.price) / compareAtPrice) * 100)
                : 0;

              return {
                id: p._id.toString(),
                name: p.title,
                originalPrice: compareAtPrice,
                salePrice: p.price,
                discount: disc || 20,
                rating: p.rating || 4.7,
                reviewCount: p.reviewCount || 8,
                category: p.category || "Organic Goods",
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
          setDbProducts(activeDbProds);
        }
      } catch (err) {
        console.error("Failed to load live database products:", err);
      } finally {
        setLoadingProds(false);
      }
    }
    loadLiveProducts();
  }, []);

  const combinedProducts = [...dbProducts, ...staticProducts];

  // Price limit detection
  const maxProductPrice = combinedProducts.reduce((max, p) => (p.salePrice > max ? p.salePrice : max), 1000);
  const [maxPrice, setMaxPrice] = useState(1000);

  // Set default max price when products load
  useEffect(() => {
    if (combinedProducts.length > 0) {
      setMaxPrice(maxProductPrice);
    }
  }, [loadingProds, maxProductPrice]);

  const sortBy = manualSort ?? "Featured";

  // Derived: is price filter active (not at maximum)?
  const isPriceFiltered = maxPrice < maxProductPrice;
  // Count of active filters (currently only price filter)
  const activeFilterCount = isPriceFiltered ? 1 : 0;

  // When filter sheet opens, seed pending price to current committed value
  const openFilterSheet = () => {
    setPendingMaxPrice(maxPrice);
    setShowFilters(true);
  };
  const applyMobileFilter = () => {
    if (pendingMaxPrice !== null) {
      flashSkeleton();
      setMaxPrice(pendingMaxPrice);
    }
    setShowFilters(false);
  };
  const clearAllFilters = () => {
    flashSkeleton();
    setMaxPrice(maxProductPrice);
    setPendingMaxPrice(maxProductPrice);
    setShowFilters(false);
  };

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
      router.push(`/categories?${params.toString()}`, { scroll: false });
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
  const activeTab = activeCategories.find((t) => t.slug === activeSlug);
  const pageTitle = activeSlug === "all" ? "All Categories" : (activeTab ? activeTab.name : "All Categories");

  // Products filtering
  const filteredProducts = combinedProducts.filter((product) => {
    // 1. Category Filter
    if (activeSlug !== "all") {
      const pageTitleLower = pageTitle.toLowerCase();
      const matchesCategory = product.category?.toLowerCase() === pageTitleLower;
      const matchesCategories = product.categories?.some(
        (c) => c.toLowerCase() === pageTitleLower || c.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') === activeSlug
      );
      if (!matchesCategory && !matchesCategories) return false;
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
    return 0; // Default Featured
  });

  if (loadingCats || loadingProds) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-body text-xs font-bold text-black">
        <Loader2 className="animate-spin text-primary mr-2" size={20} /> Loading categories catalog...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-secondary">
      {/* ── TOP SECTION: Dynamic horizontal category tabs bar ── */}
      <div style={{ top: 0 }} className="border-b border-gray-100 bg-white sticky z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.01)] transition-all">

        {/* ── MOBILE CATEGORY CHIP SELECTOR (hidden on md+) ── */}
        <div className="md:hidden" style={{ padding: "12px 14px" }}>
          <div
            ref={tabsRef}
            className="flex flex-nowrap overflow-x-auto hide-scrollbar"
            style={{ gap: "8px" }}
          >
            {/* "All Products" chip */}
            <button
              onClick={() => handleCategoryChange("all")}
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                lineHeight: 1,
                border: activeSlug === "all" ? "none" : "1px solid #e5e7eb",
                background: activeSlug === "all" ? "#2f9e24" : "#ffffff",
                color: activeSlug === "all" ? "#ffffff" : "#6b7280",
                boxShadow: activeSlug === "all" ? "0 4px 12px rgba(47, 158, 36, 0.22)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              All Products
            </button>

            {activeCategories.map((tab) => {
              const slugVal = tab.slug || tab.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
              const isActive = activeSlug === slugVal;
              return (
                <button
                  key={((tab as any)._id) || tab.id || slugVal}
                  onClick={() => handleCategoryChange(slugVal)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "999px",
                    whiteSpace: "nowrap",
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    lineHeight: 1,
                    border: isActive ? "none" : "1px solid #e5e7eb",
                    background: isActive ? "#2f9e24" : "#ffffff",
                    color: isActive ? "#ffffff" : "#6b7280",
                    boxShadow: isActive ? "0 4px 12px rgba(47, 158, 36, 0.22)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP CATEGORY TEXT TABS (hidden on mobile, shown md+) ── */}
        <div className="hidden md:block">
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
              className="flex w-full flex-nowrap items-center justify-start gap-x-5 py-2 overflow-x-auto scroll-smooth hide-scrollbar px-4 md:flex-1 md:px-8 lg:gap-8"
            >
              <button
                onClick={() => handleCategoryChange("all")}
                className={`whitespace-nowrap border-b-2 py-2 text-xs font-semibold tracking-wider transition-all duration-200 outline-none cursor-pointer sm:text-sm ${
                  activeSlug === "all"
                    ? "border-primary text-primary scale-105"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                All Products
              </button>
              {activeCategories.map((tab) => {
                const slugVal = tab.slug || tab.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                const isActive = activeSlug === slugVal;
                return (
                  <button
                    key={((tab as any)._id) || tab.id || slugVal}
                    onClick={() => handleCategoryChange(slugVal)}
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

          {/* ── MOBILE TOOLBAR (hidden md+) — single unified pill bar ── */}
          <div className="md:hidden mb-5">
            {/* Two-section unified pill bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                height: "46px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "999px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                overflow: "hidden",
                margin: "0 0 10px 0",
              }}
            >
              {/* LEFT — Filter section */}
              <button
                onClick={() => openFilterSheet()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  border: "none",
                  background: (showFilters || activeFilterCount > 0) ? "#f2fbf1" : "transparent",
                  color: (showFilters || activeFilterCount > 0) ? "#2f9e24" : "#222222",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: (showFilters || activeFilterCount > 0) ? 600 : 500,
                  cursor: "pointer",
                  transition: "background 0.18s ease, color 0.18s ease",
                  borderRight: "1px solid #e5e7eb",
                  whiteSpace: "nowrap",
                  paddingLeft: "4px",
                  paddingRight: "4px",
                }}
              >
                <SlidersHorizontal
                  size={15}
                  strokeWidth={1.9}
                  color={(showFilters || activeFilterCount > 0) ? "#2f9e24" : "#6b7280"}
                />
                <span>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </span>
              </button>

              {/* RIGHT — Sort By section */}
              <button
                onClick={() => setSortOpen(!sortOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  border: "none",
                  background: sortOpen ? "#f2fbf1" : "transparent",
                  color: sortOpen ? "#2f9e24" : "#222222",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: sortOpen ? 600 : 500,
                  cursor: "pointer",
                  transition: "background 0.18s ease, color 0.18s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  paddingLeft: "4px",
                  paddingRight: "8px",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 20px)",
                  }}
                >
                  {sortBy === "Featured"
                    ? "Sort: Featured"
                    : sortBy === "Best Selling"
                    ? "Sort: Best Selling"
                    : sortBy === "Price: Low to High"
                    ? "Price: Low→High"
                    : sortBy === "Price: High to Low"
                    ? "Price: High→Low"
                    : "Newest"}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  color={sortOpen ? "#2f9e24" : "#6b7280"}
                  style={{
                    flexShrink: 0,
                    transform: sortOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Product count */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "#9ca3af",
                fontWeight: 500,
                textAlign: "center",
                margin: 0,
              }}
            >
              {sortedProducts.length} Products Found
            </p>

            {/* Mobile Sort — Bottom Sheet */}
            <AnimatePresence>
              {sortOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSortOpen(false)}
                    className="fixed inset-0 z-[1050] bg-black/30"
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 260 }}
                    className="fixed bottom-0 left-0 right-0 z-[1060] bg-white rounded-t-[20px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
                    style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
                  >
                    {/* Handle bar */}
                    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                      <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "#e5e7eb" }} />
                    </div>
                    {/* Title */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "16px", fontWeight: 700, color: "#111827" }}>Sort By</span>
                      <button
                        onClick={() => setSortOpen(false)}
                        style={{ width: "30px", height: "30px", borderRadius: "999px", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
                      >
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    </div>
                    {/* Options */}
                    <div style={{ padding: "8px 12px" }}>
                      {["Featured", "Best Selling", "Price: Low to High", "Price: High to Low", "Newest Arrivals"].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            flashSkeleton();
                            setManualSort(option);
                            setSortOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "14px 12px",
                            borderRadius: "12px",
                            border: "none",
                            background: sortBy === option ? "#f0fdf4" : "transparent",
                            color: sortBy === option ? "#2f9e24" : "#374151",
                            fontFamily: "var(--font-body)",
                            fontSize: "15px",
                            fontWeight: sortBy === option ? 600 : 400,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.15s",
                          }}
                        >
                          <span>{option}</span>
                          {sortBy === option && <Check size={16} strokeWidth={2.5} color="#2f9e24" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>


          {/* ── DESKTOP TOOLBAR (hidden on mobile, shown md+) ── */}
          <div className="hidden md:flex mb-7 flex-col items-stretch gap-3 border-b border-gray-100 pb-5 text-xs font-semibold text-gray-800 sm:flex-row sm:items-center sm:justify-between md:mb-8">
            {/* Left: Filter Toggle Button & Product Count */}
            <div className="flex items-center gap-4 justify-between sm:justify-start">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border transition-all cursor-pointer hover:bg-gray-50 hover:border-gray-400 select-none ${
                  showFilters ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-800 bg-white"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
              </button>
              <span className="text-gray-400 font-bold hidden sm:inline">
                {sortedProducts.length} Products Found
              </span>
            </div>

            {/* Right: Sort Dropdown Menu (desktop small dropdown) */}
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


          {/* Desktop Inline Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden mb-8 hidden lg:block"
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

          {/* Mobile Filter Drawer (Bottom Sheet) */}
          <AnimatePresence>
            {showFilters && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-[1px] lg:hidden"
                />

                {/* Bottom Sheet */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 250 }}
                  className="fixed bottom-0 left-0 right-0 z-[1060] bg-white rounded-t-[20px] flex flex-col font-body lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
                  style={{ maxHeight: "80vh" }}
                >
                  {/* Drag handle */}
                  <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                    <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "#e5e7eb" }} />
                  </div>

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 14px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "16px", fontWeight: 700, color: "#111827" }}>Filter Products</span>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      style={{ width: "30px", height: "30px", borderRadius: "999px", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", flexShrink: 0 }}
                      aria-label="Close filters"
                    >
                      <X size={16} strokeWidth={2.2} />
                    </button>
                  </div>

                  {/* Scrollable content */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>

                    {/* Active filter chips */}
                    {isPriceFiltered && (
                      <div style={{ marginBottom: "20px" }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Active Filters</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px 6px 12px", borderRadius: "999px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#2f9e24" }}>Max ₹{maxPrice}</span>
                            <button
                              onClick={() => { flashSkeleton(); setMaxPrice(maxProductPrice); setPendingMaxPrice(maxProductPrice); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "999px", background: "#dcfce7", border: "none", cursor: "pointer", padding: 0, color: "#2f9e24", flexShrink: 0 }}
                              aria-label="Remove price filter"
                            >
                              <X size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price Slider */}
                    <div style={{ marginBottom: "8px" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>Price Range</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "#374151" }}>Max Price</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: "#2f9e24", background: "#f0fdf4", padding: "3px 10px", borderRadius: "999px" }}>₹{pendingMaxPrice ?? maxPrice}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max={maxProductPrice}
                        value={pendingMaxPrice ?? maxPrice}
                        onChange={(e) => setPendingMaxPrice(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "#2f9e24", cursor: "pointer", height: "6px" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", fontWeight: 600, marginTop: "6px" }}>
                        <span>₹50</span>
                        <span>₹{maxProductPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Clear All + Apply Filter */}
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flexShrink: 0, paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
                    {/* Clear All */}
                    <button
                      onClick={clearAllFilters}
                      disabled={!isPriceFiltered}
                      style={{
                        height: "46px",
                        borderRadius: "999px",
                        border: isPriceFiltered ? "1.5px solid #2f9e24" : "1.5px solid #e5e7eb",
                        background: "#ffffff",
                        color: isPriceFiltered ? "#2f9e24" : "#9ca3af",
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: isPriceFiltered ? "pointer" : "not-allowed",
                        transition: "all 0.2s ease",
                        opacity: isPriceFiltered ? 1 : 0.5,
                      }}
                    >
                      Clear All
                    </button>
                    {/* Apply Filter */}
                    <button
                      onClick={applyMobileFilter}
                      style={{
                        height: "46px",
                        borderRadius: "999px",
                        border: "none",
                        background: "#2f9e24",
                        color: "#ffffff",
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(47,158,36,0.25)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Apply Filter
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── 4-COLUMN RESPONSIVE GRID MATCHING BEST SELLING PAGE ── */}
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

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-body text-xs font-bold text-black">
          <Loader2 className="animate-spin text-primary mr-2" size={20} /> Loading categories catalog...
        </div>
      }
    >
      <Navbar />
      <div className="pt-[var(--navbar-height)] bg-white min-h-screen flex flex-col justify-between">
        <CategoriesPageContent />
        <Footer />
      </div>
    </Suspense>
  );
}
