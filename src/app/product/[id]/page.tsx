"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { products as staticProducts, Product } from "@/data/products";
import { Star, Minus, Plus, Heart, Share2, Check, ShieldCheck, Truck, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
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
  const [isWished, setIsWished] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

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
          setProduct(found);
          setActiveImage(found.image || found.emoji || "");
          setLoading(false);
          return;
        }
      }

      // Fetch dynamic database product
      try {
        const res = await fetch(`/api/products/${productId}`);
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
            rating: p.rating || 4.7,
            reviewCount: p.reviewCount || 8,
            category: p.category || "Organic Goods",
            categories: p.categories || [],
            emoji: aesthetics.emoji,
            bgColor: aesthetics.bgColor,
            isNew: true,
            isBestSeller: p.collections?.includes("Best Sellers") || false,
            image: p.images && p.images.length > 0 ? p.images[0] : undefined,
            images: p.images || [],
            description: p.description || "",
            variants: p.variants || [],
            weight: p.weight || 0,
            weightUnit: p.weightUnit || "kg"
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
    let itemWeight = product.weight || 0;
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
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center font-body">
        <Navbar />
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-gray-500 mt-2">Loading fresh details...</p>
        <Footer />
      </div>
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

  return (
    <>
      <Navbar />
      <main className="pt-[calc(var(--navbar-height)+1rem)] pb-16 bg-white min-h-screen font-body text-[#2e3737]">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-[1200px] px-6 lg:px-[15px] mt-6"
        >
          {/* Main Product Layout */}
          <div className="flex flex-col md:flex-row md:-mx-[15px] gap-8">
            
            {/* Left: Images Column */}
            <div className="md:w-1/2 md:px-[15px] flex flex-col gap-3 md:flex-row md:gap-4">
              {/* Desktop vertical thumbnails (left), Mobile grid of thumbnails (bottom) */}
              <div className="order-2 grid grid-cols-4 gap-2 md:order-1 md:flex md:w-[80px] md:flex-col md:gap-3">
                {galleryImages.slice(0, 4).map((imgUrl: string, idx: number) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden bg-white border rounded-xl transition-all duration-200 md:h-[80px] md:w-[80px] p-0 ${
                      activeImage === imgUrl
                        ? 'border-primary opacity-100 shadow-sm scale-102'
                        : 'border-gray-150 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {imgUrl.startsWith("/") || imgUrl.startsWith("http") ? (
                      <img src={imgUrl} alt={`${product.name} thumbnail`} className="h-full w-full object-cover object-center" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${product.bgColor} flex items-center justify-center`}>
                        <span className="text-xl select-none">{imgUrl}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Main Image Container */}
              <div className="order-1 relative aspect-square w-full md:w-[480px] overflow-hidden bg-white border border-gray-150 rounded-2xl md:order-2 shadow-sm">
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
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${product.bgColor} flex items-center justify-center`}>
                        <span className="relative select-none text-[120px] md:text-[150px]">{activeImage || product.emoji}</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
 
            {/* Right: Product Details Column */}
            <div className="md:w-1/2 md:px-[15px] space-y-6">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight text-black mb-2.5">
                  {product.name}
                </h1>
                
                {/* Price Row */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                  <span className="font-heading text-2xl md:text-[28px] font-bold leading-none text-primary">
                    {formatPrice(currentSalePrice)}
                  </span>
                  {currentOriginalPrice > currentSalePrice && (
                    <>
                      <span className="text-sm md:text-base font-normal text-gray-400 line-through">
                        {formatPrice(currentOriginalPrice)}
                      </span>
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-primary">
                        (SAVE {formatPrice(currentSavings)})
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Status & Rating Block */}
                <div className="flex items-center gap-x-6 gap-y-2 flex-wrap text-sm text-[#222222]">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    In Stock
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-gray-150 pl-6">
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
              </div>

              {/* Weight Variant Selector */}
              {sizeVariants.length > 0 && (
                <div className="border-t border-gray-100 pt-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select Weight / Size</span>
                  <div className="flex flex-wrap gap-2">
                    {sizeVariants.map((v: any) => {
                      const isSelected = selectedVariant?.value === v.value;
                      const varPrice = typeof v.price === 'number' ? v.price : product.salePrice + (v.additionalPrice || 0);
                      return (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`px-4.5 py-2.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {v.value} - {formatPrice(varPrice)}
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
                  <div className="flex items-center gap-3 w-full md:max-w-[340px]">
                    {/* Quantity Selector */}
                    <div className="flex h-12 w-[120px] shrink-0 select-none items-center justify-between rounded-full border border-black bg-transparent text-black">
                      <motion.button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        whileTap={{ scale: 0.88 }}
                        className="flex h-full w-[35px] cursor-pointer items-center justify-center rounded-l-full transition-colors duration-200 hover:bg-gray-50 border-0 bg-transparent"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </motion.button>
                      <motion.span
                        key={quantity}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex h-full items-center justify-center text-center font-heading text-[15px] font-bold"
                      >
                        {quantity}
                      </motion.span>
                      <motion.button
                        onClick={() => setQuantity(quantity + 1)}
                        whileTap={{ scale: 0.88 }}
                        className="flex h-full w-[35px] cursor-pointer items-center justify-center rounded-r-full transition-colors duration-200 hover:bg-gray-50 border-0 bg-transparent"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </motion.button>
                    </div>

                    {/* Add to Cart Button */}
                    <button 
                      onClick={handleAddToCart}
                      className={`flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-dark px-5 text-sm font-semibold text-white transition-colors duration-200 border-0 ${cartAdded ? "pulse-once" : ""}`}
                    >
                      {cartAdded ? <><Check size={16} /> ADDED</> : "Add to cart"}
                    </button>
                  </div>

                  {/* Buy Now Button */}
                  <button
                    onClick={handleBuyNow}
                    className="flex h-12 w-full md:max-w-[340px] cursor-pointer items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-gray-900 border-0"
                  >
                    Buy It Now
                  </button>
                </div>
              </div>

              {/* Wishlist & Share Divider Row */}
              <div className="py-4 border-t border-b border-gray-100 flex items-center gap-8 text-[13px] font-semibold text-[#656565] w-full md:max-w-[340px]">
                <button 
                  onClick={() => setIsWished(!isWished)} 
                  className={`flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-colors hover:text-primary ${isWished ? 'font-bold text-red-600' : ''}`}
                >
                  <Heart size={18} className="transition-transform duration-200 active:scale-125" fill={isWished ? "currentColor" : "none"} />
                  <span>{isWished ? 'Wishlisted' : 'Add to Wishlist'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-colors hover:text-primary"
                >
                  <Share2 size={18} />
                  <span>Share Product</span>
                </button>
              </div>

              {/* Delivery Info Box */}
              <div className="flex w-full md:max-w-[340px] flex-col gap-3 pt-2 text-[13px] font-bold text-[#234229]">
                <div className="flex items-center gap-3 bg-[#f2fcf4] p-3.5 rounded-xl border border-primary/10">
                  <Truck size={20} className="text-primary shrink-0 animate-bounce" /> 
                  <div className="flex flex-col">
                    <span className="leading-tight text-primary font-bold">Delivery in 3–4 Days</span>
                    <span className="text-[11px] text-gray-500 font-medium mt-1">
                      Estimated Courier: <span className="font-bold text-gray-800">₹{
                        getCourierFee(getWeightInKg(), currentSalePrice * quantity)
                      }</span> ({getCourierBracketLabel(getWeightInKg())})
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">Calculated based on selected weight</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-3.5">
                  <ShieldCheck size={18} className="text-primary shrink-0" /> 
                  <span className="leading-tight text-gray-600 font-medium">100% Secure Payment & Protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-20">
            {/* Tabs Header */}
            <div className="flex flex-wrap gap-2.5 mb-8 justify-start items-center">
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
                    className={`relative px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap select-none overflow-hidden border ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-[#FAF7F2] text-[#6E6A60] border-[#E5E0D5] hover:border-primary hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Tabs Content Container */}
            <div className="pdp-tabs-content p-6 md:p-10 bg-[#FAF9F6] border border-[#E5E0D5] rounded-2xl shadow-sm">
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
                  <p className="font-semibold text-primary text-[16px] mb-3">100% Organic Raw Ingredients.</p>
                  <p className="text-[#6E6A60]">No preservatives, artificial colors, or flavors added. Carefully sourced and hygienically packed to preserve freshness and nutrition value.</p>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="max-w-3xl">
                  <h4 className="font-heading font-bold text-black text-[17px] mb-6">Customer Reviews</h4>
                  <div className="divide-y divide-[#E5E0D5]/50">
                    <div className="pb-6 text-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex text-[#ffc107]">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={14} className="fill-current text-[#ffc107]" />
                          ))}
                        </div>
                        <span className="font-bold text-[#2E3737]">Arun K.</span>
                        <span className="text-xs text-[#6E6A60] ml-auto">2 days ago</span>
                      </div>
                      <p className="text-[#6E6A60] font-body leading-[1.7] text-[14.5px]">Absolutely love the quality! It tastes just like how my grandmother used to make it. Will definitely reorder.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-20">
            <h2 className="text-center font-heading font-extrabold text-2xl sm:text-3xl text-[#1B1B1B] mb-8">Related Products</h2>
            <div className="snap-row pb-3">
              {staticProducts.slice(0, 4).map(prod => (
                <div key={prod.id} className="min-w-[72%] sm:min-w-[45%] lg:min-w-[24%]">
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
