"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ShoppingBag, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

const slugify = (text: string) => {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  _id: string;
  name: string;
  title?: string;
  price?: number;
  salePrice?: number;
  image?: string;
  images?: string[];
  category?: string;
  categories?: string[];
  slug?: string;
}



export default function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [dbCategories, setDbCategories] = useState<{ _id: string; name: string; slug: string; isVisible?: boolean }[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when drawer opens
  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      // Disable body scroll when open
      document.body.style.overflow = "hidden";
      
      if (!productsLoaded) {
        fetch("/api/products?view=search&limit=100")
          .then((res) => res.json() as Promise<{ success?: boolean; products?: Product[] }>)
          .then((data) => {
            if (isMounted && data.success && data.products) {
              setProducts(data.products);
            }
          })
          .catch((err: unknown) => {
            console.error("Failed to load products for search", err);
          })
          .finally(() => {
            if (isMounted) {
              setProductsLoaded(true);
            }
          });
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      isMounted = false;
      document.body.style.overflow = "";
    };
  }, [isOpen, productsLoaded]);

  // Load visible database categories
  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.success && data.categories) {
            setDbCategories(data.categories.filter((c: any) => c.isVisible !== false));
          }
        })
        .catch((err) => {
          console.error("Failed to load categories in search drawer", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!categoryOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [categoryOpen]);

  // Handle client-side search filtering
  const filteredProducts = useMemo(() => {
    if (!query.trim() && !selectedCategory) {
      return [];
    }

    const filtered = products.filter((product) => {
      const productName = product.name || product.title || "";
      const productCategory = product.category || "";
      const productCategories = product.categories || [];

      const matchesQuery = !query.trim() ||
        productName.toLowerCase().includes(query.toLowerCase()) ||
        productCategory.toLowerCase().includes(query.toLowerCase()) ||
        productCategories.some((c: string) => c.toLowerCase().includes(query.toLowerCase()));
        
      const matchesCategory = !selectedCategory ||
        slugify(productCategory) === slugify(selectedCategory) ||
        productCategories.some((c: string) => slugify(c) === slugify(selectedCategory));

      return matchesQuery && matchesCategory;
    });
    return filtered.slice(0, 5);
  }, [query, selectedCategory, products]);



  const hasSearch = query.trim() !== "" || selectedCategory !== "";
  const loading = hasSearch && !productsLoaded;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1050]"
          />

          {/* Sliding Search Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-full md:w-[380px] bg-white z-[1060] shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col font-body"
          >
            {/* Header: Exact same look with borderless X button */}
            <div className="h-[72px] border-b border-gray-150 px-[26px] flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#010101] uppercase tracking-wider">
                Search our site
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center transition-all duration-200 text-black hover:scale-110 bg-transparent border-0 cursor-pointer p-0"
                aria-label="Close search"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Inner Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              
              {/* Inputs Container with a solid bottom border */}
              <div className="p-[26px] border-b border-gray-150 flex flex-col gap-4">
                
                {/* Category Custom Dropdown Selector */}
                <div className="relative w-full" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryOpen((o) => !o)}
                    className="w-full h-[50px] px-4 pr-10 border border-gray-200 text-sm focus:outline-none focus:border-black bg-white rounded-none flex items-center justify-between font-medium text-[#222222] cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedCategory
                        ? dbCategories.find((c) => c.slug === selectedCategory)?.name || selectedCategory
                        : "All Categories"}
                    </span>
                    <ChevronDown size={18} strokeWidth={1.5} className={`text-gray-400 transition-transform duration-200 shrink-0 ${categoryOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {categoryOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 z-[1070] mt-1 w-full bg-white border border-gray-200 rounded-none shadow-lg max-h-[240px] overflow-y-auto list-none p-0 m-0"
                      >
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory("");
                              setCategoryOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedCategory === "" ? "font-bold text-primary" : "text-[#222222]"
                            }`}
                          >
                            All Categories
                          </button>
                        </li>
                        {dbCategories.map((cat) => {
                          const isSel = selectedCategory === cat.slug;
                          return (
                            <li key={cat._id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(cat.slug);
                                  setCategoryOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors truncate ${
                                  isSel ? "font-bold text-primary" : "text-[#222222]"
                                }`}
                                title={cat.name}
                              >
                                {cat.name}
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Input Box */}
                <div className="relative w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-[50px] px-4 pr-12 border border-gray-200 text-sm focus:outline-none focus:border-black transition-colors rounded-none placeholder-gray-400 font-medium text-[#010101]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} strokeWidth={1.5} />
                  </div>
                </div>



              </div>

              {/* Search Results Area - Blank by default when no search is active */}
              <div className="flex-1 p-[26px]">
                {!hasSearch ? null : loading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Search Results ({filteredProducts.length})
                    </p>
                    <div className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => {
                        const productName = product.name || product.title || "";
                        const productImg = product.image || product.images?.[0] || "/uploads/organic-placeholder.png";
                        const productPrice = product.salePrice ?? product.price ?? 0;
                        return (
                          <Link
                            key={product._id}
                            href={`/product/${product._id}`}
                            onClick={onClose}
                            className="flex items-center gap-4 py-3 group cursor-pointer transition-all duration-200"
                          >
                            <div className="w-[60px] h-[60px] relative overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 rounded-none">
                              <Image
                                src={productImg}
                                alt={productName}
                                fill
                                loading="lazy"
                                sizes="60px"
                                quality={75}
                                placeholder="blur"
                                blurDataURL={IMAGE_BLUR_DATA_URL}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-[#010101] truncate group-hover:text-primary transition-colors leading-tight">
                                {productName}
                              </h4>
                              <p className="text-xs text-gray-400 mt-1 capitalize">
                                {product.category || "Organic Range"}
                              </p>
                              <p className="text-sm font-bold text-primary mt-0.5">
                                ₹{productPrice.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all">
                              <ArrowRight size={16} />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href={`/search?q=${encodeURIComponent(query || selectedCategory)}`}
                      onClick={onClose}
                      className="w-full h-[50px] border border-gray-200 hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm font-bold tracking-wider text-[#010101] transition-all rounded-none mt-4"
                    >
                      View All Results
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-70">
                    <p className="text-sm font-medium text-gray-500">
                      No results found for &ldquo;<span className="font-bold text-[#010101]">{query}</span>&rdquo;
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Actions Area */}
            <div className="p-[26px] border-t border-gray-150 bg-[#F8F6F1]/30">
              <Link
                href="/shop"
                onClick={onClose}
                className="w-full bg-[#34a121] hover:bg-[#113F25] text-white h-[50px] rounded-none flex items-center justify-center gap-2 font-bold tracking-wider text-sm shadow-sm transition-all duration-200"
              >
                <ShoppingBag size={18} />
                Explore All Products
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
