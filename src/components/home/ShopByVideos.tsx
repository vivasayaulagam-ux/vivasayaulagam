"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ChevronLeft, ChevronRight, ExternalLink, Play, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toWeightKg } from "@/lib/shipping";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

const getPlayableVideoUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

export default function ShopByVideos() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const [toastId, setToastId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("Shop By Videos");
  const [instagramLink, setInstagramLink] = useState("https://instagram.com/vivasaya_ullagam");
  const [youtubeLink, setYoutubeLink] = useState("https://youtube.com/@vivasayauallagam");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active video reel playing in modal overlay
  const [activeVideo, setActiveVideo] = useState<any>(null);

  useEffect(() => {
    async function loadSettingsAndReels() {
      try {
        // Load Settings
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings?.social_media_settings) {
          const s = settingsData.settings.social_media_settings;
          setEnabled(s.enabled !== false);
          setTitle(s.title || "Shop By Videos");
          setInstagramLink(s.instagramLink || "https://instagram.com/vivasaya_ullagam");
          setYoutubeLink(s.youtubeLink || "https://youtube.com/@vivasayauallagam");
        }

        // Load Synced Reels
        const reelsRes = await fetch("/api/social/instagram/reels");
        const reelsData = await reelsRes.json();
        if (reelsData.success && reelsData.videos) {
          setVideos(reelsData.videos.filter((v: any) => v.isActive !== false));
        }
      } catch (err) {
        console.error("Failed to load reels data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettingsAndReels();
  }, []);

  const handleAddToCart = (vid: any, isModal = false) => {
    const product = vid.taggedProductId;
    const finalId = product ? product._id : `video-${vid._id || vid.id}`;
    const finalName = product ? product.title : vid.title;
    const finalPrice = product ? product.price : (vid.price || 150);
    const finalImage = product ? (product.images?.[0] || vid.img) : vid.img;
    const finalWeight = product ? toWeightKg(product.weight, product.weightUnit || 'kg') : 0.25;

    addItem({
      id: finalId,
      name: finalName,
      price: finalPrice,
      quantity: 1,
      image: finalImage,
      weight: finalWeight
    } as any);

    setToastId(vid._id || String(vid.id));
    setTimeout(() => setToastId(null), 2000);
  };

  const handlePrevVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeVideo) return;
    const currentIndex = videos.findIndex(v => (v._id || v.id) === (activeVideo._id || activeVideo.id));
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
      setActiveVideo(videos[prevIndex]);
    }
  };

  const handleNextVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeVideo) return;
    const currentIndex = videos.findIndex(v => (v._id || v.id) === (activeVideo._id || activeVideo.id));
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % videos.length;
      setActiveVideo(videos[nextIndex]);
    }
  };

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (!enabled || loading || videos.length === 0) return null;

  return (
    <section className="bg-white pb-[38px] font-body text-[#222222]">
      <div className="vivasaya-container relative group">
        <h2 className="vivasaya-section-title mb-[34px]">{title}</h2>

        <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="sr-only">
          YouTube Channel
        </a>
        <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="sr-only">
          Instagram Reels
        </a>

        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-[55%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#222222] shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-150 transition-all hover:bg-[#f7f7f7] lg:flex cursor-pointer"
          aria-label="Scroll videos left"
        >
          <ChevronLeft size={24} />
        </button>

        <div ref={scrollRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 px-2">
          {videos.map((vid, index) => {
            const product = vid.taggedProductId;
            const finalTitle = product ? product.title : vid.title;
            const finalPrice = product ? `₹${product.price.toFixed(2)}` : `₹${Number(vid.price || 150).toFixed(2)}`;
            const finalImage = product ? (product.images?.[0] || vid.img) : vid.img;

            return (
              <motion.div
                key={vid._id || vid.id}
                initial={false}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group/card relative h-[285px] min-w-[160px] sm:h-[400px] sm:min-w-[225px] md:h-[450px] md:min-w-[260px] flex-shrink-0 snap-start overflow-hidden rounded-[20px] bg-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <button
                  type="button"
                  onClick={() => setActiveVideo(vid)}
                  className="absolute inset-0 z-0 h-full w-full cursor-pointer p-0 border-0 outline-none"
                  aria-label={`Play ${finalTitle}`}
                >
                  <video
                    src={getPlayableVideoUrl(vid.videoUrl)}
                    poster={getPlayableVideoUrl(finalImage)}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted={true}
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <span className="absolute inset-0 bg-black/10 transition-colors group-hover/card:bg-black/20" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveVideo(vid)}
                  className="absolute left-1/2 top-1/2 z-10 flex h-[52px] w-[52px] sm:h-[58px] sm:w-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[2px] border-white bg-black/30 text-white transition-all duration-300 group-hover/card:scale-105 hover:bg-black/45 cursor-pointer outline-none shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                  aria-label={`Open ${finalTitle} video`}
                >
                  <Play className="ml-0.5 fill-white text-white" size={20} />
                </button>

                {/* Hover overlay product details card */}
                <div className="absolute bottom-[16px] left-[14px] right-[14px] z-20 hidden md:flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-md border border-gray-100 transition-all">
                  <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-150 flex items-center justify-center">
                    {finalImage && (finalImage.startsWith("/") || finalImage.startsWith("http") || finalImage.startsWith("data:") || finalImage.includes(".")) ? (
                      <Image src={getPlayableVideoUrl(finalImage)} alt="" fill loading="lazy" sizes="44px" quality={75} placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl">{finalImage || "🌿"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xs font-bold leading-snug text-[#222222]">{finalTitle}</h3>
                    <p className="mt-0.5 text-xs font-extrabold text-primary">{finalPrice}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(vid);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dddddd] hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white"
                    aria-label={`Add ${finalTitle} to cart`}
                  >
                    <AnimatePresence mode="wait">
                      {toastId === (vid._id || String(vid.id)) ? (
                        <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-500">
                          <CheckCircle size={17} />
                        </motion.span>
                      ) : (
                        <motion.span key="bag" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <ShoppingBag size={15} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <a
                    href={instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dddddd] text-gray-400 hover:text-primary hover:border-primary transition-colors"
                    aria-label="Open social video"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-[55%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#222222] shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-150 transition-all hover:bg-[#f7f7f7] lg:flex cursor-pointer"
          aria-label="Scroll videos right"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dynamic Video Modal Player with Tagged Product Overlay */}
      <AnimatePresence>
        {activeVideo && (() => {
          const product = activeVideo.taggedProductId;
          const finalTitle = product ? product.title : activeVideo.title;
          const finalPrice = product ? `₹${product.price.toFixed(2)}` : `₹${Number(activeVideo.price || 150).toFixed(2)}`;
          const finalImage = product ? (product.images?.[0] || activeVideo.img) : activeVideo.img;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
              onClick={() => setActiveVideo(null)}
            >
              {/* Close Button outside to avoid native controls event interception */}
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute right-6 top-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border-0 cursor-pointer backdrop-blur-[4px]"
                aria-label="Close video"
              >
                <X size={22} />
              </button>

              {/* Navigation and Video wrapper */}
              <div className="relative w-full max-w-sm flex items-center justify-center">
                {/* Previous Video Button (Desktop) */}
                <button
                  onClick={handlePrevVideo}
                  className="absolute -left-16 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border-0 cursor-pointer backdrop-blur-[2px]"
                  aria-label="Previous video"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Previous Video Button (Mobile overlayed) */}
                <button
                  onClick={handlePrevVideo}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors border-0 cursor-pointer backdrop-blur-[2px]"
                  aria-label="Previous video"
                >
                  <ChevronLeft size={20} />
                </button>

                <div 
                  className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black shadow-2xl border border-white/5 flex flex-col justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* HTML5 Native Video Tag */}
                  <video
                    src={getPlayableVideoUrl(activeVideo.videoUrl)}
                    poster={getPlayableVideoUrl(finalImage)}
                    className="absolute inset-0 h-full w-full object-cover z-10"
                    autoPlay
                    loop
                    controls={true}
                    playsInline
                  />

                  {/* Floating Tagged Product Overlay at the bottom */}
                  <div className="relative z-20 m-4 p-3 bg-white/95 backdrop-blur-[4px] rounded-xl border border-white/20 shadow-xl flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-150 shrink-0 flex items-center justify-center">
                      {finalImage && (finalImage.startsWith("/") || finalImage.startsWith("http") || finalImage.startsWith("data:") || finalImage.includes(".")) ? (
                        <Image src={getPlayableVideoUrl(finalImage)} alt="" fill loading="lazy" sizes="48px" quality={75} placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl">{finalImage || "🌿"}</span>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black uppercase text-primary tracking-widest block mb-0.5">Tagged Product</span>
                      <h4 className="truncate text-xs font-extrabold text-[#111]">{finalTitle}</h4>
                      <p className="text-xs font-black text-primary mt-0.5">{finalPrice}</p>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCart(activeVideo, true)}
                      className="bg-[#34a121] hover:bg-[#154b29] text-white text-[11px] font-bold py-2 px-3 rounded-lg border-0 cursor-pointer transition-colors flex items-center gap-1 shadow-sm shrink-0"
                    >
                      <AnimatePresence mode="wait">
                        {toastId === (activeVideo._id || String(activeVideo.id)) ? (
                          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-0.5">
                            <CheckCircle size={11} /> ADDED
                          </motion.span>
                        ) : (
                          <motion.span key="bag" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-0.5">
                            <ShoppingBag size={11} /> ADD TO CART
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                {/* Next Video Button (Desktop) */}
                <button
                  onClick={handleNextVideo}
                  className="absolute -right-16 top-1/2 -translate-y-1/2 z-50 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors border-0 cursor-pointer backdrop-blur-[2px]"
                  aria-label="Next video"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Next Video Button (Mobile overlayed) */}
                <button
                  onClick={handleNextVideo}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-50 flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors border-0 cursor-pointer backdrop-blur-[2px]"
                  aria-label="Next video"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
