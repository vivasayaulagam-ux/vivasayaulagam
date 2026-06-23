"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getImageProps } from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export type BannerSlide = {
  id?: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  link?: string;
  headline?: string;
  subtitle?: string;
};

export type BannerSliderSettings = {
  banner_slides?: BannerSlide[];
  banner_timer?: number;        // seconds between slides, default 5
  banner_height_desktop?: number; // px, default 560
  banner_height_mobile?: number;  // px, default 320
  banner_show_arrows?: boolean;
  banner_show_dots?: boolean;
};

const DEFAULT_TIMER = 5;
const DEFAULT_HEIGHT_DESKTOP = 560;

export default function BannerSlider({
  settings,
}: {
  settings?: BannerSliderSettings;
}) {
  const slides: BannerSlide[] =
    settings?.banner_slides && settings.banner_slides.length > 0
      ? settings.banner_slides
      : [
          {
            id: "default",
            image: "/banner.jpg",
            link: "/shop",
            headline: "Pure Organic Foods, Direct From Tamil Nadu Farms",
            subtitle:
              "Traditional staples, cold-pressed oils, native grains, and clean pantry essentials.",
          },
        ];

  const timer = (settings?.banner_timer ?? DEFAULT_TIMER) * 1000;
  const heightDesktop = settings?.banner_height_desktop ?? DEFAULT_HEIGHT_DESKTOP;
  const showArrows = settings?.banner_show_arrows !== false;
  const showDots = settings?.banner_show_dots !== false;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch / swipe state
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
    setResetTimer((prev) => prev + 1);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setResetTimer((prev) => prev + 1);
  }, [slides.length]);

  const handleDotClick = (idx: number) => {
    setCurrent(idx);
    setResetTimer((prev) => prev + 1);
  };

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    intervalRef.current = setInterval(next, timer);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next, paused, timer, slides.length, resetTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="banner-slider-section relative w-full overflow-hidden"
      aria-label="Banner slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: `${heightDesktop}px`,
        height: `${heightDesktop}px`,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .banner-slider-section {
            min-height: unset !important;
            height: auto !important;
            background-color: #f8f8f5;
          }
          .banner-slider-section .banner-slide {
            position: relative !important;
          }
          .banner-slider-section .banner-slide-link,
          .banner-slider-section picture {
            display: block;
            height: auto !important;
            width: 100% !important;
          }
          .banner-slider-section img {
            object-fit: contain !important;
            object-position: center center !important;
            width: 100% !important;
            height: auto !important;
            position: static !important;
          }
        }
      `}</style>

      {/* Slides Container */}
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, idx) => {
          const isActive = idx === current;
          const desktopImage = slide.desktopImage || slide.image;
          const mobileImage = slide.mobileImage || desktopImage;
          const commonImageProps = {
            alt: slide.headline ?? `Banner slide ${idx + 1}`,
            quality: 80 as const,
          };

          const isPreload = idx === 0 || idx === current || idx === (current + 1) % slides.length;

          const { props: desktopImageProps } = getImageProps({
            ...commonImageProps,
            src: desktopImage,
            width: 1920,
            height: 800,
            sizes: "100vw",
            loading: isPreload ? "eager" : "lazy",
            priority: idx === 0,
          });

          const { props: mobileImageProps } = getImageProps({
            ...commonImageProps,
            src: mobileImage,
            width: 1080,
            height: 1350,
            sizes: "100vw",
            loading: isPreload ? "eager" : "lazy",
            priority: idx === 0,
          });

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1 : 1.025 
              }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              style={{
                pointerEvents: isActive ? "auto" : "none",
                zIndex: isActive ? 10 : 0,
                willChange: "transform, opacity",
                backgroundColor: "#f8f8f5", // Fallback color during image load
              }}
              className="banner-slide absolute inset-0 w-full h-full"
            >
              {slide.link ? (
                <Link
                  href={slide.link}
                  className="banner-slide-link relative block h-full w-full"
                  aria-label={slide.headline ?? `Slide ${idx + 1}`}
                >
                  <picture>
                    <source media="(max-width: 768px)" srcSet={mobileImageProps.srcSet} />
                    <img {...desktopImageProps} alt={commonImageProps.alt} className="absolute inset-0 h-full w-full object-cover object-center" />
                  </picture>
                  {(slide.headline || slide.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                  )}
                </Link>
              ) : (
                <div className="relative h-full w-full">
                  <picture>
                    <source media="(max-width: 768px)" srcSet={mobileImageProps.srcSet} />
                    <img {...desktopImageProps} alt={commonImageProps.alt} className="absolute inset-0 h-full w-full object-cover object-center" />
                  </picture>
                  {(slide.headline || slide.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                  )}
                </div>
              )}

              {/* Headline / subtitle overlay */}
              {(slide.headline || slide.subtitle) && (
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-20 md:px-16 md:pb-14 z-20" style={{ display: "none" }}>
                  {slide.headline && (
                    <motion.h2
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 18 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-white text-xl font-bold md:text-3xl lg:text-4xl drop-shadow-lg max-w-2xl leading-tight"
                    >
                      {slide.headline}
                    </motion.h2>
                  )}
                  {slide.subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 14 }}
                      transition={{ delay: 0.35, duration: 0.5 }}
                      className="mt-2 text-white/85 text-sm md:text-base max-w-xl drop-shadow"
                    >
                      {slide.subtitle}
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Arrow navigation */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 md:h-12 md:w-12 cursor-pointer items-center justify-center rounded-full bg-white/80 text-[#163D14] shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-105 md:left-5"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 md:h-12 md:w-12 cursor-pointer items-center justify-center rounded-full bg-white/80 text-[#163D14] shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-105 md:right-5"
          >
            <ChevronRight size={22} strokeWidth={2.2} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === current
                  ? "w-7 h-2.5 bg-white shadow-md"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/20">
          <motion.div
            key={`progress-${current}-${resetTimer}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: timer / 1000, ease: "linear" }}
            className="h-full bg-[#3D7A1C]"
          />
        </div>
      )}
    </section>
  );
}
