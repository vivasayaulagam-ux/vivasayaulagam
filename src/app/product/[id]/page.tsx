"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { products as staticProducts } from "@/data/products";
import { Star, Minus, Plus, Share2, Check, ShieldCheck, Truck, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getCourierFee, getCourierBracketLabel } from "@/lib/shipping";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cartAdded, setCartAdded] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "loading" | "success">("idle");

  // Reviews States
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Review Form States
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccessMsg, setFormSuccessMsg] = useState("");
  const [formErrorMsg, setFormErrorMsg] = useState("");

  // Related Products
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Variant States
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;

      // Check if it's a static product ID (a pure number string)
      if (/^\d+$/.test(productId)) {
        const staticId = parseInt(productId, 10);
        const found = staticProducts.find(p => p.id === staticId);
        if (found) {
          const aesthetics = getEmojiAndBg(found.name || "", found.category || "");
          const pMapped = {
            ...found,
            originalPrice: found.originalPrice || found.salePrice * 1.25,
            bgColor: aesthetics.bgColor,
            emoji: aesthetics.emoji,
            images360: [],
            categories: found.category ? [found.category] : [],
          };
          setProduct(pMapped);
          setActiveImage(pMapped.image || pMapped.emoji || "");
          setLoading(false);
          return;
        }
      }

      // Fetch dynamic database product
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.product) {
          const p = data.product;
          const aesthetics = getEmojiAndBg(p.title, p.category);
          const disc = p.compareAtPrice > p.price 
            ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
            : 0;

          const mappedProduct = {
            id: p._id,
            name: p.title,
            originalPrice: p.compareAtPrice || p.price * 1.25,
            salePrice: p.price,
            discount: disc || 20,
            rating: p.rating ?? 0,
            reviewCount: p.reviewCount ?? 0,
            category: p.category || "Organic Goods",
            categories: p.categories || [],
            emoji: aesthetics.emoji,
            bgColor: aesthetics.bgColor,
            isNew: true,
            isBestSeller: p.collections?.includes("Best Sellers") || false,
            image: p.images && p.images.length > 0 ? p.images[0] : undefined,
            images: p.images || [],
            images360: p.images360 || [],
            description: p.description || "",
            variants: p.variants || [],
            weight: p.weight || 0,
            weightUnit: p.weightUnit || "kg",
            trackInventory: p.trackInventory ?? false,
            quantity: p.quantity ?? 0,
            stock_quantity: p.quantity ?? 0,
            stock_status: p.stock_status || "In Stock",
            is_out_of_stock: p.is_out_of_stock ?? false,
          };
          setProduct(mappedProduct);
          setActiveImage(mappedProduct.image || mappedProduct.emoji || "");
          
          // Auto select first weight/size variant
          if (mappedProduct.variants && mappedProduct.variants.length > 0) {
            const firstSize = mappedProduct.variants.find((v: any) => v.type === 'size');
            if (firstSize) {
              setSelectedVariant(firstSize);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoadingReviews(true);
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.success && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  // Load reviews when productId changes
  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadReviews();
    });
  }, [loadReviews]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMsg("");
    setFormSuccessMsg("");

    if (!formName.trim()) {
      setFormErrorMsg("Name is required.");
      return;
    }
    if (!formEmail.trim() || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formEmail.trim())) {
      setFormErrorMsg("A valid email is required.");
      return;
    }
    if (!formRating) {
      setFormErrorMsg("Rating is required.");
      return;
    }
    if (!formComment.trim()) {
      setFormErrorMsg("Review comment is required.");
      return;
    }
    if (formComment.trim().length < 10) {
      setFormErrorMsg("Review comment must be at least 10 characters long.");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          customer_name: formName.trim(),
          email: formEmail.trim(),
          rating: formRating,
          comment: formComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        let successMsg = "Thank you! Your review has been submitted.";
        if (data.review?.status === 'pending') {
          successMsg += " Your review is waiting for approval.";
        }
        setFormSuccessMsg(successMsg);
        setFormName("");
        setFormEmail("");
        setFormRating(0);
        setFormComment("");
        loadReviews();
      } else {
        setFormErrorMsg(data.error || "Failed to submit review. Please try again.");
      }
    } catch (err) {
      setFormErrorMsg("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Load related products dynamically
  useEffect(() => {
    async function loadRelated() {
      if (!product) return;
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.products) {
          const allOther = data.products.filter((p: any) => p._id !== product.id && p.status === "active");
          let matched = allOther.filter((p: any) => p.category === product.category);
          
          if (matched.length < 4) {
            const extra = allOther.filter((p: any) => p.category !== product.category);
            matched = [...matched, ...extra].slice(0, 4);
          } else {
            matched = matched.slice(0, 4);
          }
          
          const mappedRelated = matched.map((p: any) => {
            const aesthetics = getEmojiAndBg(p.title, p.category);
            const disc = p.compareAtPrice > p.price 
              ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
              : 0;
            return {
              id: p._id,
              name: p.title,
              originalPrice: p.compareAtPrice || p.price * 1.25,
              salePrice: p.price,
              discount: disc || 20,
              rating: p.rating ?? 0,
              reviewCount: p.reviewCount ?? 0,
              category: p.category || "Organic Goods",
              emoji: aesthetics.emoji,
              bgColor: aesthetics.bgColor,
              image: p.images && p.images.length > 0 ? p.images[0] : undefined,
              images: p.images || [],
              trackInventory: p.trackInventory ?? false,
              quantity: p.quantity ?? 0,
              stock_quantity: p.quantity ?? 0,
              stock_status: p.stock_status || "In Stock",
              is_out_of_stock: p.is_out_of_stock ?? false,
            };
          });
          
          setRelatedProducts(mappedRelated);
        } else {
          setRelatedProducts(staticProducts.filter(p => p.id !== product.id).slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load related products:", err);
        setRelatedProducts(staticProducts.filter(p => p.id !== product.id).slice(0, 4));
      }
    }
    loadRelated();
  }, [product]);

  // Pricing calculations based on variant
  const currentSalePrice = selectedVariant 
    ? (typeof selectedVariant.price === 'number' ? selectedVariant.price : product.salePrice + (selectedVariant.additionalPrice || 0))
    : product?.salePrice || 0;

  const currentOriginalPrice = selectedVariant 
    ? (selectedVariant.price ? selectedVariant.price * 1.25 : product.originalPrice + (selectedVariant.additionalPrice || 0))
    : product?.originalPrice || 0;

  const currentSavings = currentOriginalPrice - currentSalePrice;

  // Weight calculations for variant
  const getWeightInKg = () => {
    if (!product) return 0;
    const itemWeight = product.weight || 0;
    const defaultUnit = product.weightUnit || 'kg';
    
    if (selectedVariant) {
      const match = selectedVariant.value.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === 'g' || unit === 'ml') {
          return amount / 1000;
        }
        return amount;
      }
    }
    return defaultUnit === 'g' ? itemWeight / 1000 : itemWeight;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (cartState === "loading") return;
    setCartState("loading");

    setTimeout(() => {
      const finalId = selectedVariant ? `${product.id}-${selectedVariant.value}` : String(product.id);
      const finalName = selectedVariant ? `${product.name} - ${selectedVariant.value}` : product.name;
      const itemWeight = getWeightInKg();

      addItem({
        id: finalId,
        name: finalName,
        price: currentSalePrice,
        quantity: quantity,
        image: product.image || product.emoji,
        weight: itemWeight,
        weightUnit: "kg",
      } as any);
      
      setCartState("success");
      setCartAdded(true);
      setTimeout(() => {
        setCartState("idle");
        setCartAdded(false);
      }, 2000);
    }, 300);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const finalId = selectedVariant ? `${product.id}-${selectedVariant.value}` : String(product.id);
    const finalName = selectedVariant ? `${product.name} - ${selectedVariant.value}` : product.name;
    const itemWeight = getWeightInKg();

    addItem({
      id: finalId,
      name: finalName,
      price: currentSalePrice,
      quantity,
      image: product.image || product.emoji,
      weight: itemWeight,
      weightUnit: "kg",
    } as any);
    router.push("/checkout");
  };

  const handleShare = async () => {
    if (!product || typeof window === "undefined") return;

    const shareData = {
      title: product.name,
      text: `View ${product.name} at Vivasaya Ulagam`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        alert("Product link copied to clipboard");
      }
    } catch (error) {
      console.error("Unable to share product:", error);
    }
  };



  const isProductOutOfStock = product
    ? product.is_out_of_stock === true || 
      product.stock_status === "Out of Stock" || 
      product.quantity === 0 || 
      product.stock_quantity === 0 ||
      (product.trackInventory && (product.quantity ?? 0) <= 0)
    : false;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-white min-h-screen font-body">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-[15px] mt-6 animate-pulse">
            <div className="flex flex-col md:flex-row md:-mx-[15px] gap-8">
              {/* Left Column Skeleton */}
              <div className="md:w-1/2 md:px-[15px] flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="order-2 grid grid-cols-4 gap-2 md:order-1 md:flex md:w-[80px] md:flex-col md:gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square w-full bg-gray-200 rounded-xl md:h-[80px] md:w-[80px]" />
                  ))}
                </div>
                <div className="order-1 relative aspect-square w-full md:w-[480px] bg-gray-200 rounded-2xl md:order-2" />
              </div>
              {/* Right Column Skeleton */}
              <div className="md:w-1/2 md:px-[15px] space-y-6">
                <div className="h-8 bg-gray-200 rounded-md w-3/4" />
                <div className="h-6 bg-gray-200 rounded-md w-1/4" />
                <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                <div className="h-10 bg-gray-200 rounded-md w-1/3" />
                <div className="space-y-3 pt-5 border-t border-gray-100">
                  <div className="h-12 bg-gray-200 rounded-full w-full md:max-w-[340px]" />
                  <div className="h-12 bg-gray-200 rounded-full w-full md:max-w-[340px]" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center text-center p-6 font-body">
        <Navbar />
        <span className="text-5xl mb-3">🌾</span>
        <h1 className="text-xl font-bold text-[#1B1B1B]">Product Not Found</h1>
        <p className="text-xs text-gray-400 max-w-xs mt-1">This product is either draft status, inactive, or removed from Vivasaya catalog.</p>
        <Footer />
      </div>
    );
  }

  const galleryFallback = product.image
    ? [product.image]
    : [product.emoji, product.emoji, product.emoji, product.emoji];
  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : galleryFallback;

  const sizeVariants = product.variants?.filter((v: any) => v.type === 'size') || [];

  // Generate weight/size slabs for the selector
  const slabs = sizeVariants.length > 0 ? sizeVariants : [{
    value: `${product.weight || 1} ${product.weightUnit || 'kg'}`,
    price: product.salePrice,
    stock: product.quantity,
    isDefault: true
  }];

  const selectedVariantValue = selectedVariant?.value || (sizeVariants.length > 0 ? sizeVariants[0].value : `${product.weight || 1} ${product.weightUnit || 'kg'}`);

  return (
    <>
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1rem)] pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-16 bg-white min-h-screen font-body text-[#2e3737]">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-[1200px] px-4 mt-4 sm:px-6 md:mt-6 lg:px-[15px]"
        >
          {/* Main Product Layout */}
          <div className="flex flex-col gap-6 md:flex-row md:-mx-[15px] md:gap-8 items-start">
            
            {/* Left: Images Column */}
            <div className="flex w-full flex-col gap-2 md:w-1/2 md:flex-row md:gap-4 md:px-[15px] items-start">
              {/* Desktop vertical thumbnails (left), Mobile grid of thumbnails (bottom) */}
              <div className="order-2 grid w-full grid-cols-4 gap-2 md:order-1 md:flex md:w-[80px] md:flex-col md:gap-3">
                {galleryImages.slice(0, 4).map((imgUrl: string, idx: number) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => {
                      setActiveImage(imgUrl);
                    }}
                    className={`relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden bg-white border rounded-xl transition-all duration-200 md:h-[80px] md:w-[80px] p-0 ${
                      activeImage === imgUrl
                        ? 'border-[#34a121] opacity-100 shadow-sm scale-102'
                        : 'border-gray-150 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {imgUrl.startsWith("/") || imgUrl.startsWith("http") ? (
                      <img src={imgUrl} alt={`${product.name} thumbnail`} loading="lazy" className="h-full w-full object-cover object-center" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${product.bgColor} flex items-center justify-center`}>
                        <span className="text-xl select-none">{imgUrl}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Main Image Container */}
              <div className="product-main-image-box order-1 relative aspect-square w-full overflow-hidden rounded-xl border border-gray-150 bg-white shadow-sm md:order-2 md:w-[480px] md:rounded-2xl">
                <div className="absolute inset-0 animate-fadeIn">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      {activeImage && (activeImage.startsWith("/") || activeImage.startsWith("http")) ? (
                        <img
                          src={activeImage}
                          alt={product.name}
                          className="h-full w-full object-contain object-center bg-gray-50/50"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${product.bgColor} flex items-center justify-center`}>
                          <span className="relative select-none text-[120px] md:text-[150px] inline-block">
                            {activeImage || product.emoji}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
 
            {/* Right: Product Details Column */}
            <div className="w-full space-y-5 md:w-1/2 md:space-y-6 md:px-[15px]">
              <div>
                <h1 className="font-heading mb-2.5 text-[22px] font-bold leading-tight text-black md:text-3xl">
                  {product.name}
                </h1>
                
                {/* Price Row */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                  <span className="font-heading text-2xl md:text-[28px] font-bold leading-none text-[#34a121]">
                    {formatPrice(currentSalePrice)}
                  </span>
                  {currentOriginalPrice > currentSalePrice && (
                    <>
                      <span className="text-sm md:text-base font-normal text-gray-400 line-through">
                        {formatPrice(currentOriginalPrice)}
                      </span>
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#34a121]">
                        (SAVE {formatPrice(currentSavings)})
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Status & Rating Block */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#222222] md:gap-x-6">
                  {isProductOutOfStock ? (
                    <div className="flex items-center gap-1.5 font-semibold text-red-600">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Out of Stock
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-semibold text-[#34a121]">
                      <span className="h-2 w-2 rounded-full bg-[#34a121] animate-pulse" />
                      In Stock
                    </div>
                  )}

                  <div className="flex items-center gap-2 border-l border-gray-150 pl-4 md:pl-6">
                    <div className="flex text-[#ffc107]">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={15} className={i <= Math.floor(product.rating) ? "fill-current text-[#ffc107]" : "text-gray-200"} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {product.reviewCount} reviews
                    </span>
                  </div>
                </div>

                {isProductOutOfStock && (
                  <p className="text-xs font-semibold text-red-500 mt-3 bg-red-50 border border-red-200/50 rounded-xl px-4 py-2.5 w-full max-w-[340px]">
                    This product is currently out of stock.
                  </p>
                )}
              </div>

              {/* Slabs / Weight Variant Selector (Pill Design) */}
              {sizeVariants.length > 0 && (
                <div className="space-y-4 border-t border-gray-150 pt-5 md:pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-black">
                      QUANTITY: {selectedVariantValue.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 md:gap-3">
                    {slabs.map((slab: any) => {
                      const isSelected = slab.isDefault 
                        ? !selectedVariant 
                        : selectedVariant?.value === slab.value;
                      const stock = typeof slab.stock === 'number' ? slab.stock : product.quantity;
                      const isOutOfStock = product.trackInventory && stock <= 0;

                      return (
                        <button
                          key={slab.value}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            if (slab.isDefault) {
                              setSelectedVariant(null);
                            } else {
                              setSelectedVariant(slab);
                            }
                          }}
                          className={`px-4 py-2.5 text-[13px] md:px-6 md:text-sm font-semibold rounded-full border transition-all duration-200 select-none ${
                            isSelected
                              ? 'bg-[#2d2d2d] border-[#2d2d2d] text-white shadow-sm font-bold'
                              : 'bg-white border-gray-250 text-gray-500 hover:border-[#2d2d2d] hover:text-[#2d2d2d]'
                          } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {slab.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5">
                {/* Quantity & Actions Block */}
                <div className="space-y-4">
                  {/* Quantity Selector + Add to Cart Row */}
                  <div className="flex w-full items-center gap-2 min-[390px]:gap-3 md:max-w-[340px]">
                    {/* Quantity Selector */}
                    <div className={`flex h-12 w-[112px] min-[390px]:w-[120px] shrink-0 select-none items-center justify-between rounded-full border bg-transparent text-black ${
                      isProductOutOfStock ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50' : 'border-black'
                    }`}>
                      <motion.button
                        onClick={() => !isProductOutOfStock && setQuantity(Math.max(1, quantity - 1))}
                        disabled={isProductOutOfStock}
                        whileTap={isProductOutOfStock ? {} : { scale: 0.88 }}
                        className="flex h-full w-[35px] cursor-pointer items-center justify-center rounded-l-full transition-colors duration-200 hover:bg-gray-50 border-0 bg-transparent disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </motion.button>
                      <motion.span
                        key={quantity}
                        className="flex h-full items-center justify-center text-center font-heading text-[15px] font-bold"
                      >
                        {isProductOutOfStock ? 0 : quantity}
                      </motion.span>
                      <motion.button
                        onClick={() => !isProductOutOfStock && setQuantity(quantity + 1)}
                        disabled={isProductOutOfStock}
                        whileTap={isProductOutOfStock ? {} : { scale: 0.88 }}
                        className="flex h-full w-[35px] cursor-pointer items-center justify-center rounded-r-full transition-colors duration-200 hover:bg-gray-50 border-0 bg-transparent disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>

                    {/* Add to Cart Button */}
                    <button 
                      onClick={() => !isProductOutOfStock && handleAddToCart()}
                      disabled={isProductOutOfStock || cartState === "loading"}
                      className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-colors duration-200 border-0 min-[390px]:px-5 ${
                        isProductOutOfStock 
                          ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-60' 
                          : 'bg-[#34a121] hover:bg-[#28801a] cursor-pointer'
                      } ${cartAdded ? "pulse-once" : ""}`}
                    >
                      {isProductOutOfStock 
                        ? "Out of Stock" 
                        : cartState === "loading"
                          ? <><Loader2 size={16} className="animate-spin" /> Adding</>
                          : cartState === "success" || cartAdded
                            ? <><Check size={16} /> ADDED</>
                            : "Add to cart"}
                    </button>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => !isProductOutOfStock && handleBuyNow()}
                    disabled={isProductOutOfStock}
                    className={`flex h-12 w-full md:max-w-[340px] items-center justify-center rounded-full px-5 md:px-6 text-sm font-semibold text-white transition-colors duration-200 border-0 ${
                      isProductOutOfStock
                        ? 'bg-gray-450 hover:bg-gray-450 cursor-not-allowed opacity-60'
                        : 'bg-black hover:bg-gray-900 cursor-pointer'
                    }`}
                  >
                    {isProductOutOfStock ? "Out of Stock" : "Buy It Now"}
                  </button>
                </div>
              </div>

              {/* Share Row */}
              <div className="flex w-full items-center gap-4 border-t border-b border-gray-100 py-4 text-[13px] font-semibold text-[#656565] md:max-w-[340px] md:gap-8">
                <button
                  onClick={handleShare}
                  className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-colors hover:text-[#34a121]"
                >
                  <Share2 size={18} />
                  <span>Share Product</span>
                </button>
              </div>

              {/* Delivery Info Box */}
              <div className="flex w-full md:max-w-[340px] flex-col gap-3 pt-2 text-[13px] font-bold text-[#234229]">
                <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-[#f2fcf4] p-3 min-[390px]:p-3.5">
                  <Truck size={20} className="text-[#34a121] shrink-0 animate-bounce" /> 
                  <div className="flex flex-col">
                    <span className="leading-tight text-[#34a121] font-bold">Delivery in 3–4 Days</span>
                    <span className="text-[11px] text-gray-500 font-medium mt-1">
                      Estimated Courier: <span className="font-bold text-gray-800">₹{
                        getCourierFee(getWeightInKg(), currentSalePrice * quantity)
                      }</span> ({getCourierBracketLabel(getWeightInKg())})
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">Calculated based on selected weight</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-3.5">
                  <ShieldCheck size={18} className="text-[#34a121] shrink-0" /> 
                  <span className="leading-tight text-gray-600 font-medium">100% Secure Payment & Protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-12 md:mt-20">
            {/* Tabs Header */}
            <div className="mb-6 flex flex-wrap items-center justify-start gap-2 md:mb-8 md:gap-2.5">
              {[
                { id: 'description', label: 'Description' },
                { id: 'nutrition', label: 'Nutrition' },
                { id: 'reviews', label: 'Reviews' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2.5 md:px-6 rounded-full text-[13px] md:text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap select-none overflow-hidden border ${
                      isActive
                        ? 'bg-[#34a121] text-white border-[#34a121] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#6E6A60] border-[#E5E0D5] hover:border-[#34a121] hover:text-[#34a121] hover:bg-[#34a121]/5'
                    }`}
                  >
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Tabs Content Container */}
            <div className="pdp-tabs-content p-4 md:p-10 bg-[#FAF9F6] border border-[#E5E0D5] rounded-2xl shadow-sm">
              {activeTab === 'description' && (
                <div className="space-y-6 text-[#2E3737] max-w-3xl">
                  {product.description ? (
                    <div 
                      className="leading-[1.8] font-body text-[15.5px] text-[#2E3737]"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <>
                      <p className="leading-[1.8] font-body text-[15.5px] text-[#2E3737]">Our premium organic product is cultivated using traditional farming methods passed down through generations. We ensure that no synthetic fertilizers or pesticides touch our crops, preserving the natural nutrients and authentic flavor.</p>
                      <p className="leading-[1.8] font-body text-[15.5px] text-[#2E3737]">Perfect for families looking to switch to a healthier, sustainable lifestyle without compromising on taste.</p>
                      <ul className="list-disc pl-5 space-y-2.5 mt-4 font-semibold text-[#2E3737] font-body text-[15.5px]">
                        <li>100% Certified Organic</li>
                        <li>Sourced directly from Tamil Nadu farms</li>
                        <li>Rich in natural vitamins and minerals</li>
                        <li>Eco-friendly packaging</li>
                      </ul>
                    </>
                  )}
                </div>
              )}
              {activeTab === 'nutrition' && (
                <div className="max-w-3xl text-[#2E3737] leading-[1.8] font-body text-[15.5px]">
                  <p className="font-semibold text-[#34a121] text-[16px] mb-3">100% Organic Raw Ingredients.</p>
                  <p className="text-[#6E6A60]">No preservatives, artificial colors, or flavors added. Carefully sourced and hygienically packed to preserve freshness and nutrition value.</p>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-10">
                  {/* Reviews Summary Header */}
                  <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-[#E5E0D5] bg-white p-4 shadow-sm md:flex-row md:gap-8 md:p-6">
                    <div className="text-center md:text-left">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Average Rating</p>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <span className="text-4xl font-extrabold text-black font-heading leading-none">
                          {product.rating ? product.rating.toFixed(1) : "0.0"}
                        </span>
                        <div>
                          <div className="flex text-[#ffc107] mb-0.5 justify-center sm:justify-start">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isFilled = star <= Math.round(product.rating || 0);
                              return (
                                <Star
                                  key={star}
                                  size={16}
                                  className={isFilled ? "fill-current text-[#ffc107]" : "text-gray-200"}
                                />
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-400 font-semibold">{product.reviewCount || 0} reviews</p>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown progress bars */}
                    <div className="w-full md:w-72 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter((r) => r.rating === stars).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                            <span className="w-3 text-right">{stars}</span>
                            <Star size={11} className="fill-current text-[#ffc107]" />
                            <div className="flex-1 h-2 bg-gray-150 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#34a121] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-gray-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="pt-4">
                    <h2 className="text-xl md:text-2xl font-bold text-[#222] mb-8 font-heading">
                      {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} for {product.name}
                    </h2>
                    
                    {loadingReviews ? (
                      <div className="py-8 text-center text-gray-500 text-sm">
                        <Loader2 className="animate-spin inline-block mr-2 text-[#3bb54a]" size={16} />
                        Loading reviews...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="py-8 text-[#666] bg-transparent text-[15px]">
                        There are no reviews yet.
                      </div>
                    ) : (
                      <ol className="m-0 p-0 list-none space-y-6 md:space-y-8">
                        {reviews.map((rev) => (
                          <li key={rev._id} className="flex gap-4 md:gap-5 pb-6 border-b border-[#eee]">
                            <div className="shrink-0">
                              {/* Gravatar placeholder */}
                              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#f1f1f1] flex items-center justify-center text-[#999] text-xl font-bold uppercase overflow-hidden">
                                {rev.customer_name.charAt(0)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                                <div className="text-[15px]">
                                  <strong className="text-[#222] font-semibold">{rev.customer_name}</strong>
                                  <span className="text-[#999] mx-2">–</span>
                                  <time className="text-[#999]" dateTime={new Date(rev.createdAt).toISOString()}>
                                    {new Date(rev.createdAt).toLocaleDateString("en-US", {
                                      year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                  </time>
                                </div>
                                <div className="flex text-[#ee9e13]">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={star <= rev.rating ? "fill-[#ee9e13] text-[#ee9e13]" : "fill-transparent text-[#ddd]"}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="text-[#666] text-[15px] leading-relaxed">
                                <p>{rev.comment}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* Write a Review Form */}
                  <div className="pt-2 md:pt-4">
                    <span className="block text-xl md:text-2xl font-bold text-[#222] mb-2 font-heading">
                      {reviews.length === 0 ? "Be the first to review" : "Add a review"}
                    </span>
                    <p className="text-[14px] text-[#666] mb-6">
                      Your email address will not be published. Required fields are marked *
                    </p>
                    
                    <form onSubmit={handleReviewSubmit} className="space-y-5 max-w-3xl">
                      {formSuccessMsg && (
                        <div className="p-4 bg-[#f2fcf4] border-l-4 border-[#3bb54a] text-[#234229] mb-6 text-[15px]">
                          {formSuccessMsg}
                        </div>
                      )}
                      {formErrorMsg && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 mb-6 text-[15px]">
                          {formErrorMsg}
                        </div>
                      )}

                      {/* Rating Stars Selection */}
                      <div className="flex items-center gap-4">
                        <label className="text-[15px] font-semibold text-[#222]">Your rating *</label>
                        <div className="flex gap-1 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFormRating(star)}
                              className="focus:outline-none p-0 cursor-pointer bg-transparent border-none transition-transform hover:scale-110"
                            >
                              <Star
                                size={18}
                                className={star <= formRating ? "fill-[#ee9e13] text-[#ee9e13]" : "fill-transparent text-[#ccc]"}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment Textarea */}
                      <div className="space-y-1.5">
                        <label htmlFor="reviewer-comment" className="block text-[15px] font-semibold text-[#222]">
                          Your review *
                        </label>
                        <textarea
                          id="reviewer-comment"
                          rows={4}
                          value={formComment}
                          onChange={(e) => setFormComment(e.target.value)}
                          className="w-full px-4 py-3 border border-[#ddd] bg-[#f9f9f9] text-[#444] text-[15px] focus:outline-none focus:border-[#3bb54a] focus:bg-white transition-colors resize-y min-h-[120px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name Input */}
                        <div className="space-y-1.5">
                          <label htmlFor="reviewer-name" className="block text-[15px] font-semibold text-[#222]">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="reviewer-name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full h-11 px-4 border border-[#ddd] bg-[#f9f9f9] text-[#444] text-[15px] focus:outline-none focus:border-[#3bb54a] focus:bg-white transition-colors"
                          />
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1.5">
                          <label htmlFor="reviewer-email" className="block text-[15px] font-semibold text-[#222]">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="reviewer-email"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            className="w-full h-11 px-4 border border-[#ddd] bg-[#f9f9f9] text-[#444] text-[15px] focus:outline-none focus:border-[#3bb54a] focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={formSubmitting}
                          className="h-12 inline-flex items-center justify-center gap-2 px-8 text-[15px] font-semibold text-white bg-[#3bb54a] hover:bg-[#009245] transition-colors duration-200 border-0 disabled:opacity-70 cursor-pointer uppercase tracking-wider"
                        >
                          {formSubmitting ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-14 md:mt-20">
            <h2 className="text-center font-heading font-extrabold text-2xl sm:text-3xl text-[#1B1B1B] mb-8">Related Products</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
              {relatedProducts.map(prod => (
                <div key={prod.id} className="w-full">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}

