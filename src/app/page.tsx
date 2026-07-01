"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroBanner from "@/components/home/HeroBanner";

// Lazy load below-the-fold components using dynamic imports
const CategoryGrid = dynamic(() => import("@/components/home/CategoryGrid"), { ssr: true });
const LargeFeaturedBanners = dynamic(() => import("@/components/home/LargeFeaturedBanners"), { ssr: true });
const ShopByVideos = dynamic(() => import("@/components/home/ShopByVideos"), { ssr: false });
const NewProducts = dynamic(() => import("@/components/home/NewProducts"), { ssr: true });
const ShopByConcern = dynamic(() => import("@/components/home/ShopByConcern"), { ssr: true });
const WhyUs = dynamic(() => import("@/components/home/WhyUs"), { ssr: true });
const LimitedDeals = dynamic(() => import("@/components/home/LimitedDeals"), { ssr: true });
const Certifications = dynamic(() => import("@/components/home/Certifications"), { ssr: true });

type HomeSettings = {
  // Legacy single-slide hero (kept for back-compat)
  hero_slides?: { image?: string; link?: string; headline?: string; subtitle?: string }[];

  // New multi-slide banner slider
  banner_slides?: { id?: string; image: string; desktopImage?: string; mobileImage?: string; link?: string; headline?: string; subtitle?: string }[];
  banner_timer?: number;
  banner_height_desktop?: number;
  banner_height_mobile?: number;
  banner_show_arrows?: boolean;
  banner_show_dots?: boolean;

  // Featured promo banners
  promo_left_link?: string;
  promo_right_link?: string;
  promo_left_image?: string;
  promo_right_image?: string;
  promo_left_title?: string;
  promo_right_title?: string;

  section_hero_enabled?: boolean;
  section_category_grid_enabled?: boolean;
  section_large_featured_banners_enabled?: boolean;
  section_shop_by_videos_enabled?: boolean;
  section_new_products_enabled?: boolean;
  section_shop_by_concern_enabled?: boolean;
  section_limited_deals_enabled?: boolean;
  section_why_us_enabled?: boolean;
  section_certifications_enabled?: boolean;
  section_category_grid_title?: string;
  section_new_products_title?: string;
  section_new_products_subtitle?: string;
  section_limited_deals_title?: string;
  section_limited_deals_subtitle?: string;
  why_choose_title?: string;
  why_choose_subtitle?: string;
  paddingTop?: number;
  paddingBottom?: number;
  section_certifications_title?: string;
  section_certifications_subtitle?: string;
};

export default function HomePage() {
  const pathname = usePathname();
  const [showBackTop, setShowBackTop] = useState(false);
  const [settings, setSettings] = useState<HomeSettings>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cache = (window as any).__vivasayaSettingsCache;
      if (cache) {
        setSettings(cache);
        setIsLoaded(true);
      }
    }

    async function loadSettings() {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
        const data = (await res.json()) as { success?: boolean; settings?: HomeSettings };
        if (data.success) {
          const settingsData = data.settings || {};
          setSettings(settingsData);
          setIsLoaded(true);
          if (typeof window !== "undefined") {
            (window as any).__vivasayaSettingsCache = settingsData;
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div key={pathname}>
      <Navbar />

      {/* Spacer so content never hides behind the fixed navbar */}
      <div className="hero-banner-container" />

      {settings.section_hero_enabled !== false && (
        <HeroBanner
          isLoading={!isLoaded}
          settings={{
            banner_slides: settings.banner_slides && settings.banner_slides.length > 0
              ? settings.banner_slides
              : settings.hero_slides?.map((s, i) => ({ id: `legacy-${i}`, image: s.image || '/banner.jpg', link: s.link, headline: s.headline, subtitle: s.subtitle })),
            banner_timer: settings.banner_timer,
            banner_height_desktop: settings.banner_height_desktop,
            banner_height_mobile: settings.banner_height_mobile,
            banner_show_arrows: settings.banner_show_arrows,
            banner_show_dots: settings.banner_show_dots,
          }}
        />
      )}
      {settings.section_category_grid_enabled !== false && <CategoryGrid settings={settings} />}
      {settings.section_large_featured_banners_enabled !== false && <LargeFeaturedBanners settings={{ promo_left_link: settings.promo_left_link, promo_right_link: settings.promo_right_link, promo_left_image: settings.promo_left_image, promo_right_image: settings.promo_right_image, promo_left_title: settings.promo_left_title, promo_right_title: settings.promo_right_title }} />}
      {settings.section_shop_by_videos_enabled !== false && <ShopByVideos />}
      {settings.section_new_products_enabled !== false && <NewProducts settings={settings} />}
      {settings.section_shop_by_concern_enabled !== false && <ShopByConcern />}
      {settings.section_why_us_enabled !== false && <WhyUs settings={settings} />}
      {settings.section_limited_deals_enabled !== false && <LimitedDeals settings={settings} />}
      {settings.section_certifications_enabled !== false && <Certifications settings={settings} />}

      <Footer />

      <AnimatePresence>
        {showBackTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex items-center justify-center text-dark hover:text-primary hover:bg-secondary transition-all duration-300 z-50 fixed shadow-lg cursor-pointer"
            style={{ 
              width: "64px", 
              height: "64px", 
              bottom: "96px", 
              right: "32px", 
              backgroundColor: "var(--color-surface)", 
              border: "1px solid var(--organic-border)",
              borderRadius: "999px"
            }}
          >
            <ArrowUp size={28} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
